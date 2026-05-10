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
  Eye,
  RefreshCw,
} from "lucide-react"

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
import { getAuditLog, listAdminAuditLogs } from "~/features/admin/api"
import { isValidObjectId } from "~/features/admin/contractors-admin-api"
import { useAppSelector } from "~/hooks"
import { getApiErrorMeta } from "~/services/api-error"
import type {
  AuditActorRole,
  AuditApiScope,
  AuditLogReport,
} from "~/types/admin-audit-log"

const PAGE_SIZE = 20

function clampPage(p: number) {
  return Math.max(1, p)
}

function clampLimit(l: number) {
  return Math.min(100, Math.max(1, l))
}

function formatShortDate(iso: string | undefined | null) {
  if (!iso) return "—"
  try {
    return format(new Date(iso), "PP p")
  } catch {
    return iso
  }
}

function truncate(text: string, max: number) {
  const t = text.trim()
  if (!t) return "—"
  return t.length <= max ? t : `${t.slice(0, max)}…`
}

function toIsoFromDatetimeLocal(v: string): string | undefined {
  const t = v.trim()
  if (!t) return undefined
  const d = new Date(t)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString()
}

function formatJsonPreview(value: unknown): string {
  if (value === null || value === undefined) return "—"
  if (
    typeof value === "object" &&
    value !== null &&
    "multipart" in value &&
    (value as { multipart?: boolean }).multipart === true
  ) {
    return "{ multipart: true }"
  }
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function parseStatusCode(raw: string): number | undefined {
  const t = raw.trim()
  if (!t) return undefined
  const n = Number.parseInt(t, 10)
  if (!Number.isInteger(n) || n < 100 || n > 599) return undefined
  return n
}

function formatActorCell(row: AuditLogReport) {
  if (row.actor) {
    return (
      <div className="min-w-0">
        <div className="truncate font-medium">{row.actor.name}</div>
        <div className="text-muted-foreground truncate text-[11px]">
          {row.actor.email}
        </div>
      </div>
    )
  }
  return (
    <span className="font-mono text-[11px]">
      {truncate(row.actorUserId, 28)}
    </span>
  )
}

function formatContractorCell(row: AuditLogReport) {
  if (row.contractor) {
    return (
      <div className="min-w-0">
        <div className="truncate font-medium">{row.contractor.name}</div>
        <div className="text-muted-foreground truncate text-[11px]">
          {row.contractor.email}
        </div>
      </div>
    )
  }
  return <span className="text-muted-foreground text-xs">—</span>
}

export default function AdminAuditLogs() {
  const contractorId = useAppSelector((s) => s.auth.contractorId)
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const superadminOnly = isAuthenticated && contractorId === null

  const [items, setItems] = useState<AuditLogReport[]>([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | undefined>(undefined)

  const [actorUserId, setActorUserId] = useState("")
  const [actorRole, setActorRole] = useState<AuditActorRole | "">("")
  const [apiScope, setApiScope] = useState<AuditApiScope | "">("")
  const [method, setMethod] = useState("")
  const [statusCodeInput, setStatusCodeInput] = useState("")
  const [pathContains, setPathContains] = useState("")
  const [debouncedPathContains, setDebouncedPathContains] = useState("")
  const [fromLocal, setFromLocal] = useState("")
  const [toLocal, setToLocal] = useState("")

  const [detailId, setDetailId] = useState<string | null>(null)
  const [detail, setDetail] = useState<AuditLogReport | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [detailErrorCode, setDetailErrorCode] = useState<string | undefined>(
    undefined
  )

  useEffect(() => {
    const t = window.setTimeout(
      () => setDebouncedPathContains(pathContains.trim()),
      300
    )
    return () => window.clearTimeout(t)
  }, [pathContains])

  useLayoutEffect(() => {
    setPage(1)
  }, [
    actorUserId,
    actorRole,
    apiScope,
    method,
    statusCodeInput,
    debouncedPathContains,
    fromLocal,
    toLocal,
    limit,
  ])

  const actorUserIdTrimmed = actorUserId.trim()
  const actorUserIdInvalid =
    actorUserIdTrimmed.length > 0 && !isValidObjectId(actorUserIdTrimmed)

  const load = useCallback(async () => {
    if (actorUserIdInvalid) {
      setLoading(false)
      setError(null)
      setErrorCode(undefined)
      setItems([])
      setTotal(0)
      setTotalPages(1)
      return
    }

    setLoading(true)
    setError(null)
    setErrorCode(undefined)
    try {
      const fromIso = toIsoFromDatetimeLocal(fromLocal)
      const toIso = toIsoFromDatetimeLocal(toLocal)
      const statusParsed = parseStatusCode(statusCodeInput)

      const { items: rows, meta } = await listAdminAuditLogs({
        page: clampPage(page),
        limit: clampLimit(limit),
        actorUserId: actorUserIdTrimmed || undefined,
        actorRole: actorRole || undefined,
        apiScope: apiScope || undefined,
        method: method.trim() || undefined,
        statusCode: statusParsed,
        pathContains: debouncedPathContains
          ? debouncedPathContains.slice(0, 200)
          : undefined,
        from: fromIso,
        to: toIso,
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
  }, [
    actorUserIdTrimmed,
    actorUserIdInvalid,
    actorRole,
    apiScope,
    method,
    statusCodeInput,
    debouncedPathContains,
    fromLocal,
    toLocal,
    page,
    limit,
  ])

  useEffect(() => {
    if (superadminOnly) {
      void load()
    }
  }, [superadminOnly, load])

  useEffect(() => {
    if (!detailId) {
      setDetail(null)
      setDetailError(null)
      setDetailErrorCode(undefined)
      return
    }

    let cancelled = false
    setDetailLoading(true)
    setDetailError(null)
    setDetailErrorCode(undefined)
    setDetail(null)

    void (async () => {
      try {
        const row = await getAuditLog(detailId)
        if (!cancelled) {
          setDetail(row)
        }
      } catch (e: unknown) {
        if (!cancelled) {
          const meta = getApiErrorMeta(e)
          setDetailError(meta.message)
          setDetailErrorCode(meta.code)
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [detailId])

  const canPrev = page > 1
  const canNext = page < totalPages

  if (!superadminOnly) {
    return (
      <div className="flex min-w-0 flex-col gap-4">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Audit logs
        </h1>
        <Alert variant="destructive">
          <AlertTitle>Superadmin only</AlertTitle>
          <AlertDescription>
            Audit logs use{" "}
            <code className="text-xs">GET /api/admin/audit-logs</code>. Tenant
            sessions receive{" "}
            <code className="text-xs">FORBIDDEN_SUPERADMIN_ONLY</code>. Sign in
            with a platform account that has no{" "}
            <code className="text-xs">contractorId</code> in the JWT.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Audit logs
          </h1>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => void load()}
          disabled={loading || actorUserIdInvalid}
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-2 space-y-2">
          <div className="flex flex-col gap-2">
            <CardTitle className="text-base">Filters</CardTitle>
            <CardDescription>
              Sorted by <code className="text-xs">occurredAt</code> descending.
              Path substring is debounced (1–200 chars). HTTP method filter is
              1–8 characters, uppercased for the query.
            </CardDescription>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <label className="text-muted-foreground text-xs font-medium">
                Actor user id (24 hex)
              </label>
              <Input
                value={actorUserId}
                onChange={(e) => setActorUserId(e.target.value)}
                placeholder="ObjectId"
                className="font-mono text-xs"
              />
              {actorUserIdInvalid ? (
                <p className="text-destructive text-xs">
                  Must be a 24-character hex ObjectId.
                </p>
              ) : null}
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground text-xs font-medium">
                Actor role
              </label>
              <Select
                value={actorRole || "__any__"}
                onValueChange={(v) =>
                  setActorRole(v === "__any__" ? "" : (v as AuditActorRole))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__any__">Any</SelectItem>
                  <SelectItem value="superadmin">Superadmin</SelectItem>
                  <SelectItem value="tenant">Tenant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground text-xs font-medium">
                API scope
              </label>
              <Select
                value={apiScope || "__any__"}
                onValueChange={(v) =>
                  setApiScope(v === "__any__" ? "" : (v as AuditApiScope))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__any__">Any</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                  <SelectItem value="tenant_api">tenant_api</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground text-xs font-medium">
                HTTP method (≤8)
              </label>
              <Input
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                placeholder="GET"
                maxLength={8}
                className="font-mono text-xs uppercase"
              />
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground text-xs font-medium">
                Status code (100–599)
              </label>
              <Input
                inputMode="numeric"
                value={statusCodeInput}
                onChange={(e) => setStatusCodeInput(e.target.value)}
                placeholder="200"
                maxLength={3}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-1 sm:col-span-2 lg:col-span-2">
              <label className="text-muted-foreground text-xs font-medium">
                Path contains
              </label>
              <Input
                value={pathContains}
                onChange={(e) => setPathContains(e.target.value)}
                placeholder="/api/admin/…"
                maxLength={200}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground text-xs font-medium">
                From (local)
              </label>
              <Input
                type="datetime-local"
                value={fromLocal}
                onChange={(e) => setFromLocal(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground text-xs font-medium">
                To (local)
              </label>
              <Input
                type="datetime-local"
                value={toLocal}
                onChange={(e) => setToLocal(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground text-xs font-medium">
                Page size
              </label>
              <Select
                value={String(limit)}
                onValueChange={(v) => setLimit(clampLimit(Number(v)))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[20, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-0 pb-4">
          <div className="text-muted-foreground px-6 text-sm">
            {loading ? "Loading…" : `${total} entr${total === 1 ? "y" : "ies"}`}
          </div>

          {error ? (
            <Alert variant="destructive" className="mx-6">
              <AlertTitle>Audit logs</AlertTitle>
              <AlertDescription>
                <span>{error}</span>
                {errorCode ? (
                  <span className="mt-2 block font-mono text-xs">
                    {errorCode}
                  </span>
                ) : null}
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="max-w-full overflow-x-auto border-y">
            <table className="text-muted-foreground min-w-[1100px] w-full text-left text-sm">
              <thead className="bg-muted/40 border-b text-xs font-medium uppercase">
                <tr>
                  <th className="text-foreground px-4 py-3 font-medium">
                    Occurred
                  </th>
                  <th className="text-foreground px-4 py-3 font-medium">
                    Method
                  </th>
                  <th className="text-foreground px-4 py-3 font-medium">
                    Path
                  </th>
                  <th className="text-foreground px-4 py-3 font-medium">
                    Status
                  </th>
                  <th className="text-foreground px-4 py-3 font-medium">ms</th>
                  <th className="text-foreground px-4 py-3 font-medium">
                    Scope
                  </th>
                  <th className="text-foreground px-4 py-3 font-medium">Role</th>
                  <th className="text-foreground px-4 py-3 font-medium">
                    Actor
                  </th>
                  <th className="text-foreground px-4 py-3 font-medium">
                    Contractor
                  </th>
                  <th className="text-foreground px-4 py-3 font-medium">IP</th>
                  <th className="text-foreground px-4 py-3 font-medium text-right">
                    Detail
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 11 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-full max-w-[120px]" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : actorUserIdInvalid ? (
                  <tr>
                    <td
                      colSpan={11}
                      className="text-muted-foreground px-4 py-12 text-center text-sm"
                    >
                      Fix actor user id filter to load results.
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={11}
                      className="text-muted-foreground px-4 py-12 text-center text-sm"
                    >
                      No audit rows match your filters.
                    </td>
                  </tr>
                ) : (
                  items.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/30">
                      <td className="text-foreground whitespace-nowrap px-4 py-3 text-xs">
                        {formatShortDate(row.occurredAt)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold uppercase">
                        {row.method}
                      </td>
                      <td className="max-w-[280px] px-4 py-3 font-mono text-xs">
                        {truncate(row.path, 80)}
                      </td>
                      <td className="text-foreground px-4 py-3 font-mono text-xs">
                        {row.statusCode}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {row.durationMs}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {row.apiScope}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {row.actorRole}
                      </td>
                      <td className="max-w-[160px] px-4 py-3">
                        {formatActorCell(row)}
                      </td>
                      <td className="max-w-[160px] px-4 py-3">
                        {formatContractorCell(row)}
                      </td>
                      <td className="max-w-[100px] px-4 py-3 font-mono text-xs">
                        {row.ip ? truncate(row.ip, 24) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          className="gap-1"
                          onClick={() => setDetailId(row.id)}
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

          <div className="text-muted-foreground flex flex-col items-center justify-between gap-3 px-6 pt-2 text-sm sm:flex-row">
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
                Prev
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canNext || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={detailId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailId(null)
        }}
      >
        <DialogContent className="flex max-h-[min(90vh,720px)] max-w-2xl flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="border-border shrink-0 border-b px-6 py-4">
            <DialogTitle>Audit log</DialogTitle>
            <DialogDescription className="font-mono text-xs">
              {detail?.id ?? detailId ?? ""}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
            {detailLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-full max-w-md" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : detailError ? (
              <Alert variant="destructive">
                <AlertTitle>Could not load detail</AlertTitle>
                <AlertDescription>
                  {detailError}
                  {detailErrorCode ? (
                    <>
                      {" "}
                      <code className="text-xs">({detailErrorCode})</code>
                    </>
                  ) : null}
                </AlertDescription>
              </Alert>
            ) : detail ? (
              <div className="space-y-4 text-sm">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <div className="text-muted-foreground text-xs font-medium uppercase">
                      Occurred
                    </div>
                    <div className="mt-0.5">{formatShortDate(detail.occurredAt)}</div>
                    <div className="text-muted-foreground mt-1 font-mono text-[11px] break-all">
                      {detail.occurredAt}
                    </div>
                  </div>
                  <DetailField
                    label="Request"
                    value={`${detail.method} · HTTP ${detail.statusCode} · ${detail.durationMs} ms`}
                  />
                  <DetailField
                    label="Path"
                    value={detail.path}
                    mono
                    className="sm:col-span-2"
                  />
                  <DetailField label="API scope" value={detail.apiScope} mono />
                  <DetailField label="Actor role" value={detail.actorRole} mono />
                </div>

                <div>
                  <div className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                    Query
                  </div>
                  <pre className="bg-muted max-h-40 overflow-auto rounded-md p-3 font-mono text-xs whitespace-pre-wrap break-all">
                    {formatJsonPreview(detail.query)}
                  </pre>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                    Path params
                  </div>
                  <pre className="bg-muted max-h-40 overflow-auto rounded-md p-3 font-mono text-xs whitespace-pre-wrap break-all">
                    {formatJsonPreview(detail.pathParams)}
                  </pre>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <DetailField label="IP" value={detail.ip ?? "—"} mono />
                  <DetailField
                    label="User agent"
                    value={detail.userAgent ?? "—"}
                    className="sm:col-span-2"
                  />
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <DetailField label="Actor user id" value={detail.actorUserId} mono />
                  <DetailField
                    label="Actor contractor id"
                    value={detail.actorContractorId ?? "—"}
                    mono
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                      Actor
                    </div>
                    <pre className="bg-muted rounded-md p-3 font-mono text-xs whitespace-pre-wrap break-all">
                      {formatJsonPreview(detail.actor)}
                    </pre>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                      Contractor
                    </div>
                    <pre className="bg-muted rounded-md p-3 font-mono text-xs whitespace-pre-wrap break-all">
                      {formatJsonPreview(detail.contractor)}
                    </pre>
                  </div>
                </div>

                <div>
                  <div className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                    Metadata
                  </div>
                  <pre className="bg-muted max-h-56 overflow-auto rounded-md p-3 font-mono text-xs whitespace-pre-wrap break-all">
                    {detail.metadata !== undefined &&
                    detail.metadata !== null &&
                    typeof detail.metadata === "object"
                      ? JSON.stringify(detail.metadata, null, 2)
                      : formatJsonPreview(detail.metadata)}
                  </pre>
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DetailField({
  label,
  value,
  mono,
  className,
}: {
  label: string
  value: string
  mono?: boolean
  className?: string
}) {
  return (
    <div className={className}>
      <div className="text-muted-foreground text-xs font-medium uppercase">
        {label}
      </div>
      <div
        className={`mt-0.5 break-all ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </div>
    </div>
  )
}
