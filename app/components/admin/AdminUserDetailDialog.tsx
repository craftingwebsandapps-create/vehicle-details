import { format } from "date-fns"
import { useEffect, useState } from "react"

import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Skeleton } from "~/components/ui/skeleton"
import { getAdminUser } from "~/features/admin/users-admin-api"
import type { AdminUser } from "~/types/admin-user"
import { getApiErrorMeta } from "~/services/api-error"

type AdminUserDetailDialogProps = {
  userId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function dash(value: string | undefined | null) {
  const v = value?.trim()
  return v && v.length > 0 ? v : "—"
}

function formatWhen(iso: string | undefined | null) {
  if (!iso) return "—"
  try {
    return format(new Date(iso), "PPpp")
  } catch {
    return iso
  }
}

export function AdminUserDetailDialog({
  userId,
  open,
  onOpenChange,
}: AdminUserDetailDialogProps) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [code, setCode] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!open || !userId) {
      setUser(null)
      setError(null)
      setCode(undefined)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    setCode(undefined)

    void getAdminUser(userId)
      .then((row) => {
        if (!cancelled) setUser(row)
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          const meta = getApiErrorMeta(e)
          setError(meta.message)
          setCode(meta.code)
          setUser(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, userId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,680px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-border shrink-0 border-b p-6 pb-4">
          <DialogTitle className="font-heading">
            {loading ? "Loading…" : dash(user?.name)}
          </DialogTitle>
          {userId ? (
            <p className="text-muted-foreground font-mono text-xs break-all">
              {userId}
            </p>
          ) : null}
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : error ? (
            <div className="text-destructive text-sm">
              <p>{error}</p>
              {code ? (
                <p className="text-muted-foreground mt-1 font-mono text-xs">
                  {code}
                </p>
              ) : null}
            </div>
          ) : user ? (
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs font-medium">
                  Email
                </dt>
                <dd className="break-all font-medium">{dash(user.email)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs font-medium">
                  Role
                </dt>
                <dd>
                  {user.contractorId === null ? (
                    <span className="font-medium">Superadmin</span>
                  ) : (
                    <span className="font-medium">Tenant</span>
                  )}
                </dd>
              </div>
              {user.contractor ? (
                <div>
                  <dt className="text-muted-foreground text-xs font-medium">
                    Contractor
                  </dt>
                  <dd>
                    <div className="font-medium">{user.contractor.name}</div>
                    <div className="text-muted-foreground text-xs">
                      {dash(user.contractor.email)} ·{" "}
                      {dash(user.contractor.contactPerson)}
                    </div>
                  </dd>
                </div>
              ) : user.contractorId ? (
                <div>
                  <dt className="text-muted-foreground text-xs font-medium">
                    Contractor id
                  </dt>
                  <dd className="font-mono text-xs">{user.contractorId}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-muted-foreground text-xs font-medium">
                  Created
                </dt>
                <dd>{formatWhen(user.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs font-medium">
                  Updated
                </dt>
                <dd>{formatWhen(user.updatedAt)}</dd>
              </div>
            </dl>
          ) : null}
        </div>

        <DialogFooter className="border-border shrink-0 gap-3 border-t px-6 py-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
