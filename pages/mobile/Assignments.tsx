import { useEffect, useMemo, useRef, useState } from "react"

import { ClipboardList, UserSquare2 } from "lucide-react"
import { toast } from "sonner"

import { useAppDispatch, useAppSelector } from "~/app/hooks"
import {
  OpsActionSheet,
  OpsCard,
  OpsEmptyState,
  OpsFloatingFilterButton,
  OpsListHeader,
  OpsListSkeleton,
} from "~/components/mobile/ops/OpsListPrimitives"
import { Button } from "~/components/ui/button"
import {
  GenericDialog,
  GenericDialogBody,
  GenericDialogFooter,
} from "~/components/ui/generic-dialog"
import {
  changeAssignmentDriver,
  createAssignment,
  unassignAssignment,
} from "~/features/assignments/api"
import {
  fetchAssignmentsThunk,
  fetchMoreAssignmentsThunk,
} from "~/features/assignments/assignmentsSlice"
import { fetchDriversThunk } from "~/features/drivers/driversSlice"
import { fetchVehiclesThunk } from "~/features/vehicles/vehiclesSlice"

type AssignmentSegment = "all" | "assigned" | "unassigned"

const ASSIGNMENT_SEGMENTS: Array<{ label: string; value: AssignmentSegment }> =
  [
    { label: "All", value: "all" },
    { label: "Assigned", value: "assigned" },
    { label: "Unassigned", value: "unassigned" },
  ]

