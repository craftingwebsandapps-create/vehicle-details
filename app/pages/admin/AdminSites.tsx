import { useCallback, useEffect, useLayoutEffect, useState } from "react"

import { ChevronLeft, ChevronRight, Eye, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { SiteDetailDialog } from "~/components/admin/SiteDetailDialog"
import { OpsApprovalPill } from "~/components/mobile/ops/OpsListPrimitives"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"
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
import {
  approveSite,
  listContractors,
  listPlatformSites,
  rejectSite,
} from "~/features/admin/api"
import type { PlatformSiteRecord } from "~/types/platform-site"
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

export default function AdminSites() {
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [contractorsLoading, setContractorsLoading] = useState(true)
  const [contractorsError, setContractorsError] = useState<string | null>(null)
  const [selectedContractorId, setSelectedContractorId] = useState("")

  const [items, setItems] = useState<PlatformSiteRecord[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [sitesLoading, setSitesLoading] = useState(false)
  const [sitesError, setSitesError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [actingId, setActingId] = useState<string | null>(null)

  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState("")
  const [rejectConfirmSite, setRejectConfirmSite] =
    useState<PlatformSiteRecord | null>(null)
  const [approveConfirmSite, setApproveConfirmSite] =
    useState<PlatformSiteRecord | null>(null)
  const [detailSite, setDetailSite] = useState<PlatformSiteRecord | null>(null)

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

  const loadSites = useCallback(async () => {
    setSitesLoading(true)
    setSitesError(null)
    try {
      const { items: rows, meta } = await listPlatformSites({
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
      setSitesError(e instanceof Error ? e.message : "Unable to load sites")
      setItems([])
    } finally {
      setSitesLoading(false)
    }
  }, [selectedContractorId, page, debouncedQuery])

  useEffect(() => {
    void loadSites()
  }, [loadSites])

  const openSiteRejectNoteDialog = () => {
    const s = rejectConfirmSite
    if (!s) return
    setRejectTargetId(s._id)
    setRejectNote("")
    setRejectConfirmSite(null)
    setRejectOpen(true)
  }

  const executeApprove = async () => {
    const s = approveConfirmSite
    if (!s) return
    setApproveConfirmSite(null)
    setActingId(s._id)
    try {
      await approveSite(s._id)
      toast.success("Site approved")
      void loadSites()
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
      await rejectSite(rejectTargetId, rejectNote.trim() || undefined)
      toast.success("Site rejected")
      setRejectOpen(false)
      setRejectTargetId(null)
      void loadSites()
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
            Sites
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Browse sites, filter by contractor, and approve or reject pending
            locations from the table.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={() => {
            void loadContractors()
            void loadSites()
          }}
          disabled={contractorsLoading || sitesLoading}
        >
          <RefreshCw
            className={`size-3.5 ${contractorsLoading || sitesLoading ? "animate-spin" : ""}`}
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
                {sitesLoading
                  ? "Loading…"
                  : `${total} site${total === 1 ? "" : "s"}${
                      selectedContractorId.trim()
                        ? " for this contractor"
                        : ""
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
                placeholder="Search name or location…"
                value={query}
                maxLength={200}
                onChange={(e) => setQuery(e.target.value)}
                className="min-w-0 sm:min-w-[180px] sm:flex-1 sm:basis-[220px]"
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
          {sitesError ? (
            <Alert variant="destructive" className="mx-6">
              <AlertTitle>Sites</AlertTitle>
              <AlertDescription>{sitesError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="overflow-x-auto border-y">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-muted/40 border-b text-xs font-medium text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Site</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Contractor</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Approval</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sitesLoading ? (
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
                      No sites match your filters.
                    </td>
                  </tr>
                ) : (
                  items.map((s) => {
                    const pending = isPendingApproval(s.approvalStatus)
                    const busy = actingId === s._id
                    return (
                      <tr key={s._id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="font-medium">{formatCell(s.name)}</div>
                          <div className="text-muted-foreground text-xs">
                            {formatCell(s.contactPerson)}
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-[220px] truncate">
                          {formatCell(s.location)}
                        </td>
                        <td className="px-4 py-3">
                          {formatCell(s.contractor?.name)}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <div>{formatCell(s.mobileNumber)}</div>
                          <div className="text-muted-foreground truncate max-w-[160px]">
                            {formatCell(s.email)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <OpsApprovalPill status={s.approvalStatus} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-wrap justify-end gap-1.5">
                            <Button
                              type="button"
                              size="xs"
                              variant="ghost"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={() => setDetailSite(s)}
                              aria-label={`View details for ${s.name}`}
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
                                  onClick={() => setApproveConfirmSite(s)}
                                >
                                  Approve
                                </Button>
                                <Button
                                  type="button"
                                  size="xs"
                                  variant="destructive"
                                  disabled={busy}
                                  onClick={() => setRejectConfirmSite(s)}
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
                disabled={!canPrev || sitesLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canNext || sitesLoading}
                onClick={() => setPage((p) => (canNext ? p + 1 : p))}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <SiteDetailDialog
        site={detailSite}
        open={detailSite !== null}
        onOpenChange={(next) => {
          if (!next) setDetailSite(null)
        }}
      />

      <Dialog
        open={approveConfirmSite !== null}
        onOpenChange={(open) => {
          if (!open) setApproveConfirmSite(null)
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Approve this site?</DialogTitle>
            <DialogDescription>
              This marks the site as approved for the contractor.
            </DialogDescription>
          </DialogHeader>
          {approveConfirmSite ? (
            <p className="text-sm">
              <span className="font-medium">
                {formatCell(approveConfirmSite.name)}
              </span>
              <span className="text-muted-foreground"> · </span>
              {formatCell(approveConfirmSite.location)}
            </p>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={actingId !== null}
              onClick={() => setApproveConfirmSite(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                actingId !== null || approveConfirmSite === null
              }
              onClick={() => void executeApprove()}
            >
              Yes, approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={rejectConfirmSite !== null}
        onOpenChange={(open) => {
          if (!open) setRejectConfirmSite(null)
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Reject this site?</DialogTitle>
            <DialogDescription>
              The contractor will see this rejection. Next you can add an
              optional note.
            </DialogDescription>
          </DialogHeader>
          {rejectConfirmSite ? (
            <p className="text-sm">
              <span className="font-medium">
                {formatCell(rejectConfirmSite.name)}
              </span>
              <span className="text-muted-foreground"> · </span>
              {formatCell(rejectConfirmSite.location)}
            </p>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={actingId !== null}
              onClick={() => setRejectConfirmSite(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={
                actingId !== null || rejectConfirmSite === null
              }
              onClick={() => openSiteRejectNoteDialog()}
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
            <DialogTitle>Reject site</DialogTitle>
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
