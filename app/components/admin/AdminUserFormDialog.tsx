import { useEffect, useMemo, useState } from "react"

import { toast } from "sonner"

import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  dialogActionsFooterClass,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { isValidObjectId } from "~/features/admin/contractors-admin-api"
import { createAdminUser, updateAdminUser } from "~/features/admin/users-admin-api"
import type { AdminUser, UpdateAdminUserPayload } from "~/types/admin-user"
import type { Contractor } from "~/types/vehicle"
import { getApiErrorMeta } from "~/services/api-error"

const NAME_RANGE = { min: 1, max: 200 } as const
const PW_MIN = 8
const PW_MAX = 128
const NONE_CONTRACTOR = "__none_contractor__"

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
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [linkMode, setLinkMode] = useState<LinkMode>("superadmin")
  const [tenantContractorId, setTenantContractorId] = useState("")

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
        status: "",
        createdAt: "",
        updatedAt: "",
      })
    }
    return list
  }, [contractors, mode, user])

  useEffect(() => {
    if (!open) {
      return
    }
    setSubmitError(null)
    setSubmitCode(undefined)
    if (mode === "edit" && user) {
      setName(user.name ?? "")
      setEmail(user.email ?? "")
      setPassword("")
      if (user.contractorId === null) {
        setLinkMode("superadmin")
        setTenantContractorId("")
      } else {
        setLinkMode("tenant")
        setTenantContractorId(user.contractorId)
      }
    } else if (mode === "create") {
      setName("")
      setEmail("")
      setPassword("")
      setLinkMode("superadmin")
      setTenantContractorId("")
    }
  }, [open, mode, user])

  const handleSubmit = async () => {
    setSubmitError(null)
    setSubmitCode(undefined)

    const nt = name.trim()
    const em = email.trim()
    if (
      nt.length < NAME_RANGE.min ||
      nt.length > NAME_RANGE.max ||
      em.length < 1 ||
      em.length > 320 ||
      !em.includes("@")
    ) {
      setSubmitError(
        "Name must be 1–200 characters and email must be valid (max 320)."
      )
      return
    }

    if (mode === "create") {
      const pw = password.trim()
      if (pw.length < PW_MIN || pw.length > PW_MAX) {
        setSubmitError(`Password must be ${PW_MIN}–${PW_MAX} characters.`)
        return
      }
      if (linkMode === "tenant") {
        const cid = tenantContractorId.trim()
        if (!isValidObjectId(cid)) {
          setSubmitError("Select a contractor for tenant users.")
          return
        }
        setSubmitting(true)
        try {
          await createAdminUser({
            name: nt,
            email: em,
            password: pw,
            contractorId: cid,
          })
          toast.success("User created")
          onSaved()
          onOpenChange(false)
        } catch (e: unknown) {
          const meta = getApiErrorMeta(e)
          setSubmitError(meta.message)
          setSubmitCode(meta.code)
        } finally {
          setSubmitting(false)
        }
        return
      }

      setSubmitting(true)
      try {
        await createAdminUser({
          name: nt,
          email: em,
          password: pw,
        })
        toast.success("User created")
        onSaved()
        onOpenChange(false)
      } catch (e: unknown) {
        const meta = getApiErrorMeta(e)
        setSubmitError(meta.message)
        setSubmitCode(meta.code)
      } finally {
        setSubmitting(false)
      }
      return
    }

    if (!user) {
      return
    }

    const pw = password.trim()
    if (pw.length > 0 && (pw.length < PW_MIN || pw.length > PW_MAX)) {
      setSubmitError(`Password must be ${PW_MIN}–${PW_MAX} characters.`)
      return
    }

    setSubmitting(true)
    try {
      const patch = buildEditPatch(
        user,
        nt,
        em,
        password,
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

  const contractorSelectDisabled =
    contractorsLoading || linkMode !== "tenant" || contractorChoices.length === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,760px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-border shrink-0 border-b p-6 pb-4">
          <DialogTitle>
            {mode === "create" ? "Create user" : "Edit user"}
          </DialogTitle>
          <DialogDescription>
            Superadmin-only ·{" "}
            <code className="text-xs">/api/admin/users</code>. Omit contractor to
            create a platform superadmin.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="space-y-2">
            <label
              htmlFor="usr-name"
              className="text-sm font-medium text-foreground"
            >
              Name
            </label>
            <Input
              id="usr-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="usr-email"
              className="text-sm font-medium text-foreground"
            >
              Email
            </label>
            <Input
              id="usr-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={320}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="usr-password"
              className="text-sm font-medium text-foreground"
            >
              Password{" "}
              {mode === "edit" ? (
                <span className="text-muted-foreground font-normal">
                  (optional — revokes sessions when changed)
                </span>
              ) : null}
            </label>
            <Input
              id="usr-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "create" ? "new-password" : "new-password"}
              maxLength={PW_MAX}
              placeholder={mode === "edit" ? "Leave blank to keep" : undefined}
            />
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium text-foreground">
              Account type
            </span>
            <Select
              value={linkMode}
              onValueChange={(v) => setLinkMode(v as LinkMode)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="superadmin">
                  Superadmin (no contractor)
                </SelectItem>
                <SelectItem value="tenant">Tenant (linked contractor)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {linkMode === "tenant" ? (
            <div className="space-y-2">
              <span className="text-sm font-medium text-foreground">
                Contractor
              </span>
              <Select
                value={tenantContractorId || NONE_CONTRACTOR}
                onValueChange={(v) =>
                  setTenantContractorId(v === NONE_CONTRACTOR ? "" : v)
                }
                disabled={contractorSelectDisabled}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select contractor…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_CONTRACTOR}>
                    Select contractor…
                  </SelectItem>
                  {contractorChoices.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {contractorChoices.length === 0 && !contractorsLoading ? (
                <p className="text-muted-foreground text-xs">
                  No contractors loaded — open Contractors page or refresh list.
                </p>
              ) : null}
            </div>
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
            type="button"
            disabled={submitting}
            onClick={() => void handleSubmit()}
          >
            {submitting ? "Saving…" : mode === "create" ? "Create" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
