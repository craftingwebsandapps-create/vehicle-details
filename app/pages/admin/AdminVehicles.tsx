import { useCallback, useEffect, useLayoutEffect, useState } from "react"

import { ChevronLeft, ChevronRight, Eye, RefreshCw } from "lucide-react"
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
import { VehicleDetailDialog } from "~/components/admin/VehicleDetailDialog"
import {
  approveVehicle,
  listContractors,
  listPlatformVehicles,
  rejectVehicle,
} from "~/features/admin/api"
import type { Contractor, Vehicle } from "~/types/vehicle"

const PAGE_SIZE = 20
const NONE_CONTRACTOR = "__none__"

const confirmDialogFooterClass =
  "mx-0 mb-0 mt-0 flex-row flex-wrap justify-end gap-2 border-0 bg-transparent p-0 pt-3 shadow-none"

function formatCell(value: string | undefined | null) {
  const v = value?.trim()
  return v && v.length > 0 ? v : "—"
}

function isPendingApproval(status: Vehicle["approvalStatus"]) {
  if (!status) return false
  if (status === "PENDING_APPROVAL") return true
  return status.toLowerCase() === "pending"
}

export default function AdminVehicles() {
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [contractorsLoading, setContractorsLoading] = useState(true)
  const [contractorsError, setContractorsError] = useState<string | null>(null)
  const [selectedContractorId, setSelectedContractorId] = useState("")

  const [items, setItems] = useState<Vehicle[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [vehiclesLoading, setVehiclesLoading] = useState(false)
  const [vehiclesError, setVehiclesError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [actingId, setActingId] = useState<string | null>(null)

  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState("")
  const [rejectConfirmVehicle, setRejectConfirmVehicle] =
    useState<Vehicle | null>(null)
  const [approveConfirmVehicle, setApproveConfirmVehicle] =
    useState<Vehicle | null>(null)
  const [detailVehicle, setDetailVehicle] = useState<Vehicle | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => window.clearTimeout(t)
  }, [query])

  useLayoutEffect(() => {
    setPage(1)
  }, [debouncedQuery, selectedContractorId])

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

  const loadVehicles = useCallback(async () => {
    setVehiclesLoading(true)
    setVehiclesError(null)
    try {
      const { items: rows, meta } = await listPlatformVehicles({
        ...(selectedContractorId.trim()
          ? { contractor: selectedContractorId.trim() }
          : {}),
        page,
        limit: PAGE_SIZE,
        search: debouncedQuery || undefined,
      })
      setItems(rows)
      setTotalPages(Math.max(1, meta.totalPages))
      setTotal(meta.total)
    } catch (e) {
      setVehiclesError(
        e instanceof Error ? e.message : "Unable to load vehicles"
      )
      setItems([])
    } finally {
      setVehiclesLoading(false)
    }
  }, [selectedContractorId, page, debouncedQuery])

  useEffect(() => {
    void loadVehicles()
  }, [loadVehicles])

  const openRejectNoteDialog = () => {
    const v = rejectConfirmVehicle
    if (!v) return
    setRejectTargetId(v._id)
    setRejectNote("")
    setRejectConfirmVehicle(null)
    setRejectOpen(true)
  }

  const executeApprove = async () => {
    const v = approveConfirmVehicle
    if (!v) return
    setApproveConfirmVehicle(null)
    setActingId(v._id)
    try {
      await approveVehicle(v._id)
      toast.success("Vehicle approved")
      void loadVehicles()
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
      void loadVehicles()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reject failed")
    } finally {
      setActingId(null)
    }
  }

  const canPrev = page > 1
  const canNext = page < totalPages

  const selectValue = selectedContractorId || NONE_CONTRACTOR

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Vehicles
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Browse and approve vehicles. Filter by contractor or search the fleet
            from the controls on the right.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={() => {
            void loadContractors()
            void loadVehicles()
          }}
          disabled={contractorsLoading || vehiclesLoading}
        >
          <RefreshCw
            className={`size-3.5 ${contractorsLoading || vehiclesLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-2 space-y-2">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 shrink">
              <CardTitle className="text-base">Fleet</CardTitle>
              <CardDescription>
                {vehiclesLoading
                  ? "Loading…"
                  : `${total} vehicle${total === 1 ? "" : "s"}${
                      selectedContractorId.trim()
                        ? " for this contractor"
                        : " (all contractors)"
                    }`}
              </CardDescription>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-end lg:max-w-xl">
              <Select
                value={selectValue}
                onValueChange={(v) =>
                  setSelectedContractorId(v === NONE_CONTRACTOR ? "" : v)
                }
                disabled={contractorsLoading}
              >
                <SelectTrigger className="w-full sm:w-[min(100%,280px)]">
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
              <Input
                placeholder="Search vehicles…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-w-0 lg:min-w-[180px] lg:flex-1 lg:basis-[200px]"
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
          {vehiclesError ? (
            <Alert variant="destructive" className="mx-6">
              <AlertTitle>Vehicles</AlertTitle>
              <AlertDescription>{vehiclesError}</AlertDescription>
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
                {vehiclesLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-full max-w-[140px]" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-muted-foreground px-4 py-12 text-center text-sm"
                    >
                      No vehicles match the current search
                      {selectedContractorId.trim()
                        ? " for this contractor"
                        : ""}
                      .
                    </td>
                  </tr>
                ) : (
                  items.map((v) => {
                    const pending = isPendingApproval(v.approvalStatus)
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
                          <div className="flex flex-wrap justify-end gap-1.5">
                            <Button
                              type="button"
                              size="xs"
                              variant="ghost"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={() => setDetailVehicle(v)}
                              aria-label={`View details for ${v.registrationNumber}`}
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
                                  onClick={() => setApproveConfirmVehicle(v)}
                                >
                                  Approve
                                </Button>
                                <Button
                                  type="button"
                                  size="xs"
                                  variant="destructive"
                                  disabled={busy}
                                  onClick={() => setRejectConfirmVehicle(v)}
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
                disabled={!canPrev || vehiclesLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canNext || vehiclesLoading}
                onClick={() => setPage((p) => (canNext ? p + 1 : p))}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <VehicleDetailDialog
        vehicle={detailVehicle}
        open={detailVehicle !== null}
        onOpenChange={(next) => {
          if (!next) setDetailVehicle(null)
        }}
      />

      <Dialog
        open={approveConfirmVehicle !== null}
        onOpenChange={(open) => {
          if (!open) setApproveConfirmVehicle(null)
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Approve this vehicle?</DialogTitle>
            <DialogDescription>
              This marks the vehicle as approved for the contractor.
            </DialogDescription>
          </DialogHeader>
          {approveConfirmVehicle ? (
            <p className="text-sm">
              <span className="font-medium tabular-nums">
                {formatCell(approveConfirmVehicle.registrationNumber)}
              </span>
              <span className="text-muted-foreground"> · </span>
              {formatCell(approveConfirmVehicle.name)}
            </p>
          ) : null}
          <DialogFooter className={confirmDialogFooterClass}>
            <Button
              type="button"
              variant="outline"
              disabled={actingId !== null}
              onClick={() => setApproveConfirmVehicle(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                actingId !== null || approveConfirmVehicle === null
              }
              onClick={() => void executeApprove()}
            >
              Yes, approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={rejectConfirmVehicle !== null}
        onOpenChange={(open) => {
          if (!open) setRejectConfirmVehicle(null)
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Reject this vehicle?</DialogTitle>
            <DialogDescription>
              The contractor will see this rejection. Next you can add an
              optional note explaining what is wrong or what to fix.
            </DialogDescription>
          </DialogHeader>
          {rejectConfirmVehicle ? (
            <p className="text-sm">
              <span className="font-medium tabular-nums">
                {formatCell(rejectConfirmVehicle.registrationNumber)}
              </span>
              <span className="text-muted-foreground"> · </span>
              {formatCell(rejectConfirmVehicle.name)}
            </p>
          ) : null}
          <DialogFooter className={confirmDialogFooterClass}>
            <Button
              type="button"
              variant="outline"
              disabled={actingId !== null}
              onClick={() => setRejectConfirmVehicle(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={
                actingId !== null || rejectConfirmVehicle === null
              }
              onClick={() => openRejectNoteDialog()}
            >
              Continue to note
            </Button>
          </DialogFooter>
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
            <DialogTitle>Reject vehicle</DialogTitle>
            <DialogDescription>
              Optionally add a note for the contractor (max 2000 characters). You
              can leave this blank.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection…"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            rows={4}
            maxLength={2000}
          />
          <DialogFooter className={confirmDialogFooterClass}>
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
