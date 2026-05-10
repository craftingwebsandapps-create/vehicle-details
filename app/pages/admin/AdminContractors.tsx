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

import { ContractorDetailSheet } from "~/components/admin/ContractorDetailSheet"
import { ContractorFormDialog } from "~/components/admin/ContractorFormDialog"
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
import { Skeleton } from "~/components/ui/skeleton"
import {
  deleteContractor,
  listContractors,
} from "~/features/admin/contractors-admin-api"
import { useAppSelector } from "~/hooks"
import { getApiErrorMeta } from "~/services/api-error"
import type { Contractor, ContractorWorkTypeRef } from "~/types/vehicle"

const PAGE_SIZE = 20

const confirmDialogFooterClass =
  "mx-0 mb-0 mt-0 flex-row flex-wrap justify-end gap-3 border-0 bg-transparent p-0 pt-3 shadow-none"

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

function summarizeWorkTypes(types: ContractorWorkTypeRef[] | undefined) {
  if (!types?.length) return "—"
  const labels = types.slice(0, 2).map((t) => t.name?.trim() || t.code || "—")
  const extra = types.length - labels.length
  return extra > 0 ? `${labels.join(", ")} +${extra}` : labels.join(", ")
}

function formatShortDate(iso: string | undefined | null) {
  if (!iso) return "—"
  try {
    return format(new Date(iso), "PP p")
  } catch {
    return iso
  }
}

export default function AdminContractors() {
  const contractorId = useAppSelector((s) => s.auth.contractorId)
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const superadminOnly =
    isAuthenticated && contractorId === null

  const [items, setItems] = useState<Contractor[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | undefined>(undefined)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")

  const [detailId, setDetailId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [formContractor, setFormContractor] = useState<Contractor | null>(
    null
  )

  const [deleteTarget, setDeleteTarget] = useState<Contractor | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => window.clearTimeout(t)
  }, [query])

  useLayoutEffect(() => {
    setPage(1)
  }, [debouncedQuery])

  const load = useCallback(async () => {
    if (!superadminOnly) {
      return
    }
    setLoading(true)
    setError(null)
    setErrorCode(undefined)
    try {
      const res = await listContractors({
        page: clampPage(page),
        limit: clampLimit(PAGE_SIZE),
        search: debouncedQuery ? debouncedQuery.slice(0, 200) : undefined,
      })
      setItems(res.data.items)
      setTotalPages(Math.max(1, res.data.meta.totalPages))
      setTotal(res.data.meta.total)
    } catch (e: unknown) {
      const meta = getApiErrorMeta(e)
      setError(meta.message)
      setErrorCode(meta.code)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [page, debouncedQuery, superadminOnly])

  useEffect(() => {
    void load()
  }, [load])

  const openDetail = (id: string) => {
    setDetailId(id)
    setDetailOpen(true)
  }

  const openCreate = () => {
    setFormMode("create")
    setFormContractor(null)
    setFormOpen(true)
  }

  const openEdit = (c: Contractor) => {
    setFormMode("edit")
    setFormContractor(c)
    setFormOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return
    }
    setDeleteBusy(true)
    try {
      await deleteContractor(deleteTarget._id)
      toast.success("Contractor deleted")
      setDeleteTarget(null)
      void load()
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
          Contractors
        </h1>
        <Alert variant="destructive">
          <AlertTitle>Superadmin only</AlertTitle>
          <AlertDescription>
            Contractor administration requires a platform account{" "}
            <strong>without</strong> a tenant{" "}
            <code className="text-xs">contractorId</code> in the JWT. Tenant
            sessions receive{" "}
            <code className="text-xs">FORBIDDEN_SUPERADMIN_ONLY</code> from the
            API. Sign in with a superadmin account to use this screen.
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
            Contractors
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Superadmin CRUD on{" "}
            <code className="text-xs">/api/contractors</code>. Base URL from{" "}
            <code className="text-xs">VITE_API_URL</code> (falls back to{" "}
            <code className="text-xs">VITE_API_BASE_URL</code>
            ). Sorting is server-defined.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => openCreate()}>
            <Plus className="size-4" />
            Create
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw
              className={`size-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="gap-2 space-y-2">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 shrink">
              <CardTitle className="text-base">Directory</CardTitle>
              <CardDescription>
                {loading ? "Loading…" : `${total} contractor${total === 1 ? "" : "s"}`}
              </CardDescription>
            </div>
            <Input
              placeholder="Search name, contact, email…"
              value={query}
              maxLength={200}
              onChange={(e) => setQuery(e.target.value)}
              className="min-w-0 w-full lg:max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-4">
          {error ? (
            <Alert variant="destructive" className="mx-6 mb-4">
              <AlertTitle>
                {errorCode === "FORBIDDEN_SUPERADMIN_ONLY"
                  ? "Forbidden"
                  : "Contractors"}
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
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="bg-muted/40 border-b text-xs font-medium text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Organization</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Work types</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-full max-w-[140px]" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-muted-foreground px-4 py-12 text-center text-sm"
                    >
                      No contractors match your search.
                    </td>
                  </tr>
                ) : (
                  items.map((c) => (
                    <tr key={c._id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="text-left font-medium underline-offset-4 hover:underline"
                          onClick={() => openDetail(c._id)}
                        >
                          {formatCell(c.name)}
                        </button>
                        <div className="text-muted-foreground font-mono text-xs">
                          {c._id}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>{formatCell(c.contactPerson)}</div>
                        <div className="text-muted-foreground text-xs">
                          {formatCell(c.mobileNumber)}
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[200px] truncate">
                        {formatCell(c.email)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-muted rounded-full px-2 py-0.5 text-xs font-medium">
                          {formatCell(c.status)}
                        </span>
                      </td>
                      <td className="text-muted-foreground max-w-[200px] truncate px-4 py-3 text-xs">
                        {summarizeWorkTypes(c.workTypeIds)}
                      </td>
                      <td className="text-muted-foreground whitespace-nowrap px-4 py-3 text-xs">
                        {formatShortDate(c.updatedAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          <Button
                            type="button"
                            size="xs"
                            variant="ghost"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => openDetail(c._id)}
                          >
                            View
                          </Button>
                          <Button
                            type="button"
                            size="xs"
                            variant="outline"
                            onClick={() => openEdit(c)}
                          >
                            <Pencil className="size-3.5" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="xs"
                            variant="destructive"
                            onClick={() => setDeleteTarget(c)}
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="text-muted-foreground flex flex-col items-center justify-between gap-3 px-6 pt-4 text-sm sm:flex-row">
            <span>
              Page {page} of {totalPages} · limit {PAGE_SIZE} (max 100)
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

      <ContractorDetailSheet
        contractorId={detailId}
        open={detailOpen}
        onOpenChange={(next) => {
          setDetailOpen(next)
          if (!next) {
            setDetailId(null)
          }
        }}
        onEdit={(c) => {
          setDetailOpen(false)
          openEdit(c)
        }}
      />

      <ContractorFormDialog
        mode={formMode}
        open={formOpen}
        onOpenChange={setFormOpen}
        contractor={formContractor}
        onSaved={() => void load()}
      />

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete contractor?</DialogTitle>
            <DialogDescription>
              This calls{" "}
              <code className="text-xs">DELETE /api/contractors/:id</code>{" "}
              (204). This cannot be undone from the UI.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget ? (
            <p className="text-sm">
              <span className="font-medium">{deleteTarget.name}</span>
              <span className="text-muted-foreground"> · </span>
              <span className="break-all font-mono text-xs">
                {deleteTarget._id}
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
              disabled={deleteBusy || deleteTarget === null}
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
