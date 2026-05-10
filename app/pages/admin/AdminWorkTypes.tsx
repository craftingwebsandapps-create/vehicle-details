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

import { WorkTypeFormDialog } from "~/components/admin/WorkTypeFormDialog"
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
  dialogConfirmActionsFooterClass,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Skeleton } from "~/components/ui/skeleton"
import {
  deleteWorkType,
  listWorkTypesPaginated,
} from "~/features/admin/work-types-api"
import { getApiErrorMeta } from "~/services/api-error"
import { formatPaginationSummary } from "~/utils/pagination-summary"
import type { WorkTypeRecord } from "~/types/work-type"

const PAGE_SIZE = 20

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

function truncate(text: string | undefined | null, max: number) {
  const t = text?.trim() ?? ""
  if (!t) return "—"
  return t.length <= max ? t : `${t.slice(0, max)}…`
}

export default function AdminWorkTypes() {
  const [items, setItems] = useState<WorkTypeRecord[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | undefined>(undefined)

  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [formWorkType, setFormWorkType] = useState<WorkTypeRecord | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<WorkTypeRecord | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => window.clearTimeout(t)
  }, [query])

  useLayoutEffect(() => {
    setPage(1)
  }, [debouncedQuery])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setErrorCode(undefined)
    try {
      const { items: rows, meta } = await listWorkTypesPaginated({
        page: clampPage(page),
        limit: clampLimit(PAGE_SIZE),
        search: debouncedQuery ? debouncedQuery.slice(0, 200) : undefined,
      })
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
  }, [page, debouncedQuery])

  useEffect(() => {
    void load()
  }, [load])

  const openCreate = () => {
    setFormMode("create")
    setFormWorkType(null)
    setFormOpen(true)
  }

  const openEdit = (w: WorkTypeRecord) => {
    setFormMode("edit")
    setFormWorkType(w)
    setFormOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return
    }
    setDeleteBusy(true)
    try {
      await deleteWorkType(deleteTarget._id)
      toast.success("Work type deleted")
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Work types
          </h1>
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
              <CardTitle className="text-base">Catalog</CardTitle>
              <CardDescription>
                {loading ? "Loading…" : `${total} type${total === 1 ? "" : "s"}`}
              </CardDescription>
            </div>
            <Input
              placeholder="Search name or code…"
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
              <AlertTitle>Work types</AlertTitle>
              <AlertDescription>
                <span>{error}</span>
                {errorCode ? (
                  <span className="mt-2 block font-mono text-xs">{errorCode}</span>
                ) : null}
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="overflow-x-auto border-y">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-muted/40 border-b text-xs font-medium text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-full max-w-[140px]" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-muted-foreground px-4 py-12 text-center text-sm"
                    >
                      No work types match your search.
                    </td>
                  </tr>
                ) : (
                  items.map((w) => (
                    <tr key={w._id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs font-semibold tracking-wide uppercase">
                          {formatCell(w.code)}
                        </div>
                        <div className="text-muted-foreground font-mono text-[11px]">
                          {w._id}
                        </div>
                      </td>
                      <td className="max-w-[200px] px-4 py-3 font-medium">
                        {formatCell(w.name)}
                      </td>
                      <td className="text-muted-foreground max-w-[280px] px-4 py-3 text-xs">
                        {truncate(w.description ?? "", 120)}
                      </td>
                      <td className="text-muted-foreground whitespace-nowrap px-4 py-3 text-xs">
                        {formatShortDate(w.updatedAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          <Button
                            type="button"
                            size="xs"
                            variant="outline"
                            onClick={() => openEdit(w)}
                          >
                            <Pencil className="size-3.5" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="xs"
                            variant="destructive"
                            onClick={() => setDeleteTarget(w)}
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
              {formatPaginationSummary({
                page,
                pageSize: PAGE_SIZE,
                total,
                totalPages,
              })}
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

      <WorkTypeFormDialog
        mode={formMode}
        open={formOpen}
        onOpenChange={setFormOpen}
        workType={formWorkType}
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
            <DialogTitle>Delete work type?</DialogTitle>
            <DialogDescription>
              This work type will be removed from the catalog.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget ? (
            <p className="text-sm">
              <span className="font-mono font-semibold uppercase">
                {deleteTarget.code}
              </span>
              <span className="text-muted-foreground"> · </span>
              <span>{deleteTarget.name}</span>
            </p>
          ) : null}
          <div className={dialogConfirmActionsFooterClass}>
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
