import { useCallback, useEffect, useLayoutEffect, useState } from "react"

import { ChevronLeft, ChevronRight, Eye, RefreshCw } from "lucide-react"

import { ContractorDetailDialog } from "~/components/admin/ContractorDetailDialog"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"
import { Button } from "~/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Skeleton } from "~/components/ui/skeleton"
import { listContractors } from "~/features/admin/api"
import type { Contractor, ContractorWorkTypeRef } from "~/types/vehicle"

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

function summarizeWorkTypes(types: ContractorWorkTypeRef[] | undefined) {
  if (!types?.length) return "—"
  const labels = types.slice(0, 2).map((t) => t.name?.trim() || t.code || "—")
  const extra = types.length - labels.length
  return extra > 0 ? `${labels.join(", ")} +${extra}` : labels.join(", ")
}

export default function AdminContractors() {
  const [items, setItems] = useState<Contractor[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [detail, setDetail] = useState<Contractor | null>(null)

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
    try {
      const res = await listContractors({
        page: clampPage(page),
        limit: clampLimit(PAGE_SIZE),
        search: debouncedQuery ? debouncedQuery.slice(0, 200) : undefined,
      })
      setItems(res.data.items)
      setTotalPages(Math.max(1, res.data.meta.totalPages))
      setTotal(res.data.meta.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load contractors")
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [page, debouncedQuery])

  useEffect(() => {
    void load()
  }, [load])

  const canPrev = page > 1
  const canNext = page < totalPages

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Contractors
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Browse tenant organizations from{" "}
            <code className="text-xs">GET /api/contractors</code>. Superadmin
            sees all rows; tenant tokens only see their own contractor.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw
            className={`size-3.5 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
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
              <AlertTitle>Contractors</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="overflow-x-auto border-y">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-muted/40 border-b text-xs font-medium text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Organization</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Work types</th>
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
                      No contractors match your search.
                    </td>
                  </tr>
                ) : (
                  items.map((c) => (
                    <tr key={c._id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="font-medium">{formatCell(c.name)}</div>
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
                      <td className="text-muted-foreground max-w-[220px] truncate px-4 py-3 text-xs">
                        {summarizeWorkTypes(c.workTypeIds)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          size="xs"
                          variant="ghost"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => setDetail(c)}
                          aria-label={`View details for ${c.name}`}
                        >
                          <Eye className="size-3.5" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="text-muted-foreground flex flex-col items-center justify-between gap-3 px-6 pt-4 text-sm sm:flex-row">
            <span>
              Page {page} of {totalPages}
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

      <ContractorDetailDialog
        contractor={detail}
        open={detail !== null}
        onOpenChange={(next) => {
          if (!next) setDetail(null)
        }}
      />
    </div>
  )
}
