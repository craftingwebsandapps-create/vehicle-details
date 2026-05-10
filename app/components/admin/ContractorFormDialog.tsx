import { useEffect, useMemo, useState } from "react"

import { toast } from "sonner"

import { Button } from "~/components/ui/button"
import { Checkbox } from "~/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  dialogActionsFooterClass,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { createContractor, updateContractor } from "~/features/admin/contractors-admin-api"
import { listWorkTypesForPicker } from "~/features/admin/work-types-api"
import type { WorkTypePickerItem } from "~/types/work-type"
import type { Contractor } from "~/types/vehicle"
import { getApiErrorMeta } from "~/services/api-error"

const NAME_RANGE = { min: 1, max: 200 } as const
const MOBILE_RE = /^\+?[0-9]{8,15}$/

type ContractorFormDialogProps = {
  mode: "create" | "edit"
  open: boolean
  onOpenChange: (open: boolean) => void
  contractor?: Contractor | null
  onSaved: () => void
}

function normalizeMobile(raw: string) {
  return raw.replace(/\s+/g, "").trim()
}

function validatePayload(fields: {
  name: string
  contactPerson: string
  mobileNumber: string
  email: string
  selectedWt: Set<string>
}) {
  const name = fields.name.trim()
  const contactPerson = fields.contactPerson.trim()
  const mobileNumber = normalizeMobile(fields.mobileNumber)
  const email = fields.email.trim()

  if (
    name.length < NAME_RANGE.min ||
    name.length > NAME_RANGE.max ||
    contactPerson.length < NAME_RANGE.min ||
    contactPerson.length > NAME_RANGE.max
  ) {
    return "Name and contact person must be 1–200 characters."
  }
  if (!MOBILE_RE.test(mobileNumber)) {
    return "Mobile number must be 8–15 digits with optional leading + (spaces ignored)."
  }
  if (!email || email.length > 320 || !email.includes("@")) {
    return "Enter a valid email (max 320 characters)."
  }

  const wtIds = [...fields.selectedWt]
  if (wtIds.length > 100) {
    return "At most 100 work types."
  }
  const hex = /^[a-f0-9]{24}$/i
  if (!wtIds.every((id) => hex.test(id))) {
    return "Invalid work type selection."
  }

  return {
    name,
    contactPerson,
    mobileNumber,
    email,
    workTypeIds: wtIds.length > 0 ? wtIds : undefined,
  }
}

export function ContractorFormDialog({
  mode,
  open,
  onOpenChange,
  contractor,
  onSaved,
}: ContractorFormDialogProps) {
  const [name, setName] = useState("")
  const [contactPerson, setContactPerson] = useState("")
  const [mobileNumber, setMobileNumber] = useState("")
  const [email, setEmail] = useState("")
  const [selectedWt, setSelectedWt] = useState<Set<string>>(new Set())
  const [wtFilter, setWtFilter] = useState("")

  const [workTypes, setWorkTypes] = useState<WorkTypePickerItem[]>([])
  const [wtLoadError, setWtLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitCode, setSubmitCode] = useState<string | undefined>(undefined)
  const [loadingWt, setLoadingWt] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }
    if (mode === "edit" && contractor) {
      setName(contractor.name ?? "")
      setContactPerson(contractor.contactPerson ?? "")
      setMobileNumber(contractor.mobileNumber ?? "")
      setEmail(contractor.email ?? "")
      const ids = new Set<string>()
      for (const w of contractor.workTypeIds ?? []) {
        if (w._id) {
          ids.add(w._id)
        }
      }
      setSelectedWt(ids)
    } else if (mode === "create") {
      setName("")
      setContactPerson("")
      setMobileNumber("")
      setEmail("")
      setSelectedWt(new Set())
    }
    setWtFilter("")
    setSubmitError(null)
    setSubmitCode(undefined)
  }, [open, mode, contractor])

  useEffect(() => {
    if (!open) {
      return
    }
    let cancelled = false
    setLoadingWt(true)
    setWtLoadError(null)
    void listWorkTypesForPicker()
      .then((rows) => {
        if (!cancelled) {
          setWorkTypes(rows)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWorkTypes([])
          setWtLoadError(
            "Could not load work types (GET /api/work-types). You can still save without them or retry later."
          )
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingWt(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [open])

  const filteredWorkTypes = useMemo(() => {
    const q = wtFilter.trim().toLowerCase()
    if (!q) {
      return workTypes
    }
    return workTypes.filter(
      (w) =>
        w.name.toLowerCase().includes(q) || w.code.toLowerCase().includes(q)
    )
  }, [workTypes, wtFilter])

  const toggleWt = (id: string) => {
    setSelectedWt((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSubmit = async () => {
    setSubmitError(null)
    setSubmitCode(undefined)
    const validated = validatePayload({
      name,
      contactPerson,
      mobileNumber,
      email,
      selectedWt,
    })
    if (typeof validated === "string") {
      setSubmitError(validated)
      return
    }

    setSubmitting(true)
    try {
      if (mode === "create") {
        await createContractor(validated)
        toast.success("Contractor created")
      } else if (contractor) {
        await updateContractor(contractor._id, validated)
        toast.success("Contractor updated")
      }
      onSaved()
      onOpenChange(false)
    } catch (e: unknown) {
      const meta = getApiErrorMeta(e)
      setSubmitError(meta.message)
      setSubmitCode(meta.code)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-border shrink-0 border-b p-6 pb-4">
          <DialogTitle>
            {mode === "create" ? "Create contractor" : "Edit contractor"}
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="space-y-2">
            <label
              htmlFor="ctr-name"
              className="text-sm font-medium text-foreground"
            >
              Name
            </label>
            <Input
              id="ctr-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
              autoComplete="organization"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="ctr-contact"
              className="text-sm font-medium text-foreground"
            >
              Contact person
            </label>
            <Input
              id="ctr-contact"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="ctr-mobile"
              className="text-sm font-medium text-foreground"
            >
              Mobile number
            </label>
            <Input
              id="ctr-mobile"
              inputMode="tel"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="+919876543210"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="ctr-email"
              className="text-sm font-medium text-foreground"
            >
              Email
            </label>
            <Input
              id="ctr-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={320}
            />
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium text-foreground">
              Work types
            </span>
            <Input
              placeholder="Filter by name or code…"
              value={wtFilter}
              onChange={(e) => setWtFilter(e.target.value)}
              disabled={loadingWt || workTypes.length === 0}
            />
            {wtLoadError ? (
              <p className="text-muted-foreground text-xs">{wtLoadError}</p>
            ) : null}
            <div className="border-input max-h-48 overflow-y-auto rounded-md border p-2">
              {loadingWt ? (
                <p className="text-muted-foreground text-sm">Loading…</p>
              ) : filteredWorkTypes.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No work types match.
                </p>
              ) : (
                <ul className="space-y-2">
                  {filteredWorkTypes.map((w) => (
                    <li key={w._id} className="flex items-start gap-2">
                      <Checkbox
                        id={`wt-${w._id}`}
                        checked={selectedWt.has(w._id)}
                        onCheckedChange={() => toggleWt(w._id)}
                      />
                      <label
                        htmlFor={`wt-${w._id}`}
                        className="cursor-pointer text-sm leading-snug"
                      >
                        <span className="font-medium">{w.name}</span>{" "}
                        <span className="text-muted-foreground">({w.code})</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              {selectedWt.size} selected (max 100, unique)
            </p>
          </div>

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