export default function Assignments() {
  const dispatch = useAppDispatch()
  const {
    items: assignments,
    hasNextPage,
    loadMoreStatus,
    status,
    error,
  } = useAppSelector((state) => state.assignments)
  const drivers = useAppSelector((state) => state.drivers.items)
  const vehicles = useAppSelector((state) => state.vehicles.items)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isChangeOpen, setIsChangeOpen] = useState(false)
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("")
  const [createDriverId, setCreateDriverId] = useState("")
  const [createVehicleId, setCreateVehicleId] = useState("")
  const [changeDriverId, setChangeDriverId] = useState("")
  const [query, setQuery] = useState("")
  const [segment, setSegment] = useState<AssignmentSegment>("all")
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [unassignTarget, setUnassignTarget] = useState<{
    id: string
    label: string
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const driverOptions = useMemo(
    () =>
      drivers.map((driver) => ({
        id: driver.id,
        label: `${driver.name} (${driver.licenceNumber})`,
      })),
    [drivers]
  )

  const vehicleOptions = useMemo(
    () =>
      vehicles.map((vehicle) => ({
        id: vehicle._id,
        label: `${vehicle.registrationNumber} (${vehicle.name})`,
      })),
    [vehicles]
  )

  const filteredAssignments = useMemo(() => {
    const term = query.trim().toLowerCase()

    return assignments.filter((assignment) => {
      const isActive = assignment.status === "ACTIVE"

      const matchesSegment =
        segment === "all" ? true : segment === "assigned" ? isActive : !isActive

      const matchesSearch =
        term.length === 0
          ? true
          : [
              assignment.vehicle.name,
              assignment.vehicle.registrationNumber,
              assignment.driver.name,
              assignment.driver.mobileNumber,
              assignment.driver.licenceNumber,
              assignment.status,
            ]
              .join(" ")
              .toLowerCase()
              .includes(term)

      return matchesSegment && matchesSearch
    })
  }, [assignments, query, segment])

  useEffect(() => {
    void dispatch(fetchAssignmentsThunk())
    void dispatch(fetchDriversThunk())
    void dispatch(fetchVehiclesThunk())
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
          void dispatch(fetchMoreAssignmentsThunk())
        }
      },
      { rootMargin: "180px" }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [dispatch, hasNextPage, loadMoreStatus])

  const refreshAll = async () => {
    await Promise.all([
      dispatch(fetchAssignmentsThunk()),
      dispatch(fetchDriversThunk()),
      dispatch(fetchVehiclesThunk()),
    ])
  }

  const handleRefresh = () => {
    void refreshAll()
    toast.success("Assignment list refreshed", { position: "top-center" })
  }

  const handleCreateAssignment = async () => {
    setIsSubmitting(true)

    try {
      await createAssignment({
        driver: createDriverId.trim(),
        vehicle: createVehicleId.trim(),
      })
      await refreshAll()

      setIsCreateOpen(false)
      setCreateDriverId("")
      setCreateVehicleId("")
      toast.success("Assignment created", { position: "top-center" })
    } catch (submitError) {
      toast.error(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create assignment"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const openChangeDriverDialog = (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId)
    setChangeDriverId("")
    setIsChangeOpen(true)
  }

  const handleChangeDriver = async () => {
    setIsSubmitting(true)

    try {
      await changeAssignmentDriver(selectedAssignmentId, {
        driver: changeDriverId.trim(),
      })
      await refreshAll()

      setIsChangeOpen(false)
      setSelectedAssignmentId("")
      setChangeDriverId("")
      toast.success("Driver updated for assignment", {
        position: "top-center",
      })
    } catch (submitError) {
      toast.error(
        submitError instanceof Error
          ? submitError.message
          : "Unable to change driver"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUnassign = async (assignmentId: string) => {
    setIsSubmitting(true)

    try {
      await unassignAssignment(assignmentId)
      await refreshAll()
      toast.success("Assignment unassigned", { position: "top-center" })
    } catch (submitError) {
      toast.error(
        submitError instanceof Error
          ? submitError.message
          : "Unable to unassign assignment"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusToneClass = (status: string) => {
    const normalized = status.toUpperCase()

    if (normalized === "ACTIVE") {
      return "bg-emerald-500/10 text-emerald-700"
    }

    if (normalized === "INACTIVE") {
      return "bg-zinc-500/10 text-zinc-700"
    }

    return "bg-primary/10 text-primary"
  }

  return (
    <div className="space-y-3 pb-20">
      <OpsListHeader
        title="Assignments"
        totalLabel={`${filteredAssignments.length} in view`}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search vehicle, driver, mobile"
        createLabel="Create"
        onCreate={() => setIsCreateOpen(true)}
        onRefresh={handleRefresh}
        segments={ASSIGNMENT_SEGMENTS}
        activeSegment={segment}
        onSegmentChange={setSegment}
      />

      <GenericDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Create Assignment"
        description="Select a driver and vehicle to create a new assignment."
        maxWidth="md"
        footer={
          <GenericDialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateAssignment}
              disabled={isSubmitting || !createDriverId || !createVehicleId}
            >
              {isSubmitting ? "Submitting..." : "Create"}
            </Button>
          </GenericDialogFooter>
        }
      >
        <GenericDialogBody className="space-y-3 px-1 py-1">
          <label className="block text-xs text-muted-foreground">
            Driver
            <select
              value={createDriverId}
              onChange={(event) => setCreateDriverId(event.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select driver</option>
              {driverOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs text-muted-foreground">
            Vehicle
            <select
              value={createVehicleId}
              onChange={(event) => setCreateVehicleId(event.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select vehicle</option>
              {vehicleOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </GenericDialogBody>
      </GenericDialog>

      <GenericDialog
        open={isChangeOpen}
        onOpenChange={setIsChangeOpen}
        title="Change Driver"
        description="Select a new driver for this assignment."
        maxWidth="md"
        footer={
          <GenericDialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsChangeOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangeDriver}
              disabled={
                isSubmitting || !changeDriverId || !selectedAssignmentId
              }
            >
              {isSubmitting ? "Submitting..." : "Update Driver"}
            </Button>
          </GenericDialogFooter>
        }
      >
        <GenericDialogBody className="space-y-3 px-1 py-1">
          <p className="rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            Assignment ID: {selectedAssignmentId}
          </p>

          <label className="block text-xs text-muted-foreground">
            New Driver
            <select
              value={changeDriverId}
              onChange={(event) => setChangeDriverId(event.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select driver</option>
              {driverOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </GenericDialogBody>
      </GenericDialog>

      <GenericDialog
        open={Boolean(unassignTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setUnassignTarget(null)
          }
        }}
        title="Unassign"
        description="Remove this current assignment?"
        maxWidth="sm"
        footer={
          <GenericDialogFooter>
            <Button
              variant="outline"
              onClick={() => setUnassignTarget(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!unassignTarget?.id) {
                  return
                }

                void (async () => {
                  await handleUnassign(unassignTarget.id)
                  setUnassignTarget(null)
                })()
              }}
              disabled={isSubmitting || !unassignTarget?.id}
            >
              {isSubmitting ? "Unassigning..." : "Unassign"}
            </Button>
          </GenericDialogFooter>
        }
      >
        <GenericDialogBody className="px-1 py-1">
          <p className="text-sm text-muted-foreground">
            {unassignTarget?.label}
          </p>
        </GenericDialogBody>
      </GenericDialog>

      {status === "loading" ? <OpsListSkeleton /> : null}

      {status === "failed" ? (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error ?? "Unable to load assignments"}
        </p>
      ) : null}

      {status !== "loading" &&
      status !== "failed" &&
      filteredAssignments.length === 0 ? (
        <OpsEmptyState
          title="No matching assignments"
          subtitle="Try a different search or filter."
        />
      ) : null}

      {status !== "loading" && status !== "failed" ? (
        <section className="space-y-2">
          {filteredAssignments.map((assignment, index) => (
            <OpsCard
              key={
                assignment.id ||
                `${assignment.vehicle.registrationNumber ?? assignment.vehicle.name}-${assignment.driver.name}-${index}`
              }
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm leading-tight font-semibold text-foreground">
                      {assignment.vehicle.registrationNumber ??
                        assignment.vehicle.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {assignment.vehicle.name}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${getStatusToneClass(
                      assignment.status
                    )}`}
                  >
                    {assignment.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <p className="inline-flex items-center gap-1.5">
                    <UserSquare2 className="size-3.5 text-primary" />
                    {assignment.driver.name}
                  </p>
                  {assignment.driver.mobileNumber ? (
                    <p>Mobile: {assignment.driver.mobileNumber}</p>
                  ) : null}
                  {assignment.driver.licenceNumber ? (
                    <p>Licence: {assignment.driver.licenceNumber}</p>
                  ) : null}
                  {assignment.vehicle.type ? (
                    <p>Type: {assignment.vehicle.type}</p>
                  ) : null}
                  {assignment.assignedAt ? (
                    <p>
                      Assigned At:{" "}
                      {new Date(assignment.assignedAt).toLocaleString()}
                    </p>
                  ) : null}
                  <p>
                    Unassigned At:{" "}
                    {assignment.unassignedAt
                      ? new Date(assignment.unassignedAt).toLocaleString()
                      : "-"}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-1">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => openChangeDriverDialog(assignment.id)}
                    disabled={!assignment.id || isSubmitting}
                  >
                    Change Driver
                  </Button>
                  <Button
                    size="xs"
                    variant="destructive"
                    onClick={() =>
                      setUnassignTarget({
                        id: assignment.id,
                        label: `${assignment.vehicle.registrationNumber ?? assignment.vehicle.name} • ${assignment.driver.name}`,
                      })
                    }
                    disabled={!assignment.id || isSubmitting}
                  >
                    Unassign
                  </Button>
                </div>
              </div>
            </OpsCard>
          ))}

          <div ref={loadMoreRef} className="py-2 text-center">
            {hasNextPage ? (
              <p className="text-xs text-muted-foreground">
                Loading more assignments...
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                End of assignment list
              </p>
            )}
          </div>
        </section>
      ) : null}

      <OpsFloatingFilterButton onClick={() => setIsFilterSheetOpen(true)} />

      <OpsActionSheet
        open={isFilterSheetOpen}
        onOpenChange={setIsFilterSheetOpen}
        title="Assignment Filters"
        actions={ASSIGNMENT_SEGMENTS.map((item) => ({
          key: item.value,
          label: `${item.label}${segment === item.value ? " • selected" : ""}`,
          icon: ClipboardList,
          onClick: () => setSegment(item.value),
        }))}
      />
    </div>
  )
}
