import { useEffect, useMemo, useRef, useState } from "react"

import {
  CarFront,
  Clock3,
  ExternalLink,
  FileBadge2,
  MoreHorizontal,
  Pencil,
  Phone,
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
import {
  createDriver,
  updateDriver,
  uploadDriverLicence,
} from "~/features/drivers/api"
import { fetchDriversThunk } from "~/features/drivers/driversSlice"
import { getDriverDialogFormConfig } from "~/schemas/driver-dialog-form-config"
import type {
  CreateDriverRequest,
  Driver,
  DriverFormValues,
  UpdateDriverRequest,
} from "~/types/driver"

const initialFormState: DriverFormValues = {
  name: "",
  licenceNumber: "",
  licenceUrl: null,
  mobileNumber: "",
  contractor: "",
  status: "ACTIVE",
}

type DriverSegment = "all" | "active" | "inactive" | "assigned"

const DRIVER_SEGMENTS: Array<{ label: string; value: DriverSegment }> = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Assigned", value: "assigned" },
]

export default function Drivers() {
  const dispatch = useAppDispatch()
  const {
    items: drivers,
    status,
    error,
  } = useAppSelector((state) => state.drivers)

  const [isDriverDialogOpen, setIsDriverDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formDefaults, setFormDefaults] =
    useState<DriverFormValues>(initialFormState)

  const [query, setQuery] = useState("")
  const [segment, setSegment] = useState<DriverSegment>("all")
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [actionDriver, setActionDriver] = useState<Driver | null>(null)
  const [visibleCount, setVisibleCount] = useState(12)

  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const longPressTimeoutRef = useRef<number | null>(null)

  const driverFormConfig = useMemo(
    () => getDriverDialogFormConfig(dialogMode === "edit"),
    [dialogMode]
  )

  useEffect(() => {
    void dispatch(fetchDriversThunk())
  }, [dispatch])

  const filteredDrivers = useMemo(() => {
    const term = query.trim().toLowerCase()

    return drivers.filter((driver) => {
      const matchesSegment =
        segment === "all"
          ? true
          : segment === "active"
            ? driver.status === "ACTIVE"
            : segment === "inactive"
              ? driver.status === "INACTIVE"
              : Boolean(
                  driver.vehicle?.id || driver.vehicle?.registrationNumber
                )

      const matchesSearch =
        term.length === 0
          ? true
          : [
              driver.name,
              driver.mobileNumber,
              driver.licenceNumber,
              driver.vehicle?.registrationNumber,
              driver.site?.name,
            ]
              .join(" ")
              .toLowerCase()
              .includes(term)

      return matchesSegment && matchesSearch
    })
  }, [drivers, query, segment])

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
          setVisibleCount((prev) => Math.min(prev + 8, filteredDrivers.length))
        }
      },
      { rootMargin: "180px" }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [filteredDrivers.length])

  const visibleDrivers = filteredDrivers.slice(0, visibleCount)

  const groupedDrivers = useMemo(
    () => [
      {
        title: "Active",
        items: visibleDrivers.filter((item) => item.status === "ACTIVE"),
      },
      {
        title: "Inactive",
        items: visibleDrivers.filter((item) => item.status !== "ACTIVE"),
      },
    ],
    [visibleDrivers]
  )

  const refreshDrivers = () => {
    void dispatch(fetchDriversThunk())
    toast.success("Driver list refreshed", { position: "top-center" })
  }

  const openCreateDialog = () => {
    setDialogMode("create")
    setEditingDriverId(null)
    setFormDefaults(initialFormState)
    setIsDriverDialogOpen(true)
  }

  const openEditDialog = (driver: Driver) => {
    setDialogMode("edit")
    setEditingDriverId(driver.id)
    setFormDefaults({
      name: driver.name,
      licenceNumber: driver.licenceNumber,
      licenceUrl: driver.licenceUrl ?? "",
      mobileNumber: driver.mobileNumber,
      contractor: driver.contractor?.id ?? "",
      status: driver.status,
    })
    setIsDriverDialogOpen(true)
  }

  const startLongPress = (driver: Driver) => {
    longPressTimeoutRef.current = window.setTimeout(() => {
      setActionDriver(driver)
    }, 500)
  }

  const clearLongPress = () => {
    if (longPressTimeoutRef.current !== null) {
      window.clearTimeout(longPressTimeoutRef.current)
      longPressTimeoutRef.current = null
    }
  }

  const handleSubmitDriver = async (values: DriverFormValues) => {
    setIsSubmitting(true)

    try {
      let licenceUrl =
        typeof values.licenceUrl === "string" ? values.licenceUrl.trim() : ""

      if (values.licenceUrl instanceof File) {
        licenceUrl = await uploadDriverLicence(values.licenceUrl)
      }

      if (!licenceUrl) {
        throw new Error("Please upload a licence file")
      }

      const payload: CreateDriverRequest = {
        name: values.name.trim(),
        licenceNumber: values.licenceNumber.trim(),
        licenceUrl,
        mobileNumber: values.mobileNumber.trim(),
        contractor: values.contractor.trim(),
        status: values.status,
      }

      if (dialogMode === "edit") {
        if (!editingDriverId) {
          throw new Error("Driver id is required")
        }

        const updatePayload: UpdateDriverRequest = {
          ...payload,
        }

        await updateDriver(editingDriverId, updatePayload)
        toast.success("Driver updated successfully", { position: "top-center" })
      } else {
        await createDriver(payload)
        toast.success("Driver created successfully", { position: "top-center" })
      }

      await dispatch(fetchDriversThunk())

      setFormDefaults(initialFormState)
      setIsDriverDialogOpen(false)
      setEditingDriverId(null)
      setDialogMode("create")
    } catch (submitError) {
      if (dialogMode === "edit") {
        toast.error("Unable to update driver")
      } else {
        toast.error("Unable to create driver")
      }

      if (submitError instanceof Error) {
        toast.error(submitError.message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasMore = visibleDrivers.length < filteredDrivers.length

  return (
    <div className="space-y-3 pb-20">
      <OpsListHeader
        title="Drivers"
        totalLabel={`${filteredDrivers.length} in view`}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search name, mobile, vehicle"
        createLabel="Create"
        onCreate={openCreateDialog}
        onRefresh={refreshDrivers}
        segments={DRIVER_SEGMENTS}
        activeSegment={segment}
        onSegmentChange={setSegment}
      />

      <GenericDialog
        open={isDriverDialogOpen}
        onOpenChange={setIsDriverDialogOpen}
        title={dialogMode === "edit" ? "Edit Driver" : "Create Driver"}
        description={
          dialogMode === "edit"
            ? "Update profile, assignment, and licence details."
            : "Add a new driver and upload licence file."
        }
        maxWidth="lg"
        footer={
          <GenericDialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDriverDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="driver-dialog-form"
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
          key={`${dialogMode}-${editingDriverId ?? "new"}-${isDriverDialogOpen ? "open" : "closed"}`}
          config={driverFormConfig}
          defaultValues={formDefaults}
          onSubmit={handleSubmitDriver}
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
      filteredDrivers.length === 0 ? (
        <OpsEmptyState
          title="No matching drivers"
          subtitle="Try a different search or change filters."
        />
      ) : null}

      {status !== "loading" && status !== "failed" ? (
        <section className="space-y-3">
          {groupedDrivers.map((group) =>
            group.items.length > 0 ? (
              <div key={group.title} className="space-y-2">
                <p className="sticky top-[132px] z-10 inline-flex rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
                  {group.title}
                </p>

                <div className="space-y-2">
                  {group.items.map((driver) => {
                    const initial = driver.name.charAt(0).toUpperCase()
                    const assignedVehicle =
                      driver.vehicle?.registrationNumber ??
                      driver.vehicle?.name ??
                      "Unassigned"

                    return (
                      <OpsCard key={driver.id}>
                        <div
                          className="space-y-3"
                          onPointerDown={() => startLongPress(driver)}
                          onPointerUp={clearLongPress}
                          onPointerLeave={clearLongPress}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                              {initial}
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm leading-tight font-semibold text-foreground">
                                    {driver.name}
                                  </p>
                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    {driver.mobileNumber}
                                  </p>
                                </div>

                                <div className="flex items-center gap-1">
                                  <OpsStatusPill status={driver.status} />
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => setActionDriver(driver)}
                                  >
                                    <MoreHorizontal className="size-3.5" />
                                  </Button>
                                </div>
                              </div>

                              <div className="mt-2 grid grid-cols-3 gap-1.5 text-[11px]">
                                <span className="rounded-lg bg-muted px-2 py-1 text-muted-foreground">
                                  Shift 08-18
                                </span>
                                <span className="rounded-lg bg-muted px-2 py-1 text-muted-foreground">
                                  {driver.licenceUrl
                                    ? "Licence valid"
                                    : "Licence pending"}
                                </span>
                                <span className="rounded-lg bg-muted px-2 py-1 text-muted-foreground">
                                  {assignedVehicle}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            {driver.licenceUrl ? (
                              <a
                                href={driver.licenceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-medium text-primary"
                              >
                                <ExternalLink className="size-3" />
                                View licence
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                No licence file
                              </span>
                            )}

                            <div className="flex items-center gap-1.5">
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => {
                                  window.location.href = `tel:${driver.mobileNumber}`
                                }}
                              >
                                <Phone className="size-3.5" />
                                Call
                              </Button>
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => openEditDialog(driver)}
                              >
                                <Pencil className="size-3.5" />
                                Edit
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
                Loading more drivers...
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">End of list</p>
            )}
          </div>
        </section>
      ) : null}

      <OpsFloatingFilterButton onClick={() => setIsFilterSheetOpen(true)} />

      <OpsActionSheet
        open={isFilterSheetOpen}
        onOpenChange={setIsFilterSheetOpen}
        title="Driver Filters"
        actions={DRIVER_SEGMENTS.map((item) => ({
          key: item.value,
          label: `${item.label}${segment === item.value ? " • selected" : ""}`,
          icon: Clock3,
          onClick: () => setSegment(item.value),
        }))}
      />

      <OpsActionSheet
        open={Boolean(actionDriver)}
        onOpenChange={(open) => {
          if (!open) {
            setActionDriver(null)
          }
        }}
        title={actionDriver ? `${actionDriver.name} actions` : "Driver actions"}
        actions={
          actionDriver
            ? [
                {
                  key: "call",
                  label: "Call driver",
                  icon: Phone,
                  onClick: () => {
                    window.location.href = `tel:${actionDriver.mobileNumber}`
                  },
                },
                {
                  key: "assign",
                  label: "Assign vehicle",
                  icon: CarFront,
                  onClick: () => {
                    toast.message("Open assignment workflow")
                  },
                },
                {
                  key: "licence",
                  label: "Licence details",
                  icon: FileBadge2,
                  onClick: () => {
                    if (actionDriver.licenceUrl) {
                      window.open(
                        actionDriver.licenceUrl,
                        "_blank",
                        "noreferrer"
                      )
                    }
                  },
                },
                {
                  key: "edit",
                  label: "Edit profile",
                  icon: Pencil,
                  onClick: () => openEditDialog(actionDriver),
                },
              ]
            : []
        }
      />
    </div>
  )
}
