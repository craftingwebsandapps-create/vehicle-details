import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react"

import { format } from "date-fns"
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { AdminUserDetailDialog } from "~/components/admin/AdminUserDetailDialog"
import { AdminUserFormDialog } from "~/components/admin/AdminUserFormDialog"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"
import { Button } from "~/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Skeleton } from "~/components/ui/skeleton"
import {
  isValidObjectId,
  listContractors,
} from "~/features/admin/contractors-admin-api"
import {
  deleteAdminUser,
  listAdminUsers,
} from "~/features/admin/users-admin-api"
import { getAccessToken } from "~/features/auth/auth-storage"
import { getUserIdFromAccessToken } from "~/features/auth/jwt-utils"
import { useAppSelector } from "~/hooks"
import { getApiErrorMeta } from "~/services/api-error"
import type { AdminUser } from "~/types/admin-user"
import type { Contractor } from "~/types/vehicle"

const PAGE_SIZE = 20

const confirmDialogFooterClass =
  "mx-0 mb-0 mt-0 flex-row flex-wrap justify-end gap-3 border-0 bg-transparent p-0 pt-3 shadow-none"

const NONE_SCOPE_CONTRACTOR = "__none_scope_contractor__"

type ListScope = "all" | "superadmin" | "tenant" | "contractor"

function clampPage(p: number) {
  return Math.max(1, p)
}

function clampLimit(l: number) {
  return Math.min(100, Math.max(1, l))
}

function formatCell(value: string | undefined | null) {
  const v = value?.trim()
  return v && v.length > 0 ? v : "—"
}

function formatShortDate(iso: string | undefined | null) {
  if (!iso) return "—"
  try {
    return format(new Date(iso), "PP p")
  } catch {
    return iso
  }
}

