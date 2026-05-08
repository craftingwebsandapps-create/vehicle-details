import { useEffect, useMemo, useRef, useState } from "react"

import { ArrowRightLeft, ClipboardList, Map, UserSquare2 } from "lucide-react"
import { toast } from "sonner"

import { useAppDispatch, useAppSelector } from "~/app/hooks"
import { Button } from "~/components/ui/button"
import {
  GenericDialog,
  GenericDialogBody,
  GenericDialogFooter,
} from "~/components/ui/generic-dialog"
import { Input } from "~/components/ui/input"
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

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-border/60 bg-background p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ClipboardList className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Assignments
            </p>
            <h2 className="font-heading text-2xl font-semibold text-foreground">
              Link drivers, vehicles, and routes.
            </h2>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            Create Assignment
          </Button>
        </div>
      </section>

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
          <Input
            value={selectedAssignmentId}
            disabled
            aria-label="Assignment id"
          />

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

      {status === "loading" ? (
        <section className="space-y-3">
          <article className="rounded-[26px] border border-border/60 bg-background p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Loading assignments...
            </p>
          </article>
        </section>
      ) : null}

      {status === "failed" ? (
        <section className="space-y-3">
          <article className="rounded-[26px] border border-destructive/30 bg-destructive/10 p-5 shadow-sm">
            <p className="text-sm text-destructive">
              {error ?? "Unable to load assignments"}
            </p>
          </article>
        </section>
      ) : null}

      {status !== "loading" && status !== "failed" ? (
        <section className="space-y-3">
          {assignments.map((assignment, index) => (
            <article
              key={
                assignment.id ||
                `${assignment.vehicleLabel}-${assignment.driverName}-${index}`
              }
              className="rounded-[26px] border border-border/60 bg-background p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-foreground">
                  {assignment.vehicleLabel}
                </p>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {assignment.status}
                </span>
              </div>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <p className="inline-flex items-center gap-2">
                  <UserSquare2 className="size-4 text-primary" />
                  {assignment.driverName}
                </p>
                <p className="inline-flex items-center gap-2">
                  <Map className="size-4 text-primary" />
                  {assignment.route}
                </p>
                <p className="inline-flex items-center gap-2">
                  <ArrowRightLeft className="size-4 text-primary" />
                  Route assignment synced.
                </p>

                <div className="flex items-center gap-2 pt-1">
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
                    onClick={() => void handleUnassign(assignment.id)}
                    disabled={!assignment.id || isSubmitting}
                  >
                    Unassign
                  </Button>
                </div>
              </div>
            </article>
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
    </div>
  )
}
