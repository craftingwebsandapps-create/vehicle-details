import { useEffect, useMemo, useRef, useState } from "react"

import {
  ChevronRight,
  FileQuestion,
  FileText,
  MapPin,
  Pencil,
  Phone,
  QrCode,
  Truck,
  UserMinus,
  UserPlus,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"

import { useAppDispatch, useAppSelector } from "~/hooks"
import {
  mobileListCardActionBtn,
  mobileListCardDangerBtn,
  mobileListCardIconTile,
  mobileListCardMetaPanel,
} from "~/components/mobile/ops/mobile-list-card-styles"
import {
  OpsApprovalPill,
  OpsCard,
  OpsEmptyState,
  OpsListHeader,
  OpsListSkeleton,
} from "~/components/mobile/ops/OpsListPrimitives"
import { FormBuilder } from "~/components/form"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import {
  GenericDialog,
  GenericDialogFooter,
} from "~/components/ui/generic-dialog"
import { fetchSitesThunk } from "~/features/sites/sitesSlice"
import { listAvailableDrivers } from "~/features/drivers/api"
import {
  createVehicle,
  downloadVehicleQrPng,
  patchVehicleDriver,
  updateVehicle,
  uploadVehicleDocument,
} from "~/features/vehicles/api"
import {
  fetchVehiclesThunk,
  fetchMoreVehiclesThunk,
} from "~/features/vehicles/vehiclesSlice"
import { getVehicleDialogFormConfig } from "~/schemas/vehicle-dialog-form-config"
import { cn } from "~/lib/utils"
import { getApiErrorMeta } from "~/services/api-error"
import type { Driver } from "~/types/driver"
import type {
  CreateVehicleRequest,
  UpdateVehicleRequest,
  Vehicle,
  VehicleFormValues,
  VehicleListApprovalStatus,
} from "~/types/vehicle"

type VehicleApprovalFilter = "all" | VehicleListApprovalStatus

const initialFormState: VehicleFormValues = {
  name: "",
  type: "",
  registrationNumber: "",
  document: null,
  site: "",
}

const VEHICLE_SEARCH_MAX = 200

function isVehicleApprovedForDriverAssignment(v: Vehicle): boolean {
  return (
    v.approvalStatus === "APPROVED" ||
    String(v.approvalStatus ?? "").toLowerCase() === "approved"
  )
}

function isDriverApprovedForAssignment(d: Driver): boolean {
  return (
    d.approvalStatus === "APPROVED" ||
    String(d.approvalStatus ?? "").toLowerCase() === "approved"
  )
}

const VEHICLE_APPROVAL_FILTERS: Array<{
  label: string
  value: VehicleApprovalFilter
}> = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
]

