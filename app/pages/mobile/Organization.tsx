import { useCallback, useEffect, useMemo, useState } from "react"

import { Building2, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { useAppSelector } from "~/app/hooks"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"
import { Button } from "~/components/ui/button"
import {
  GenericDialog,
  GenericDialogFooter,
} from "~/components/ui/generic-dialog"
import { Input } from "~/components/ui/input"
import { Skeleton } from "~/components/ui/skeleton"
import {
  createTenantContractor,
  deleteTenantContractor,
  listTenantContractors,
  updateTenantContractor,
} from "~/features/contractors/tenant-api"
import type {
  CreateTenantContractorBody,
  UpdateTenantContractorBody,
} from "~/types/tenant-contractor"
import type { Contractor } from "~/types/vehicle"

const NAME_LEN = { min: 1, max: 200 } as const
const MOBILE_RE = /^\+?[0-9]{8,15}$/

function parseWorkTypeIds(raw: string): string[] | null {
  const ids = raw
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  const uniq = [...new Set(ids)]
  if (uniq.length > 100) {
    return null
  }
  const hex = /^[a-f0-9]{24}$/i
  if (!uniq.every((id) => hex.test(id))) {
    return null
  }
  return uniq
}

function validateBody(fields: {
  name: string
  contactPerson: string
  mobileNumber: string
  email: string
  workTypeIdsRaw: string
}): CreateTenantContractorBody | string {
  const name = fields.name.trim()
  const contactPerson = fields.contactPerson.trim()
  const mobileNumber = fields.mobileNumber.trim()
  const email = fields.email.trim()

  if (
    name.length < NAME_LEN.min ||
    name.length > NAME_LEN.max ||
    contactPerson.length < NAME_LEN.min ||
    contactPerson.length > NAME_LEN.max
  ) {
    return "Name and contact person must be 1–200 characters."
  }
  if (!MOBILE_RE.test(mobileNumber)) {
    return "Mobile number must be 8–15 digits, optional leading +."
  }
  if (!email || email.length > 320 || !email.includes("@")) {
    return "Enter a valid email (max 320 characters)."
  }

  const wtRaw = fields.workTypeIdsRaw.trim()
  let workTypeIds: string[] | undefined
  if (wtRaw) {
    const parsed = parseWorkTypeIds(wtRaw)
    if (!parsed) {
      return "Work type IDs: max 100 unique 24-character hex values."
    }
    workTypeIds = parsed
  }

  return { name, contactPerson, mobileNumber, email, workTypeIds }
}

export default function Organization() {
  const contractorId = useAppSelector((s) => s.auth.contractorId)

  const [profile, setProfile] = useState<Contractor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState("")
  const [contactPerson, setContactPerson] = useState("")
  const [mobileNumber, setMobileNumber] = useState("")
  const [email, setEmail] = useState("")
  const [workTypeIdsRaw, setWorkTypeIdsRaw] = useState("")
  const [saving, setSaving] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadProfile = useCallback(async () => {
    if (!contractorId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { items } = await listTenantContractors({ page: 1, limit: 20 })
      const row = items[0] ?? null
      setProfile(row)
      if (row) {
        setName(row.name)
        setContactPerson(row.contactPerson)
        setMobileNumber(row.mobileNumber)
        setEmail(row.email)
        setWorkTypeIdsRaw("")
      } else {
        setName("")
        setContactPerson("")
        setMobileNumber("")
        setEmail("")
        setWorkTypeIdsRaw("")
      }
      setIsEditing(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load organization")
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [contractorId])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const resetFormFromProfile = useCallback((row: Contractor) => {
    setName(row.name)
    setContactPerson(row.contactPerson)
    setMobileNumber(row.mobileNumber)
    setEmail(row.email)
    setWorkTypeIdsRaw("")
  }, [])

  const handleCreate = async () => {
    const validated = validateBody({
      name,
      contactPerson,
      mobileNumber,
      email,
      workTypeIdsRaw,
    })
    if (typeof validated === "string") {
      toast.error(validated)
      return
    }
    setSaving(true)
    try {
      const created = await createTenantContractor(validated)
      setProfile(created)
      resetFormFromProfile(created)
      toast.success("Organization profile created")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create failed")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!contractorId || !profile) {
      return
    }
    const validated = validateBody({
      name,
      contactPerson,
      mobileNumber,
      email,
      workTypeIdsRaw,
    })
    if (typeof validated === "string") {
      toast.error(validated)
      return
    }
    setSaving(true)
    try {
      const patch: UpdateTenantContractorBody = {
        name: validated.name,
        contactPerson: validated.contactPerson,
        mobileNumber: validated.mobileNumber,
        email: validated.email,
      }
      if (validated.workTypeIds !== undefined) {
        patch.workTypeIds = validated.workTypeIds
      }
      const updated = await updateTenantContractor(contractorId, patch)
      setProfile(updated)
      resetFormFromProfile(updated)
      setIsEditing(false)
      toast.success("Organization updated")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!contractorId) {
      return
    }
    setDeleting(true)
    try {
      await deleteTenantContractor(contractorId)
      setProfile(null)
      setDeleteOpen(false)
      setName("")
      setContactPerson("")
      setMobileNumber("")
      setEmail("")
      setWorkTypeIdsRaw("")
      toast.success("Organization removed")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed")
    } finally {
      setDeleting(false)
    }
  }

  const workTypes = profile?.workTypeIds ?? []

  const headerMeta = useMemo(
    () =>
      contractorId
        ? `Tenant scope · ${contractorId.slice(-6)}`
        : "No tenant scope",
    [contractorId]
  )

  if (!contractorId) {
    return (
      <div className="space-y-4 pb-8">
        <div className="flex items-center gap-2">
          <Building2 className="size-6 text-primary" />
          <h1 className="font-heading text-xl font-semibold text-foreground">
            Organization
          </h1>
        </div>
        <Alert>
          <AlertTitle>Tenant account required</AlertTitle>
          <AlertDescription>
            Organization profile is available when your account is linked to a
            contractor (JWT <code className="text-xs">contractorId</code>).
            Superadmin tokens cannot use tenant write routes here.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="size-6 text-primary" />
            <h1 className="font-heading text-xl font-semibold text-foreground">
              Organization
            </h1>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{headerMeta}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-36 w-full rounded-2xl" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load profile</AlertTitle>
          <AlertDescription className="flex flex-col gap-3">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => loadProfile()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : !profile ? (
        <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <p className="mb-4 text-sm text-muted-foreground">
            No organization profile yet. Create one for your tenant (allowed by
            API when your token is not superadmin).
          </p>
          <div className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="org-name"
                className="text-sm font-medium text-foreground"
              >
                Name
              </label>
              <Input
                id="org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="organization"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="org-contact"
                className="text-sm font-medium text-foreground"
              >
                Contact person
              </label>
              <Input
                id="org-contact"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="org-mobile"
                className="text-sm font-medium text-foreground"
              >
                Mobile number
              </label>
              <Input
                id="org-mobile"
                inputMode="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="org-email"
                className="text-sm font-medium text-foreground"
              >
                Email
              </label>
              <Input
                id="org-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="org-wt"
                className="text-sm font-medium text-foreground"
              >
                Work type IDs{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <textarea
                id="org-wt"
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[72px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Comma or space separated 24-char hex IDs"
                value={workTypeIdsRaw}
                onChange={(e) => setWorkTypeIdsRaw(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              disabled={saving}
              onClick={() => void handleCreate()}
            >
              {saving ? "Creating…" : "Create organization"}
            </Button>
          </div>
        </section>
      ) : (
        <>
          <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Registered name
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {profile.name}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  aria-label="Edit organization"
                  disabled={isEditing}
                  onClick={() => {
                    resetFormFromProfile(profile)
                    setIsEditing(true)
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 text-destructive"
                  aria-label="Remove organization"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-4 border-t border-border/60 pt-4">
                <div className="space-y-2">
                  <label
                    htmlFor="edit-name"
                    className="text-sm font-medium text-foreground"
                  >
                    Name
                  </label>
                  <Input
                    id="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="edit-contact"
                    className="text-sm font-medium text-foreground"
                  >
                    Contact person
                  </label>
                  <Input
                    id="edit-contact"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="edit-mobile"
                    className="text-sm font-medium text-foreground"
                  >
                    Mobile number
                  </label>
                  <Input
                    id="edit-mobile"
                    inputMode="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="edit-email"
                    className="text-sm font-medium text-foreground"
                  >
                    Email
                  </label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="edit-wt"
                    className="text-sm font-medium text-foreground"
                  >
                    Replace work type IDs{" "}
                    <span className="font-normal text-muted-foreground">
                      (optional — leave blank to keep current)
                    </span>
                  </label>
                  <textarea
                    id="edit-wt"
                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[72px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Leave blank to keep existing assignments"
                    value={workTypeIdsRaw}
                    onChange={(e) => setWorkTypeIdsRaw(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={saving}
                    onClick={() => {
                      resetFormFromProfile(profile)
                      setIsEditing(false)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={saving}
                    onClick={() => void handleSaveEdit()}
                  >
                    {saving ? "Saving…" : "Save"}
                  </Button>
                </div>
              </div>
            ) : (
              <dl className="grid gap-3 border-t border-border/60 pt-4 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">
                    Contact person
                  </dt>
                  <dd className="font-medium">{profile.contactPerson}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Mobile</dt>
                  <dd className="font-medium">{profile.mobileNumber}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Email</dt>
                  <dd className="font-medium break-all">{profile.email}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Status</dt>
                  <dd className="font-medium">{profile.status}</dd>
                </div>
              </dl>
            )}
          </section>

          {workTypes.length > 0 ? (
            <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
              <p className="mb-3 text-sm font-medium text-foreground">
                Work types
              </p>
              <ul className="flex flex-wrap gap-2">
                {workTypes.map((wt, i) => (
                  <li
                    key={`${wt.code}-${i}`}
                    className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground"
                  >
                    {wt.name}{" "}
                    <span className="text-muted-foreground">({wt.code})</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}

      <GenericDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Remove organization?"
        description="This soft-deletes your contractor profile for this tenant. You may need administrator help to restore access."
        footer={
          <GenericDialogFooter>
            <Button
              variant="outline"
              disabled={deleting}
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={() => void handleDelete()}
            >
              {deleting ? "Removing…" : "Remove"}
            </Button>
          </GenericDialogFooter>
        }
      >
        {null}
      </GenericDialog>
    </div>
  )
}
