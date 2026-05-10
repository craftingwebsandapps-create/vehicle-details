import { useCallback, useEffect, useLayoutEffect, useState } from "react"

import { ChevronLeft, ChevronRight, Eye, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { DriverDetailDialog } from "~/components/admin/DriverDetailDialog"
import { OpsApprovalPill } from "~/components/mobile/ops/OpsListPrimitives"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  dialogConfirmActionsFooterClass,
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
import {
  approveDriver,
  listContractors,
  listPlatformDrivers,
  rejectDriver,
} from "~/features/admin/api"
import type { PlatformDriverRecord } from "~/types/platform-driver"
import type { ApprovalStatus, Contractor } from "~/types/vehicle"

const PAGE_SIZE = 20
const NONE_CONTRACTOR = "__none__"

function formatCell(value: string | undefined | null) {
  const v = value?.trim()
  return v && v.length > 0 ? v : "—"
}

function isPendingApproval(status: ApprovalStatus | undefined) {
  if (!status) return false
  if (status === "PENDING_APPROVAL") return true
  return status.toLowerCase() === "pending"
}

export default function AdminDrivers() {
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [contractorsLoading, setContractorsLoading] = useState(true)
  const [contractorsError, setContractorsError] = useState<string | null>(null)
  const [selectedContractorId, setSelectedContractorId] = useState("")

  const [availabilityFilter, setAvailabilityFilter] = useState<
    "all" | "available"
  >("all")

  const [items, setItems] = useState<PlatformDriverRecord[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [driversLoading, setDriversLoading] = useState(false)
  const [driversError, setDriversError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [actingId, setActingId] = useState<string | null>(null)

  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState("")
  const [rejectConfirmDriver, setRejectConfirmDriver] =
    useState<PlatformDriverRecord | null>(null)
  const [approveConfirmDriver, setApproveConfirmDriver] =
    useState<PlatformDriverRecord | null>(null)
  const [detailDriver, setDetailDriver] = useState<PlatformDriverRecord | null>(
    null
  )

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => window.clearTimeout(t)
  }, [query])

  useLayoutEffect(() => {
    setPage(1)
  }, [debouncedQuery, selectedContractorId, availabilityFilter])

  const loadContractors = useCallback(async () => {
    setContractorsLoading(true)
    setContractorsError(null)
    try {
      const res = await listContractors({
        page: 1,
        limit: 100,
      })
      setContractors(res.data.items)
    } catch (e) {
      setContractorsError(
        e instanceof Error ? e.message : "Unable to load contractors"
      )
      setContractors([])
    } finally {
      setContractorsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadContractors()
  }, [loadContractors])

  const loadDrivers = useCallback(async () => {
    setDriversLoading(true)
    setDriversError(null)
    try {
      const { items: rows, meta } = await listPlatformDrivers({
        ...(selectedContractorId.trim()
          ? { contractor: selectedContractorId.trim() }
          : {}),
        page,
        limit: PAGE_SIZE,
        search: debouncedQuery || undefined,
        availableOnly: availabilityFilter === "available",
      })
      setItems(rows)
      setTotalPages(Math.max(1, meta.totalPages))
      setTotal(meta.total)
    } catch (e) {
      setDriversError(
        e instanceof Error ? e.message : "Unable to load drivers"
      )
      setItems([])
    } finally {
      setDriversLoading(false)
    }
  }, [selectedContractorId, page, debouncedQuery, availabilityFilter])

  useEffect(() => {
    void loadDrivers()
  }, [loadDrivers])

  const openDriverRejectNoteDialog = () => {
    const d = rejectConfirmDriver
    if (!d) return
    setRejectTargetId(d._id)
    setRejectNote("")
    setRejectConfirmDriver(null)
    setRejectOpen(true)
  }

  const executeApprove = async () => {
    const d = approveConfirmDriver
    if (!d) return
    setApproveConfirmDriver(null)
    setActingId(d._id)
    try {
      await approveDriver(d._id)
      toast.success("Driver approved")
      void loadDrivers()
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
      await rejectDriver(rejectTargetId, rejectNote.trim() || undefined)
      toast.success("Driver rejected")
      setRejectOpen(false)
      setRejectTargetId(null)
      void loadDrivers()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reject failed")
    } finally {
      setActingId(null)
    }
  }

  const canPrev = page > 1
  const canNext = page < totalPages

  const selectValue = selectedContractorId || NONE_CONTRACTOR

  const assignedLabel = (d: PlatformDriverRecord) => {
    const av = d.assignedVehicle
    if (!av) return "—"
    const reg = formatCell(av.registrationNumber)
    const name = formatCell(av.name)
    if (reg !== "—" && name !== "—") return `${reg} · ${name}`
    return reg !== "—" ? reg : name
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Drivers
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Browse drivers, filter by contractor or availability, and approve or
            reject pending registrations from the table.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={() => {
            void loadContractors()
            void loadDrivers()
          }}
          disabled={contractorsLoading || driversLoading}
        >
          <RefreshCw
            className={`size-3.5 ${contractorsLoading || driversLoading ? "animate-spin" : ""}`}
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
                {driversLoading
                  ? "Loading…"
                  : `${total} driver${total === 1 ? "" : "s"}${
                      selectedContractorId.trim()
                        ? " for this contractor"
                        : ""
                    }${availabilityFilter === "available" ? " (unassigned only)" : ""}`}
              </CardDescription>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-end lg:max-w-3xl">
              <Select
                value={selectValue}
                onValueChange={(v) =>
                  setSelectedContractorId(v === NONE_CONTRACTOR ? "" : v)
                }
                disabled={contractorsLoading}
              >
                <SelectTrigger className="w-full sm:w-[min(100%,260px)]">
                  <SelectValue placeholder="All contractors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_CONTRACTOR}>
                    All contractors
                  </SelectItem>
                  {contractors.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                      {c.email ? ` · ${c.email}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={availabilityFilter}
                onValueChange={(v) =>
                  setAvailabilityFilter(v as "all" | "available")
                }
              >
                <SelectTrigger className="w-full sm:w-[min(100%,200px)]">
                  <SelectValue placeholder="Availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All drivers</SelectItem>
                  <SelectItem value="available">Unassigned only</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Search name or licence…"
                value={query}
                maxLength={200}
                onChange={(e) => setQuery(e.target.value)}
                className="min-w-0 sm:min-w-[180px] sm:flex-1 sm:basis-[200px]"
              />
            </div>
          </div>
          {contractorsError ? (
            <Alert variant="destructive">
              <AlertTitle>Contractors</AlertTitle>
              <AlertDescription>{contractorsError}</AlertDescription>
            </Alert>
          ) : null}
        </CardHeader>
        <CardContent className="px-0 pb-4">
          {driversError ? (
            <Alert variant="destructive" className="mx-6">
              <AlertTitle>Drivers</AlertTitle>
              <AlertDescription>{driversError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="overflow-x-auto border-y">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="bg-muted/40 border-b text-xs font-medium text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Driver</th>
                  <th className="px-4 py-3 font-medium">Licence</th>
                  <th className="px-4 py-3 font-medium">Contractor</th>
                  <th className="px-4 py-3 font-medium">Assigned vehicle</th>
                  <th className="px-4 py-3 font-medium">Approval</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {driversLoading ? (
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
                      No drivers match your filters.
                    </td>
                  </tr>
                ) : (
                  items.map((d) => {
                    const pending = isPendingApproval(d.approvalStatus)
                    const busy = actingId === d._id
                    return (
                      <tr key={d._id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="font-medium">{formatCell(d.name)}</div>
                          <div className="text-muted-foreground text-xs">
                            {formatCell(d.mobileNumber)}
                          </div>
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {formatCell(d.licenceNumber)}
                        </td>
                        <td className="px-4 py-3">
                          {formatCell(d.contractor?.name)}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {assignedLabel(d)}
                        </td>
                        <td className="px-4 py-3">
                          <OpsApprovalPill status={d.approvalStatus} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-wrap justify-end gap-1.5">
                            <Button
                              type="button"
                              size="xs"
                              variant="ghost"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={() => setDetailDriver(d)}
                              aria-label={`View details for ${d.name}`}
                            >
                              <Eye className="size-3.5" />
                              View
                            </Button>
                            {pending ? (
                              <>
                                <Button
                                  type="button"
                                  size="xs"
                                  variant="outline"
                                  disabled={busy}
                                  onClick={() => setApproveConfirmDriver(d)}
                                >
                                  Approve
                                </Button>
                                <Button
                                  type="button"
                                  size="xs"
                                  variant="destructive"
                                  disabled={busy}
                                  onClick={() => setRejectConfirmDriver(d)}
                                >
                                  Reject
                                </Button>
                              </>
                            ) : null}
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
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canPrev || driversLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canNext || driversLoading}
                onClick={() => setPage((p) => (canNext ? p + 1 : p))}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <DriverDetailDialog
        driver={detailDriver}
        open={detailDriver !== null}
        onOpenChange={(next) => {
          if (!next) setDetailDriver(null)
        }}
      />

      <Dialog
        open={approveConfirmDriver !== null}
        onOpenChange={(open) => {
          if (!open) setApproveConfirmDriver(null)
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Approve this driver?</DialogTitle>
            <DialogDescription>
              This marks the driver as approved for the contractor.
            </DialogDescription>
          </DialogHeader>
          {approveConfirmDriver ? (
            <p className="text-sm">
              <span className="font-medium">
                {formatCell(approveConfirmDriver.name)}
              </span>
              <span className="text-muted-foreground"> · </span>
              <span className="tabular-nums">
                {formatCell(approveConfirmDriver.licenceNumber)}
              </span>
            </p>
          ) : null}
          <div className={dialogConfirmActionsFooterClass}>
            <Button
              type="button"
              variant="outline"
              disabled={actingId !== null}
              onClick={() => setApproveConfirmDriver(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                actingId !== null || approveConfirmDriver === null
              }
              onClick={() => void executeApprove()}
            >
              Yes, approve
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={rejectConfirmDriver !== null}
        onOpenChange={(open) => {
          if (!open) setRejectConfirmDriver(null)
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Reject this driver?</DialogTitle>
            <DialogDescription>
              The contractor will see this rejection. Next you can add an
              optional note.
            </DialogDescription>
          </DialogHeader>
          {rejectConfirmDriver ? (
            <p className="text-sm">
              <span className="font-medium">
                {formatCell(rejectConfirmDriver.name)}
              </span>
              <span className="text-muted-foreground"> · </span>
              <span className="tabular-nums">
                {formatCell(rejectConfirmDriver.licenceNumber)}
              </span>
            </p>
          ) : null}
          <div className={dialogConfirmActionsFooterClass}>
            <Button
              type="button"
              variant="outline"
              disabled={actingId !== null}
              onClick={() => setRejectConfirmDriver(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={
                actingId !== null || rejectConfirmDriver === null
              }
              onClick={() => openDriverRejectNoteDialog()}
            >
              Continue to note
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={rejectOpen}
        onOpenChange={(open) => {
          setRejectOpen(open)
          if (!open) setRejectTargetId(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject driver</DialogTitle>
            <DialogDescription>
              Optionally add a note (max 2000 characters).
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection…"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            rows={4}
            maxLength={2000}
          />
          <div className={dialogConfirmActionsFooterClass}>
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
