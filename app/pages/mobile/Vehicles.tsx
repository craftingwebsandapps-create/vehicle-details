import { useEffect, useMemo, useRef, useState } from "react"

import { ExternalLink, Pencil, Phone } from "lucide-react"
import { toast } from "sonner"

import { useAppDispatch, useAppSelector } from "~/hooks"
import {
  OpsApprovalPill,
  OpsCard,
  OpsEmptyState,
  OpsListHeader,
  OpsListSkeleton,
  OpsStatusPill,
} from "~/components/mobile/ops/OpsListPrimitives"
import { FormBuilder } from "~/components/form"
import { Button } from "~/components/ui/button"
import {
  GenericDialog,
  GenericDialogFooter,
} from "~/components/ui/generic-dialog"
import { fetchSitesThunk } from "~/features/sites/sitesSlice"
import {
  createVehicle,
  updateVehicle,
  uploadVehicleDocument,
} from "~/features/vehicles/api"
import {
  fetchVehiclesThunk,
  fetchMoreVehiclesThunk,
} from "~/features/vehicles/vehiclesSlice"
import { getVehicleDialogFormConfig } from "~/schemas/vehicle-dialog-form-config"
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
  status: "ACTIVE",
  site: "",
}

const VEHICLE_SEARCH_MAX = 200

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

  const refreshVehicles = () => {
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
      status: vehicle.status,
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
        document: documentUrl,
        status: values.status,
        site: values.site.trim(),
      }

      if (dialogMode === "edit") {
        if (!editingVehicleId) {
          throw new Error("Vehicle id is required")
        }

        const updatePayload: UpdateVehicleRequest = {
          ...payload,
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

      const search =
        debouncedQuery.trim().slice(0, VEHICLE_SEARCH_MAX) || undefined
      await dispatch(
        fetchVehiclesThunk({
          ...(serverApprovalFilter !== undefined
            ? { approvalStatus: serverApprovalFilter }
            : {}),
          search,
        })
      )

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

            return (
              <OpsCard key={vehicle._id}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-base leading-tight font-semibold tracking-tight text-foreground">
                        {vehicle.registrationNumber}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {vehicle.name} • {vehicle.type}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <OpsStatusPill status={vehicle.status} />
                      <OpsApprovalPill status={vehicle.approvalStatus} />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="rounded-lg bg-muted px-2 py-1 text-muted-foreground">
                      Driver: {driverName}
                    </span>
                    <span className="rounded-lg bg-muted px-2 py-1 text-muted-foreground">
                      Site: {siteName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    {vehicle.document ? (
                      <a
                        href={vehicle.document}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary"
                      >
                        <ExternalLink className="size-3" />
                        Document
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        No document
                      </span>
                    )}

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => openEditDialog(vehicle)}
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </Button>
                      <Button variant="outline" size="xs">
                        <Phone className="size-3.5" />
                        Call
                      </Button>
                    </div>
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
