import { useCallback, useEffect, useLayoutEffect, useState } from "react"

import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { OpsApprovalPill } from "~/components/mobile/ops/OpsListPrimitives"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
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
import { Textarea } from "~/components/ui/textarea"
import { approveVehicle, rejectVehicle } from "~/features/admin/api"
import { listVehicles } from "~/features/vehicles/api"
import type { ApprovalStatus, Vehicle, VehicleStatus } from "~/types/vehicle"

const PAGE_SIZE = 20

type ApprovalFilter = "all" | ApprovalStatus
type StatusFilter = "all" | VehicleStatus

function formatCell(value: string | undefined | null) {
  const v = value?.trim()
  return v && v.length > 0 ? v : "—"
}

export default function AdminVehicles() {
  const [items, setItems] = useState<Vehicle[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [actingId, setActingId] = useState<string | null>(null)

  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState("")

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => window.clearTimeout(t)
  }, [query])

  useLayoutEffect(() => {
    setPage(1)
  }, [debouncedQuery, approvalFilter, statusFilter])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listVehicles({
        page,
        limit: PAGE_SIZE,
        search: debouncedQuery || undefined,
        approvalStatus:
          approvalFilter === "all" ? undefined : approvalFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
      })
      const payload = res.data
      setItems(payload.data)
      setTotalPages(Math.max(1, payload.meta.totalPages))
      setTotal(payload.meta.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load vehicles")
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [page, debouncedQuery, approvalFilter, statusFilter])

  useEffect(() => {
    void load()
  }, [load])

  const openReject = (id: string) => {
    setRejectTargetId(id)
    setRejectNote("")
    setRejectOpen(true)
  }

  const handleApprove = async (id: string) => {
    setActingId(id)
    try {
      await approveVehicle(id)
      toast.success("Vehicle approved")
      void load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Approval failed")
    } finally {
      setActingId(null)
    }
  }

  const confirmReject = async () => {
    if (!rejectTargetId) return
    setActingId(rejectTargetId)
    try {
      await rejectVehicle(
        rejectTargetId,
        rejectNote.trim() || undefined
      )
      toast.success("Vehicle rejected")
      setRejectOpen(false)
      setRejectTargetId(null)
      void load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reject failed")
    } finally {
      setActingId(null)
    }
  }

  const canPrev = page > 1
  const canNext = page < totalPages

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Vehicles
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Review and approve vehicles across all contractors.
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
        <CardHeader className="gap-4 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="text-base">Fleet registry</CardTitle>
            <CardDescription>
              {loading ? "Loading…" : `${total} vehicle${total === 1 ? "" : "s"} total`}
            </CardDescription>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Input
              placeholder="Search registration, name, type…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="sm:w-[min(100%,280px)]"
            />
            <Select
              value={approvalFilter}
              onValueChange={(v) => setApprovalFilter(v as ApprovalFilter)}
            >
              <SelectTrigger className="sm:w-[160px]">
                <SelectValue placeholder="Approval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All approvals</SelectItem>
                <SelectItem value="PENDING_APPROVAL">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="sm:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-4">
          {error ? (
            <Alert variant="destructive" className="mx-6">
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="overflow-x-auto border-y">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-muted/40 border-b text-xs font-medium text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Registration</th>
                  <th className="px-4 py-3 font-medium">Vehicle</th>
                  <th className="px-4 py-3 font-medium">Contractor</th>
                  <th className="px-4 py-3 font-medium">Site</th>
                  <th className="px-4 py-3 font-medium">Driver</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Approval</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 8 }).map((__, j) => (
                          <td key={j} className="px-4 py-3">
                            <Skeleton className="h-4 w-full max-w-[140px]" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : items.length === 0
                    ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="text-muted-foreground px-4 py-12 text-center text-sm"
                          >
                            No vehicles match your filters.
                          </td>
                        </tr>
                      )
                    : (
                        items.map((v) => {
                          const pending =
                            v.approvalStatus === "PENDING_APPROVAL"
                          const busy = actingId === v._id
                          return (
                            <tr key={v._id} className="hover:bg-muted/30">
                              <td className="px-4 py-3 font-medium tabular-nums">
                                {formatCell(v.registrationNumber)}
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-medium">
                                  {formatCell(v.name)}
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  {formatCell(v.type)}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {formatCell(v.contractor?.name)}
                              </td>
                              <td className="px-4 py-3">
                                {typeof v.site === "string"
                                  ? formatCell(v.site)
                                  : formatCell(v.site?.name)}
                              </td>
                              <td className="px-4 py-3">
                                {formatCell(v.driver?.name)}
                              </td>
                              <td className="px-4 py-3">
                                <Badge
                                  variant={
                                    v.status === "ACTIVE"
                                      ? "secondary"
                                      : "outline"
                                  }
                                >
                                  {v.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <OpsApprovalPill status={v.approvalStatus} />
                              </td>
                              <td className="px-4 py-3 text-right">
                                {pending ? (
                                  <div className="flex justify-end gap-1.5">
                                    <Button
                                      type="button"
                                      size="xs"
                                      variant="outline"
                                      disabled={busy}
                                      onClick={() => void handleApprove(v._id)}
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      type="button"
                                      size="xs"
                                      variant="destructive"
                                      disabled={busy}
                                      onClick={() => openReject(v._id)}
                                    >
                                      Reject
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-xs">
                                    —
                                  </span>
                                )}
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
                onClick={() =>
                  setPage((p) => (canNext ? p + 1 : p))
                }
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject vehicle</DialogTitle>
            <DialogDescription>
              Optionally add a note for the contractor. You can leave this
              blank.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection…"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectOpen(false)}
              disabled={actingId !== null}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={actingId !== null}
              onClick={() => void confirmReject()}
            >
              Confirm reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
