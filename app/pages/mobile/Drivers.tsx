import { useEffect, useMemo, useRef, useState } from "react"

import {
  ChevronRight,
  FileQuestion,
  FileText,
  IdCard,
  Pencil,
  Phone,
  Truck,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"

import { useAppDispatch, useAppSelector } from "~/hooks"
import {
  mobileListCardActionBtn,
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
import {
  GenericDialog,
  GenericDialogFooter,
} from "~/components/ui/generic-dialog"
import {
  createDriver,
  updateDriver,
  uploadDriverLicence,
} from "~/features/drivers/api"
import {
  fetchDriversThunk,
  fetchMoreDriversThunk,
} from "~/features/drivers/driversSlice"
import { getDriverDialogFormConfig } from "~/schemas/driver-dialog-form-config"
import type {
  CreateDriverRequest,
  Driver,
  DriverFormValues,
  DriverListApprovalStatus,
  UpdateDriverRequest,
} from "~/types/driver"

const initialFormState: DriverFormValues = {
  name: "",
  licenceNumber: "",
  licenceUrl: null,
  mobileNumber: "",
  contractor: "",
}

type DriverApprovalFilter = "all" | DriverListApprovalStatus

const DRIVER_APPROVAL_FILTERS: Array<{
  label: string
  value: DriverApprovalFilter
}> = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
]

export default function Drivers() {
  const dispatch = useAppDispatch()
  const {
    items: drivers,
    hasNextPage,
    loadMoreStatus,
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
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [approvalFilter, setApprovalFilter] =
    useState<DriverApprovalFilter>("all")

  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const driverFormConfig = useMemo(
    () => getDriverDialogFormConfig(dialogMode === "edit"),
    [dialogMode]
  )

  const serverApprovalFilter =
    approvalFilter === "all" ? undefined : approvalFilter

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, 300)

    return () => window.clearTimeout(handle)
  }, [query])

  useEffect(() => {
    void dispatch(
      fetchDriversThunk({
        approvalStatus: serverApprovalFilter,
        search: debouncedQuery || undefined,
      })
    )
  }, [dispatch, serverApprovalFilter, debouncedQuery])

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
          void dispatch(fetchMoreDriversThunk())
        }
      },
      { rootMargin: "180px" }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [dispatch, hasNextPage, loadMoreStatus])

  const refreshDrivers = () => {
    void dispatch(
      fetchDriversThunk({
        approvalStatus: serverApprovalFilter,
        search: debouncedQuery || undefined,
      })
    )
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
    })
    setIsDriverDialogOpen(true)
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

      const mobileNumber = values.mobileNumber.replace(/\s+/g, "").trim()

      const createPayload: CreateDriverRequest = {
        name: values.name.trim(),
        licenceNumber: values.licenceNumber.trim(),
        licenceUrl,
        mobileNumber,
      }
      const contractorId = values.contractor?.trim()
      if (contractorId) {
        createPayload.contractor = contractorId
      }

      if (dialogMode === "edit") {
        if (!editingDriverId) {
          throw new Error("Driver id is required")
        }

        const updatePayload: UpdateDriverRequest = {
          ...createPayload,
        }

        await updateDriver(editingDriverId, updatePayload)
        toast.success("Driver update submitted for approval", {
          position: "top-center",
        })
      } else {
        await createDriver(createPayload)
        toast.success("Driver submitted for approval", {
          position: "top-center",
        })
      }

      await dispatch(
        fetchDriversThunk({
          approvalStatus: serverApprovalFilter,
          search: debouncedQuery || undefined,
        })
      )

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

  const hasMore = hasNextPage

  return (
    <div className="space-y-3 pb-20">
      <OpsListHeader
        title="Drivers"
        totalLabel={`${drivers.length} in view`}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search name, mobile, vehicle"
        createLabel="Create"
        onCreate={openCreateDialog}
        onRefresh={refreshDrivers}
        segments={[{ label: "All", value: "all" }]}
        activeSegment="all"
        onSegmentChange={() => {}}
        approvalSegments={DRIVER_APPROVAL_FILTERS}
        activeApprovalSegment={approvalFilter}
        onApprovalSegmentChange={setApprovalFilter}
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
      drivers.length === 0 ? (
        <OpsEmptyState
          title="No matching drivers"
          subtitle="Try a different search or change filters."
        />
      ) : null}

      {status !== "loading" && status !== "failed" ? (
        <section className="space-y-2">
          {drivers.map((driver) => {
            const assignedVehicle =
              driver.vehicle?.registrationNumber ??
              driver.vehicle?.name ??
              "Unassigned"
            const rejectionNote = driver.approvalNote?.trim()
            const isRejected =
              driver.approvalStatus === "REJECTED" ||
              String(driver.approvalStatus ?? "").toLowerCase() === "rejected"

            return (
              <OpsCard key={driver.id}>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className={mobileListCardIconTile} aria-hidden>
                      <UserRound className="size-6 stroke-[2]" />
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-lg leading-tight font-bold break-words text-foreground">
                        {driver.name}
                      </p>
                      <p className="mt-0.5 text-xs break-words text-muted-foreground">
                        {driver.mobileNumber}
                      </p>
                    </div>
                    <div className="shrink-0 pt-0.5">
                      <OpsApprovalPill
                        appearance="badge"
                        status={driver.approvalStatus}
                      />
                    </div>
                  </div>

                  {isRejected && rejectionNote ? (
                    <p className="rounded-lg border border-destructive/25 bg-destructive/5 px-2.5 py-2 text-xs leading-snug text-destructive">
                      {rejectionNote}
                    </p>
                  ) : null}

                  <div className="grid grid-cols-2 gap-2">
                    <div className={mobileListCardMetaPanel}>
                      <div className="flex gap-2">
                        <IdCard
                          className="size-5 shrink-0 stroke-[2.25] text-primary"
                          aria-hidden
                        />
                        <div className="min-w-0">
                          <p className="text-[11px] leading-none font-medium text-muted-foreground">
                            Licence
                          </p>
                          <p className="mt-1 text-sm leading-snug font-semibold break-words tabular-nums text-foreground">
                            {driver.licenceNumber}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className={mobileListCardMetaPanel}>
                      <div className="flex gap-2">
                        <Truck
                          className="size-5 shrink-0 stroke-[2.25] text-primary"
                          aria-hidden
                        />
                        <div className="min-w-0">
                          <p className="text-[11px] leading-none font-medium text-muted-foreground">
                            Vehicle
                          </p>
                          <p className="mt-1 text-sm leading-snug font-semibold break-words text-foreground">
                            {assignedVehicle}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0">
                    {driver.licenceUrl ? (
                      <a
                        href={driver.licenceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex max-w-full items-center justify-between gap-3 rounded-lg py-2 text-primary transition-colors hover:bg-primary/10 hover:text-primary"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <FileText
                            className="size-5 shrink-0 stroke-[2.35]"
                            aria-hidden
                          />
                          <span className="truncate text-sm font-semibold">
                            View licence
                          </span>
                        </span>
                        <ChevronRight
                          className="size-5 shrink-0 text-primary opacity-80"
                          aria-hidden
                        />
                      </a>
                    ) : (
                      <span className="flex items-center gap-2 rounded-lg py-2 text-sm font-medium text-muted-foreground">
                        <FileQuestion
                          className="size-5 shrink-0 stroke-[2.25] opacity-70"
                          aria-hidden
                        />
                        No licence file
                      </span>
                    )}
                  </div>

                  <div className="border-border border-t border-dashed pt-3 dark:border-border">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className={mobileListCardActionBtn}
                        asChild
                      >
                        <a href={`tel:${driver.mobileNumber}`}>
                          <Phone className="size-[18px]" />
                          Call
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={mobileListCardActionBtn}
                        onClick={() => openEditDialog(driver)}
                      >
                        <Pencil className="size-[18px]" />
                        Edit
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
                Loading more drivers...
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                End of driver list
              </p>
            )}
          </div>
        </section>
      ) : null}
    </div>
  )
}
