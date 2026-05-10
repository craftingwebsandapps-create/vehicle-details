import { useEffect, useMemo, useState } from "react"

import { toast } from "sonner"

import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  dialogActionsFooterClass,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { FormBuilder } from "~/components/form/FormBuilder"
import { isValidObjectId } from "~/features/admin/contractors-admin-api"
import { createAdminUser, updateAdminUser } from "~/features/admin/users-admin-api"
import {
  getAdminUserDialogFormConfig,
  type AdminUserDialogFormValues,
} from "~/schemas/admin-user-dialog-form-config"
import type { AdminUser, UpdateAdminUserPayload } from "~/types/admin-user"
import type { Contractor } from "~/types/vehicle"
import { getApiErrorMeta } from "~/services/api-error"

type LinkMode = "superadmin" | "tenant"

type AdminUserFormDialogProps = {
  mode: "create" | "edit"
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: AdminUser | null
  contractors: Contractor[]
  contractorsLoading: boolean
  onSaved: () => void
}

function buildEditPatch(
  original: AdminUser,
  name: string,
  email: string,
  passwordRaw: string,
  linkMode: LinkMode,
  tenantContractorId: string
): UpdateAdminUserPayload {
  const patch: UpdateAdminUserPayload = {}
  const nt = name.trim()
  const em = email.trim()
  if (nt !== original.name) {
    patch.name = nt
  }
  if (em !== original.email) {
    patch.email = em
  }
  const pw = passwordRaw.trim()
  if (pw.length > 0) {
    patch.password = pw
  }

  if (linkMode === "superadmin") {
    if (original.contractorId !== null) {
      patch.contractorId = null
    }
  } else {
    const cid = tenantContractorId.trim()
    if (!isValidObjectId(cid)) {
      throw new Error("Select a contractor for tenant users.")
    }
    if (cid !== original.contractorId) {
      patch.contractorId = cid
    }
  }

  const hasChange =
    patch.name !== undefined ||
    patch.email !== undefined ||
    patch.password !== undefined ||
    patch.contractorId !== undefined

  if (!hasChange) {
    throw new Error("No changes to save.")
  }

  return patch
}

export function AdminUserFormDialog({
  mode,
  open,
  onOpenChange,
  user,
  contractors,
  contractorsLoading,
  onSaved,
}: AdminUserFormDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitCode, setSubmitCode] = useState<string | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)

  const contractorChoices = useMemo(() => {
    const list = [...contractors]
    if (
      mode === "edit" &&
      user?.contractorId &&
      !list.some((c) => c._id === user.contractorId)
    ) {
      list.unshift({
        _id: user.contractorId,
        name: user.contractor?.name ?? `Contractor ${user.contractorId}`,
        contactPerson: user.contractor?.contactPerson ?? "",
        mobileNumber: user.contractor?.mobileNumber ?? "",
        email: user.contractor?.email ?? "",
        createdAt: "",
        updatedAt: "",
      })
    }
    return list
  }, [contractors, mode, user])

  useEffect(() => {
    if (!open) return
    setSubmitError(null)
    setSubmitCode(undefined)
  }, [open])

  const defaultValues = useMemo<Partial<AdminUserDialogFormValues>>(() => {
    if (mode === "edit" && user) {
      return {
        name: user.name ?? "",
        email: user.email ?? "",
        password: "",
        linkMode: user.contractorId === null ? "superadmin" : "tenant",
        contractorId: user.contractorId ?? "",
      }
    }
    return {
      name: "",
      email: "",
      password: "",
      linkMode: "superadmin",
      contractorId: "",
    }
  }, [mode, user])

  const contractorOptions = useMemo(
    () => contractorChoices.map((c) => ({ label: c.name, value: c._id })),
    [contractorChoices]
  )

  const contractorDisabled = contractorsLoading || contractorOptions.length === 0

  const formConfig = useMemo(
    () =>
      getAdminUserDialogFormConfig({
        mode,
        contractorOptions,
        contractorDisabled,
      }),
    [mode, contractorOptions, contractorDisabled]
  )

  const handleSubmit = async (values: AdminUserDialogFormValues) => {
    setSubmitError(null)
    setSubmitCode(undefined)

    const nt = values.name.trim()
    const em = values.email.trim()
    const pw = values.password.trim()
    const linkMode = values.linkMode as LinkMode
    const tenantContractorId = values.contractorId.trim()

    setSubmitting(true)
    try {
      if (mode === "create") {
        await createAdminUser(
          linkMode === "tenant"
            ? {
                name: nt,
                email: em,
                password: pw,
                contractorId: tenantContractorId,
              }
            : { name: nt, email: em, password: pw }
        )
        toast.success("User created")
        onSaved()
        onOpenChange(false)
        return
      }

      if (!user) return

      const patch = buildEditPatch(
        user,
        nt,
        em,
        pw,
        linkMode,
        tenantContractorId
      )
      await updateAdminUser(user.id, patch)
      toast.success("User updated")
      onSaved()
      onOpenChange(false)
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "No changes to save.") {
        toast.info(e.message)
      } else {
        const meta = getApiErrorMeta(e)
        setSubmitError(meta.message)
        setSubmitCode(meta.code)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,760px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-border shrink-0 border-b p-6 pb-4">
          <DialogTitle>
            {mode === "create" ? "Create user" : "Edit user"}
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <FormBuilder
            config={formConfig}
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            isSubmitting={submitting}
            hideButtons
            className="space-y-4"
          />

          {contractorOptions.length === 0 && !contractorsLoading ? (
            <p className="text-muted-foreground text-xs">
              No contractors loaded — open Contractors page or refresh list.
            </p>
          ) : null}

          {submitError ? (
            <div className="text-destructive text-sm">
              <p>{submitError}</p>
              {submitCode ? (
                <p className="text-muted-foreground mt-1 font-mono text-xs">
                  {submitCode}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className={dialogActionsFooterClass}>
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={formConfig.id}
            disabled={submitting}
          >
            {submitting ? "Saving…" : mode === "create" ? "Create" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
