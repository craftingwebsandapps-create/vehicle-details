import { useEffect, useMemo, useRef, useState } from "react"

import {
  ExternalLink,
  Fuel,
  MapPinned,
  MoreHorizontal,
  Navigation,
  Pencil,
  Phone,
  UserPlus,
} from "lucide-react"
import { toast } from "sonner"

import { useAppDispatch, useAppSelector } from "~/app/hooks"
import {
  OpsActionSheet,
  OpsCard,
  OpsEmptyState,
  OpsFloatingFilterButton,
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
import { fetchVehiclesThunk } from "~/features/vehicles/vehiclesSlice"
import { getVehicleDialogFormConfig } from "~/schemas/vehicle-dialog-form-config"
import type {
  CreateVehicleRequest,
  UpdateVehicleRequest,
  Vehicle,
  VehicleFormValues,
} from "~/types/vehicle"

const initialFormState: VehicleFormValues = {
  name: "",
  type: "",
  registrationNumber: "",
  document: null,
  status: "ACTIVE",
  site: "",
}

type VehicleSegment = "all" | "active" | "inactive" | "assigned"

const VEHICLE_SEGMENTS: Array<{ label: string; value: VehicleSegment }> = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Assigned", value: "assigned" },
]

export default function Vehicles() {
  const dispatch = useAppDispatch()
  const {
    items: vehicles,
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
  const [segment, setSegment] = useState<VehicleSegment>("all")
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [actionVehicle, setActionVehicle] = useState<Vehicle | null>(null)
  const [visibleCount, setVisibleCount] = useState(12)

  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const longPressTimeoutRef = useRef<number | null>(null)

  const vehicleFormConfig = useMemo(
    () => getVehicleDialogFormConfig(dialogMode === "edit", sites),
    [dialogMode, sites]
  )

  useEffect(() => {
    void dispatch(fetchVehiclesThunk())
    void dispatch(fetchSitesThunk())
  }, [dispatch])

  const filteredVehicles = useMemo(() => {
    const term = query.trim().toLowerCase()

    return vehicles.filter((vehicle) => {
      const siteName =
        typeof vehicle.site === "string"
          ? vehicle.site
          : (vehicle.site?.name ?? "")

      const matchesSegment =
        segment === "all"
          ? true
          : segment === "active"
            ? vehicle.status === "ACTIVE"
            : segment === "inactive"
              ? vehicle.status === "INACTIVE"
              : Boolean(vehicle.driver?.name)

      const matchesSearch =
        term.length === 0
          ? true
          : [vehicle.registrationNumber, vehicle.name, vehicle.type, siteName]
              .join(" ")
              .toLowerCase()
              .includes(term)

      return matchesSegment && matchesSearch
    })
  }, [vehicles, query, segment])

  useEffect(() => {
    setVisibleCount(12)
  }, [query, segment])

  useEffect(() => {
    const node = loadMoreRef.current
    if (!node) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 8, filteredVehicles.length))
        }
      },
      { rootMargin: "180px" }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [filteredVehicles.length])

  const visibleVehicles = filteredVehicles.slice(0, visibleCount)

  const groupedVehicles = useMemo(
    () => [
      {
        title: "Live fleet",
        items: visibleVehicles.filter((item) => item.status === "ACTIVE"),
      },
      {
        title: "Inactive fleet",
        items: visibleVehicles.filter((item) => item.status !== "ACTIVE"),
      },
    ],
    [visibleVehicles]
  )

  const refreshVehicles = () => {
    void dispatch(fetchVehiclesThunk())
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
      site: typeof vehicle.site === "string" ? vehicle.site : vehicle.site._id,
    })
    setIsVehicleDialogOpen(true)
  }

  const startLongPress = (vehicle: Vehicle) => {
    longPressTimeoutRef.current = window.setTimeout(() => {
      setActionVehicle(vehicle)
    }, 500)
  }

  const clearLongPress = () => {
    if (longPressTimeoutRef.current !== null) {
      window.clearTimeout(longPressTimeoutRef.current)
      longPressTimeoutRef.current = null
    }
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
        toast.success("Vehicle updated successfully", {
          position: "top-center",
        })
      } else {
        await createVehicle(payload)
        toast.success("Vehicle created successfully", {
          position: "top-center",
        })
      }

      await dispatch(fetchVehiclesThunk())

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

  const hasMore = visibleVehicles.length < filteredVehicles.length

  return (
    <div className="space-y-3 pb-20">
      <OpsListHeader
        title="Vehicles"
        totalLabel={`${filteredVehicles.length} in view`}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search reg no, type, site"
        createLabel="Create"
        onCreate={openCreateDialog}
        onRefresh={refreshVehicles}
        segments={VEHICLE_SEGMENTS}
        activeSegment={segment}
        onSegmentChange={setSegment}
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
      filteredVehicles.length === 0 ? (
        <OpsEmptyState
          title="No matching vehicles"
          subtitle="Try another filter or search term."
        />
      ) : null}

      {status !== "loading" && status !== "failed" ? (
        <section className="space-y-3">
          {groupedVehicles.map((group) =>
            group.items.length > 0 ? (
              <div key={group.title} className="space-y-2">
                <p className="sticky top-[132px] z-10 inline-flex rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
                  {group.title}
                </p>

                <div className="space-y-2">
                  {group.items.map((vehicle) => {
                    const siteName =
                      typeof vehicle.site === "string"
                        ? vehicle.site
                        : (vehicle.site?.name ?? "Unallocated")
                    const driverName = vehicle.driver?.name ?? "Unassigned"

                    return (
                      <OpsCard key={vehicle._id}>
                        <div
                          className="space-y-3"
                          onPointerDown={() => startLongPress(vehicle)}
                          onPointerUp={clearLongPress}
                          onPointerLeave={clearLongPress}
                        >
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
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => setActionVehicle(vehicle)}
                              >
                                <MoreHorizontal className="size-3.5" />
                              </Button>
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
                              <Button variant="outline" size="xs">
                                <Phone className="size-3.5" />
                                Call
                              </Button>
                              <Button variant="outline" size="xs">
                                <UserPlus className="size-3.5" />
                                Assign
                              </Button>
                              <Button variant="outline" size="xs">
                                <Navigation className="size-3.5" />
                                Track
                              </Button>
                            </div>
                          </div>
                        </div>
                      </OpsCard>
                    )
                  })}
                </div>
              </div>
            ) : null
          )}

          <div ref={loadMoreRef} className="py-2 text-center">
            {hasMore ? (
              <p className="text-xs text-muted-foreground">
                Loading more vehicles...
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">End of fleet list</p>
            )}
          </div>
        </section>
      ) : null}

      <OpsFloatingFilterButton onClick={() => setIsFilterSheetOpen(true)} />

      <OpsActionSheet
        open={isFilterSheetOpen}
        onOpenChange={setIsFilterSheetOpen}
        title="Vehicle Filters"
        actions={VEHICLE_SEGMENTS.map((item) => ({
          key: item.value,
          label: `${item.label}${segment === item.value ? " • selected" : ""}`,
          icon: Fuel,
          onClick: () => setSegment(item.value),
        }))}
      />

      <OpsActionSheet
        open={Boolean(actionVehicle)}
        onOpenChange={(open) => {
          if (!open) {
            setActionVehicle(null)
          }
        }}
        title={
          actionVehicle
            ? `${actionVehicle.registrationNumber} actions`
            : "Vehicle actions"
        }
        actions={
          actionVehicle
            ? [
                {
                  key: "track",
                  label: "Track live vehicle",
                  icon: Navigation,
                  onClick: () => {
                    toast.message("Opening live tracking")
                  },
                },
                {
                  key: "assign",
                  label: "Assign driver",
                  icon: UserPlus,
                  onClick: () => {
                    toast.message("Opening assignment flow")
                  },
                },
                {
                  key: "site",
                  label: "View site details",
                  icon: MapPinned,
                  onClick: () => {
                    toast.message("Opening site details")
                  },
                },
                {
                  key: "edit",
                  label: "Edit vehicle",
                  icon: Pencil,
                  onClick: () => openEditDialog(actionVehicle),
                },
              ]
            : []
        }
      />
    </div>
  )
}