export default function AdminUsers() {
  const contractorId = useAppSelector((s) => s.auth.contractorId)
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const superadminOnly =
    isAuthenticated && contractorId === null

  const selfUserId = getUserIdFromAccessToken(getAccessToken())

  const [items, setItems] = useState<AdminUser[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | undefined>(undefined)

  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [scope, setScope] = useState<ListScope>("all")
  const [scopeContractorId, setScopeContractorId] = useState("")

  const [contractors, setContractors] = useState<Contractor[]>([])
  const [contractorsLoading, setContractorsLoading] = useState(false)

  const [detailUserId, setDetailUserId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [formUser, setFormUser] = useState<AdminUser | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => window.clearTimeout(t)
  }, [query])

  useLayoutEffect(() => {
    setPage(1)
  }, [debouncedQuery, scope, scopeContractorId])

  const loadContractors = useCallback(async () => {
    setContractorsLoading(true)
    try {
      const res = await listContractors({ page: 1, limit: 100 })
      setContractors(res.data.items)
    } catch {
      setContractors([])
    } finally {
      setContractorsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!superadminOnly) {
      return
    }
    void loadContractors()
  }, [superadminOnly, loadContractors])

  const scopeContractorValid =
    scope !== "contractor" ||
    (scopeContractorId.length > 0 && isValidObjectId(scopeContractorId))

  const loadUsers = useCallback(async () => {
    if (!superadminOnly) {
      return
    }
    if (scope === "contractor" && !scopeContractorValid) {
      setItems([])
      setTotal(0)
      setTotalPages(1)
      return
    }

    setLoading(true)
    setError(null)
    setErrorCode(undefined)
    try {
      const params: Parameters<typeof listAdminUsers>[0] = {
        page: clampPage(page),
        limit: clampLimit(PAGE_SIZE),
        search: debouncedQuery ? debouncedQuery.slice(0, 200) : undefined,
      }
      if (scope === "superadmin") {
        params.isSuperadmin = true
      } else if (scope === "tenant") {
        params.isSuperadmin = false
      } else if (scope === "contractor") {
        params.contractor = scopeContractorId.trim()
      }

      const { items: rows, meta } = await listAdminUsers(params)
      setItems(rows)
      setTotalPages(Math.max(1, meta.totalPages))
      setTotal(meta.total)
    } catch (e: unknown) {
      const meta = getApiErrorMeta(e)
      setError(meta.message)
      setErrorCode(meta.code)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [
    superadminOnly,
    page,
    debouncedQuery,
    scope,
    scopeContractorId,
    scopeContractorValid,
  ])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  const openDetail = (id: string) => {
    setDetailUserId(id)
    setDetailOpen(true)
  }

  const openCreate = () => {
    void loadContractors()
    setFormMode("create")
    setFormUser(null)
    setFormOpen(true)
  }

  const openEdit = (u: AdminUser) => {
    void loadContractors()
    setFormMode("edit")
    setFormUser(u)
    setFormOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return
    }
    if (selfUserId && deleteTarget.id === selfUserId) {
      toast.error("You cannot delete your own account.")
      return
    }
    setDeleteBusy(true)
    try {
      await deleteAdminUser(deleteTarget.id)
      toast.success("User deleted")
      setDeleteTarget(null)
      void loadUsers()
    } catch (e: unknown) {
      const meta = getApiErrorMeta(e)
      toast.error(meta.code ? `${meta.message} (${meta.code})` : meta.message)
    } finally {
      setDeleteBusy(false)
    }
  }

  const canPrev = page > 1
  const canNext = page < totalPages

  if (!superadminOnly) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Users
        </h1>
        <Alert variant="destructive">
          <AlertTitle>Superadmin only</AlertTitle>
          <AlertDescription>
            User administration uses{" "}
            <code className="text-xs">/api/admin/users</code>. Tenant sessions
            receive{" "}
            <code className="text-xs">FORBIDDEN_SUPERADMIN_ONLY</code>. Sign in
            with a platform account that has no{" "}
            <code className="text-xs">contractorId</code> in the JWT.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Users
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Superadmin CRUD on{" "}
            <code className="text-xs">/api/admin/users</code>. Do not combine{" "}
            <code className="text-xs">contractor</code> with{" "}
            <code className="text-xs">isSuperadmin</code> query params.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => openCreate()}>
            <Plus className="size-4" />
            Create user
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              void loadContractors()
              void loadUsers()
            }}
            disabled={loading}
          >
            <RefreshCw
              className={`size-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {scope === "contractor" && !scopeContractorValid ? (
        <Alert>
          <AlertTitle>Contractor filter</AlertTitle>
          <AlertDescription>
            Choose a contractor to load tenant users for that organization.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="gap-2 space-y-2">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 shrink">
              <CardTitle className="text-base">Directory</CardTitle>
              <CardDescription>
                {loading ? "Loading…" : `${total} user${total === 1 ? "" : "s"}`}
              </CardDescription>
            </div>
            <div className="flex w-full min-w-0 flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-end">
                <Select
                  value={scope}
                  onValueChange={(v) => {
                    setScope(v as ListScope)
                    if (v !== "contractor") {
                      setScopeContractorId("")
                    }
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All users</SelectItem>
                    <SelectItem value="superadmin">Superadmins only</SelectItem>
                    <SelectItem value="tenant">Tenant users only</SelectItem>
                    <SelectItem value="contractor">By contractor…</SelectItem>
                  </SelectContent>
                </Select>
                {scope === "contractor" ? (
                  <Select
                    value={scopeContractorId || NONE_SCOPE_CONTRACTOR}
                    onValueChange={(v) =>
                      setScopeContractorId(
                        v === NONE_SCOPE_CONTRACTOR ? "" : v
                      )
                    }
                    disabled={contractorsLoading}
                  >
                    <SelectTrigger className="w-full min-w-0 sm:flex-1">
                      <SelectValue placeholder="Contractor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_SCOPE_CONTRACTOR}>
                        Select contractor…
                      </SelectItem>
                      {contractors.map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
              </div>
              <Input
                placeholder="Search name or email…"
                value={query}
                maxLength={200}
                onChange={(e) => setQuery(e.target.value)}
                className="min-w-0 lg:w-72"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-4">
          {error ? (
            <Alert variant="destructive" className="mx-6 mb-4">
              <AlertTitle>
                {errorCode === "FORBIDDEN_SUPERADMIN_ONLY"
                  ? "Forbidden"
                  : "Users"}
              </AlertTitle>
              <AlertDescription>
                <span>{error}</span>
                {errorCode ? (
                  <span className="mt-2 block font-mono text-xs">{errorCode}</span>
                ) : null}
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="overflow-x-auto border-y">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-muted/40 border-b text-xs font-medium text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Contractor</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-full max-w-[140px]" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-muted-foreground px-4 py-12 text-center text-sm"
                    >
                      {scope === "contractor" && !scopeContractorValid
                        ? "Select a contractor to view users."
                        : "No users match your filters."}
                    </td>
                  </tr>
                ) : (
                  items.map((u) => {
                    const isSelf = Boolean(selfUserId && u.id === selfUserId)
                    return (
                      <tr key={u.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            className="text-left font-medium underline-offset-4 hover:underline"
                            onClick={() => openDetail(u.id)}
                          >
                            {formatCell(u.name)}
                          </button>
                          <div className="text-muted-foreground font-mono text-xs">
                            {u.id}
                          </div>
                        </td>
                        <td className="max-w-[200px] truncate px-4 py-3">
                          {formatCell(u.email)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-muted rounded-full px-2 py-0.5 text-xs font-medium">
                            {u.contractorId === null
                              ? "Superadmin"
                              : "Tenant"}
                          </span>
                        </td>
                        <td className="text-muted-foreground max-w-[220px] truncate px-4 py-3 text-xs">
                          {u.contractor
                            ? formatCell(u.contractor.name)
                            : u.contractorId
                              ? formatCell(u.contractorId)
                              : "—"}
                        </td>
                        <td className="text-muted-foreground whitespace-nowrap px-4 py-3 text-xs">
                          {formatShortDate(u.updatedAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-wrap justify-end gap-1">
                            <Button
                              type="button"
                              size="xs"
                              variant="ghost"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={() => openDetail(u.id)}
                            >
                              View
                            </Button>
                            <Button
                              type="button"
                              size="xs"
                              variant="outline"
                              onClick={() => openEdit(u)}
                            >
                              <Pencil className="size-3.5" />
                              Edit
                            </Button>
                            <Button
                              type="button"
                              size="xs"
                              variant="destructive"
                              disabled={isSelf}
                              title={
                                isSelf
                                  ? "Cannot delete your own account (FORBIDDEN_SELF_DELETE)"
                                  : undefined
                              }
                              onClick={() => setDeleteTarget(u)}
                            >
                              <Trash2 className="size-3.5" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="text-muted-foreground flex flex-col items-center justify-between gap-3 px-6 pt-4 text-sm sm:flex-row">
            <span>
              Page {page} of {totalPages} · limit ≤ 100
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canPrev || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canNext || loading}
                onClick={() => setPage((p) => (canNext ? p + 1 : p))}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AdminUserDetailDialog
        userId={detailUserId}
        open={detailOpen}
        onOpenChange={(next) => {
          setDetailOpen(next)
          if (!next) {
            setDetailUserId(null)
          }
        }}
      />

      <AdminUserFormDialog
        mode={formMode}
        open={formOpen}
        onOpenChange={setFormOpen}
        user={formUser}
        contractors={contractors}
        contractorsLoading={contractorsLoading}
        onSaved={() => void loadUsers()}
      />

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete user?</DialogTitle>
            <DialogDescription>
              Calls{" "}
              <code className="text-xs">DELETE /api/admin/users/:id</code> (204).
              Refresh sessions for that user are revoked.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget ? (
            <p className="text-sm">
              <span className="font-medium">{deleteTarget.name}</span>
              <span className="text-muted-foreground"> · </span>
              <span className="break-all font-mono text-xs">
                {deleteTarget.id}
              </span>
            </p>
          ) : null}
          <DialogFooter className={confirmDialogFooterClass}>
            <Button
              type="button"
              variant="outline"
              disabled={deleteBusy}
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={
                deleteBusy ||
                deleteTarget === null ||
                Boolean(selfUserId && deleteTarget?.id === selfUserId)
              }
              onClick={() => void confirmDelete()}
            >
              {deleteBusy ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