export default function Vehicles() {
  const dispatch = useAppDispatch()
  const {
    items: vehicles,
    hasNextPage,
    loadMoreStatus,
    status,
    error,
  } = useAppSelector((state) => state.vehicles)
  const { items: sites } = useAppSelector((state) => state.sites)

  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formDefaults, setFormDefaults] =
    useState<VehicleFormValues>(initialFormState)

  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [approvalFilter, setApprovalFilter] =
    useState<VehicleApprovalFilter>("all")

  const [assignPickerVehicleId, setAssignPickerVehicleId] = useState<
    string | null
  >(null)
  const [pickerSearch, setPickerSearch] = useState("")
  const [pickerDebouncedQuery, setPickerDebouncedQuery] = useState("")
  const [pickerDrivers, setPickerDrivers] = useState<Driver[]>([])
  const [pickerLoading, setPickerLoading] = useState(false)
  const [busyVehicleId, setBusyVehicleId] = useState<string | null>(null)
  const [busyQrVehicleId, setBusyQrVehicleId] = useState<string | null>(null)

  const serverApprovalFilter =
    approvalFilter === "all" ? undefined : approvalFilter

  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const vehicleFormConfig = useMemo(
    () => getVehicleDialogFormConfig(dialogMode === "edit", sites),
    [dialogMode, sites]
  )

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, 300)

    return () => window.clearTimeout(handle)
  }, [query])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setPickerDebouncedQuery(pickerSearch.trim())
    }, 300)
    return () => window.clearTimeout(handle)
  }, [pickerSearch])

  useEffect(() => {
    const search =
      debouncedQuery.trim().slice(0, VEHICLE_SEARCH_MAX) || undefined
    void dispatch(
      fetchVehiclesThunk({
        ...(serverApprovalFilter !== undefined
          ? { approvalStatus: serverApprovalFilter }
          : {}),
        search,
      })
    )
  }, [dispatch, debouncedQuery, serverApprovalFilter])

  useEffect(() => {
    void dispatch(
      fetchSitesThunk({ status: "ACTIVE", approvalStatus: "APPROVED" })
    )
  }, [dispatch])

  useEffect(() => {
    const node = loadMoreRef.current
    if (!node) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          hasNextPage &&
          loadMoreStatus !== "loading"
        ) {
          void dispatch(fetchMoreVehiclesThunk())
        }
      },
      { rootMargin: "180px" }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [dispatch, hasNextPage, loadMoreStatus])

  useEffect(() => {
    if (!assignPickerVehicleId) {
      return
    }

    let cancelled = false
    setPickerLoading(true)

    void listAvailableDrivers({
      limit: 100,
      search: pickerDebouncedQuery || undefined,
    })
      .then((res) => {
        if (!cancelled) {
          setPickerDrivers(res.items)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(getApiErrorMeta(err).message)
          setPickerDrivers([])
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPickerLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [assignPickerVehicleId, pickerDebouncedQuery])

  const refetchVehicleList = () => {
    const search =
      debouncedQuery.trim().slice(0, VEHICLE_SEARCH_MAX) || undefined
    return dispatch(
      fetchVehiclesThunk({
        ...(serverApprovalFilter !== undefined
          ? { approvalStatus: serverApprovalFilter }
          : {}),
        search,
      })
    )
  }

  const refreshVehicles = () => {
    void refetchVehicleList()
    toast.success("Vehicle list refreshed", { position: "top-center" })
  }

  const openCreateDialog = () => {
    setDialogMode("create")
    setEditingVehicleId(null)
    setFormDefaults(initialFormState)
    setIsVehicleDialogOpen(true)
  }

  const openEditDialog = (vehicle: Vehicle) => {
    setDialogMode("edit")
    setEditingVehicleId(vehicle._id)
    setFormDefaults({
      name: vehicle.name,
      type: vehicle.type,
      registrationNumber: vehicle.registrationNumber,
      document: vehicle.document ?? "",
      site:
        typeof vehicle.site === "string"
          ? vehicle.site
          : (vehicle.site?._id ?? ""),
    })
    setIsVehicleDialogOpen(true)
  }

  const handleSubmitVehicle = async (values: VehicleFormValues) => {
    setIsSubmitting(true)

    try {
      let documentUrl =
        typeof values.document === "string" ? values.document.trim() : ""

      if (values.document instanceof File) {
        documentUrl = await uploadVehicleDocument(values.document)
      }

      if (!documentUrl) {
        throw new Error("Please upload a vehicle document")
      }

      const payload: CreateVehicleRequest = {
        name: values.name.trim(),
        type: values.type.trim(),
        registrationNumber: values.registrationNumber.trim(),
        document: documentUrl.trim(),
        site: values.site.trim(),
      }

      if (dialogMode === "edit") {
        if (!editingVehicleId) {
          throw new Error("Vehicle id is required")
        }

        const updatePayload: UpdateVehicleRequest = {
          name: payload.name,
          type: payload.type,
          registrationNumber: payload.registrationNumber,
          document: payload.document,
          site: payload.site,
        }

        await updateVehicle(editingVehicleId, updatePayload)
        toast.success("Vehicle update submitted for approval", {
          position: "top-center",
        })
      } else {
        await createVehicle(payload)
        toast.success("Vehicle submitted for approval", {
          position: "top-center",
        })
      }

      await refetchVehicleList()

      setFormDefaults(initialFormState)
      setIsVehicleDialogOpen(false)
      setEditingVehicleId(null)
      setDialogMode("create")
    } catch (submitError) {
      if (dialogMode === "edit") {
        toast.error("Unable to update vehicle")
      } else {
        toast.error("Unable to create vehicle")
      }

      if (submitError instanceof Error) {
        toast.error(submitError.message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const openAssignPicker = (vehicleId: string) => {
    setAssignPickerVehicleId(vehicleId)
    setPickerSearch("")
    setPickerDebouncedQuery("")
  }

  const handlePickDriverForVehicle = async (driver: Driver) => {
    if (!assignPickerVehicleId || !isDriverApprovedForAssignment(driver)) {
      return
    }

    setBusyVehicleId(assignPickerVehicleId)
    try {
      await patchVehicleDriver(assignPickerVehicleId, driver.id)
      toast.success("Driver assigned", { position: "top-center" })
      setAssignPickerVehicleId(null)
      setPickerSearch("")
      await refetchVehicleList()
    } catch (err) {
      toast.error(getApiErrorMeta(err).message)
    } finally {
      setBusyVehicleId(null)
    }
  }

  const handleUnassignDriver = async (vehicle: Vehicle) => {
    setBusyVehicleId(vehicle._id)
    try {
      await patchVehicleDriver(vehicle._id, null)
      toast.success("Driver unassigned", { position: "top-center" })
      await refetchVehicleList()
    } catch (err) {
      toast.error(getApiErrorMeta(err).message)
    } finally {
      setBusyVehicleId(null)
    }
  }

  const handleDownloadVehicleQr = async (vehicle: Vehicle) => {
    setBusyQrVehicleId(vehicle._id)
    try {
      await downloadVehicleQrPng(vehicle._id)
      toast.success("Vehicle QR downloaded", { position: "top-center" })
    } catch (err) {
      toast.error(getApiErrorMeta(err).message, { position: "top-center" })
    } finally {
      setBusyQrVehicleId(null)
    }
  }

  const hasMore = hasNextPage

  return (
    <div className="space-y-3 pb-20">
      <OpsListHeader
        title="Vehicles"
        totalLabel={`${vehicles.length} in view`}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search name, registration, type"
        createLabel="Create"
        onCreate={openCreateDialog}
        onRefresh={refreshVehicles}
        segments={[{ label: "All", value: "all" }]}
        activeSegment="all"
        onSegmentChange={() => {}}
        approvalSegments={VEHICLE_APPROVAL_FILTERS}
        activeApprovalSegment={approvalFilter}
        onApprovalSegmentChange={setApprovalFilter}
      />

      <GenericDialog
        open={isVehicleDialogOpen}
        onOpenChange={setIsVehicleDialogOpen}
        title={dialogMode === "edit" ? "Edit Vehicle" : "Create Vehicle"}
        description={
          dialogMode === "edit"
            ? "Update vehicle details and registration document."
            : "Add vehicle and attach registration file."
        }
        maxWidth="lg"
        footer={
          <GenericDialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsVehicleDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="vehicle-dialog-form"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Submitting..."
                : dialogMode === "edit"
                  ? "Update"
                  : "Create"}
            </Button>
          </GenericDialogFooter>
        }
      >
        <FormBuilder
          key={`${dialogMode}-${editingVehicleId ?? "new"}-${isVehicleDialogOpen ? "open" : "closed"}`}
          config={vehicleFormConfig}
          defaultValues={formDefaults}
          onSubmit={handleSubmitVehicle}
          isSubmitting={isSubmitting}
          className="space-y-4 px-1"
          hideButtons
        />
      </GenericDialog>

      <GenericDialog
        open={assignPickerVehicleId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAssignPickerVehicleId(null)
            setPickerSearch("")
            setPickerDebouncedQuery("")
          }
        }}
        title="Assign driver"
        description="Unassigned drivers from your contractor. Only approved drivers can be assigned; pending or rejected rows are disabled."
        maxWidth="lg"
        footer={
          <GenericDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAssignPickerVehicleId(null)
                setPickerSearch("")
                setPickerDebouncedQuery("")
              }}
            >
              Cancel
            </Button>
          </GenericDialogFooter>
        }
      >
        <div className="space-y-3">
          <Input
            placeholder="Search name or licence…"
            value={pickerSearch}
            onChange={(e) => setPickerSearch(e.target.value)}
            className="h-9 rounded-xl"
          />
          <div className="max-h-[min(50vh,320px)] space-y-1 overflow-y-auto rounded-xl border border-border/60 p-1">
            {pickerLoading ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                Loading drivers…
              </p>
            ) : pickerDrivers.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                No drivers match your search.
              </p>
            ) : (
              pickerDrivers.map((d) => {
                const ok = isDriverApprovedForAssignment(d)
                const statusLower = String(d.approvalStatus ?? "").toLowerCase()
                const hint =
                  statusLower === "pending" ||
                  d.approvalStatus === "PENDING_APPROVAL"
                    ? "Pending approval"
                    : statusLower === "rejected" ||
                        d.approvalStatus === "REJECTED"
                      ? "Rejected"
                      : null

                return (
                  <button
                    key={d.id}
                    type="button"
                    disabled={!ok || busyVehicleId !== null}
                    onClick={() => void handlePickDriverForVehicle(d)}
                    className={cn(
                      "flex w-full flex-col items-start rounded-lg px-3 py-2.5 text-left transition-colors",
                      ok
                        ? "hover:bg-muted active:bg-muted/80"
                        : "cursor-not-allowed opacity-55"
                    )}
                  >
                    <span className="text-sm font-medium">{d.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {d.licenceNumber} · {d.mobileNumber}
                    </span>
                    {!ok && hint ? (
                      <span
                        className={cn(
                          "mt-1 text-[11px]",
                          hint === "Rejected"
                            ? "text-destructive"
                            : "text-muted-foreground"
                        )}
                      >
                        {hint}
                      </span>
                    ) : null}
                  </button>
                )
              })
            )}
          </div>
        </div>
      </GenericDialog>

      {status === "loading" ? <OpsListSkeleton /> : null}

      {status === "failed" ? (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {status !== "loading" &&
      status !== "failed" &&
      vehicles.length === 0 ? (
        <OpsEmptyState
          title="No matching vehicles"
          subtitle="Try another filter or search term."
        />
      ) : null}

      {status !== "loading" && status !== "failed" ? (
        <section className="space-y-2">
          {vehicles.map((vehicle) => {
            const siteName =
              typeof vehicle.site === "string"
                ? vehicle.site
                : (vehicle.site?.name ?? "Unallocated")
            const driverName = vehicle.driver?.name ?? "Unassigned"
            const rejectionNote = vehicle.approvalNote?.trim()
            const isRejected =
              vehicle.approvalStatus === "REJECTED" ||
              String(vehicle.approvalStatus ?? "").toLowerCase() === "rejected"
            const canAssignDriver =
              isVehicleApprovedForDriverAssignment(vehicle)
            const busy = busyVehicleId === vehicle._id
            const qrBusy = busyQrVehicleId === vehicle._id
            const driverPhone =
              vehicle.driver?.mobileNumber?.replace(/\s+/g, "").trim() ?? ""

            return (
              <OpsCard key={vehicle._id}>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className={mobileListCardIconTile} aria-hidden>
                      <Truck className="size-4 stroke-2" />
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-base leading-tight font-semibold tracking-tight break-words text-foreground">
                        {vehicle.registrationNumber}
                      </p>
                      <p className="mt-0.5 text-[0.64rem] break-words text-muted-foreground">
                        {vehicle.name} • {vehicle.type}
                      </p>
                    </div>
                    <div className="shrink-0 pt-0.5">
                      <OpsApprovalPill
                        appearance="badge"
                        status={vehicle.approvalStatus}
                      />
                    </div>
                  </div>

                  {isRejected && rejectionNote ? (
                    <p className="rounded-lg border border-destructive/25 bg-destructive/5 px-2.5 py-2 text-xs leading-snug text-destructive">
                      {rejectionNote}
                    </p>
                  ) : null}

                  <div className="grid grid-cols-2 gap-1.5">
                    <div className={mobileListCardMetaPanel}>
                      <div className="flex gap-1.5">
                        <UserRound
                          className="size-4 shrink-0 stroke-2 text-primary"
                          aria-hidden
                        />
                        <div className="min-w-0">
                          <p className="text-[0.64rem] leading-none font-medium text-muted-foreground">
                            Driver
                          </p>
                          <p className="mt-0.5 text-xs leading-snug font-medium break-words text-foreground">
                            {driverName}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className={mobileListCardMetaPanel}>
                      <div className="flex gap-1.5">
                        <MapPin
                          className="size-4 shrink-0 stroke-2 text-primary"
                          aria-hidden
                        />
                        <div className="min-w-0">
                          <p className="text-[0.64rem] leading-none font-medium text-muted-foreground">
                            Site
                          </p>
                          <p className="mt-0.5 text-xs leading-snug font-medium break-words text-foreground">
                            {siteName}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0">
                    {vehicle.document ? (
                      <a
                        href={vehicle.document}
                        target="_blank"
                        rel="noreferrer"
                        className="flex max-w-full items-center justify-between gap-2 rounded-lg py-1.5 text-primary transition-colors hover:bg-primary/10 hover:text-primary"
                      >
                        <span className="flex min-w-0 items-center gap-1.5">
                          <FileText
                            className="size-4 shrink-0 stroke-2"
                            aria-hidden
                          />
                          <span className="truncate text-[0.64rem] font-medium">
                            Document
                          </span>
                        </span>
                        <ChevronRight
                          className="size-4 shrink-0 text-primary opacity-80"
                          aria-hidden
                        />
                      </a>
                    ) : (
                      <span className="flex items-center gap-1.5 rounded-lg py-1.5 text-[0.64rem] font-medium text-muted-foreground">
                        <FileQuestion
                          className="size-4 shrink-0 stroke-2 opacity-70"
                          aria-hidden
                        />
                        No document on file
                      </span>
                    )}
                  </div>

                  <div className="border-border border-t border-dashed pt-2 dark:border-border">
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                      {canAssignDriver ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            className={mobileListCardActionBtn}
                            onClick={() => openAssignPicker(vehicle._id)}
                          >
                            <UserPlus />
                            {vehicle.driver ? "Change" : "Assign"}
                          </Button>
                          {vehicle.driver ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className={mobileListCardDangerBtn}
                              disabled={busy}
                              onClick={() => void handleUnassignDriver(vehicle)}
                            >
                              <UserMinus />
                              Unassign
                            </Button>
                          ) : null}
                        </>
                      ) : null}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy || qrBusy}
                        className={mobileListCardActionBtn}
                        onClick={() => void handleDownloadVehicleQr(vehicle)}
                        aria-label={`Download QR for ${vehicle.registrationNumber}`}
                      >
                        <QrCode />
                        QR
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={mobileListCardActionBtn}
                        onClick={() => openEditDialog(vehicle)}
                      >
                        <Pencil />
                        Edit
                      </Button>
                    </div>
                    {driverPhone ? (
                      <div className="mt-1.5 flex justify-start">
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            mobileListCardActionBtn,
                            "min-w-[calc(50%-4px)] sm:min-w-[6.5rem]"
                          )}
                          asChild
                        >
                          <a href={`tel:${driverPhone}`}>
                            <Phone />
                            Call
                          </a>
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </OpsCard>
            )
          })}

          <div ref={loadMoreRef} className="py-2 text-center">
            {hasMore ? (
              <p className="text-xs text-muted-foreground">
                Loading more vehicles...
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                End of vehicle list
              </p>
            )}
          </div>
        </section>
      ) : null}

    </div>
  )
}
