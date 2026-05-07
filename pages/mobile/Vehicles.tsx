import { useEffect, useMemo, useState } from "react"

import { ExternalLink, Pencil, Plus, TrendingUp, Truck } from "lucide-react"
import { toast } from "sonner"

import { useAppDispatch, useAppSelector } from "~/app/hooks"
import { FormBuilder } from "~/components/form"
import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog"
import { Skeleton } from "~/components/ui/skeleton"
import {
  createVehicle,
  updateVehicle,
  uploadVehicleDocument,
} from "~/features/vehicles/api"
import { fetchVehiclesThunk } from "~/features/vehicles/vehiclesSlice"
import { fetchSitesThunk } from "~/features/sites/sitesSlice"
import { getVehicleDialogFormConfig } from "~/schemas/vehicle-dialog-form-config"
import type {
  CreateVehicleRequest,
  Vehicle,
  VehicleFormValues,
  UpdateVehicleRequest,
} from "~/types/vehicle"

const initialFormState: VehicleFormValues = {
  name: "",
  type: "",
  registrationNumber: "",
  document: null,
  status: "ACTIVE",
  site: "",
}

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

  const vehicleFormConfig = useMemo(
    () => getVehicleDialogFormConfig(dialogMode === "edit", sites),
    [dialogMode, sites]
  )

  useEffect(() => {
    void dispatch(fetchVehiclesThunk())
    void dispatch(fetchSitesThunk())
  }, [dispatch])

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
    } catch (error) {
      if (dialogMode === "edit") {
        toast.error("Unable to update vehicle")
      } else {
        toast.error("Unable to create vehicle")
      }

      if (error instanceof Error) {
        toast.error(error.message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Vehicles</p>
          <h2 className="mt-1 font-heading text-2xl font-semibold text-foreground">
            Manage your vehicle fleet
          </h2>
        </div>

        <Dialog
          open={isVehicleDialogOpen}
          onOpenChange={setIsVehicleDialogOpen}
        >
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreateDialog}>
              <Plus className="size-4" />
              Create Vehicle
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {dialogMode === "edit" ? "Edit Vehicle" : "Create Vehicle"}
              </DialogTitle>
              <DialogDescription>
                {dialogMode === "edit"
                  ? "Update vehicle details and optionally replace document."
                  : "Add a new vehicle and upload registration document."}
              </DialogDescription>
            </DialogHeader>

            <FormBuilder
              key={`${dialogMode}-${editingVehicleId ?? "new"}-${isVehicleDialogOpen ? "open" : "closed"}`}
              config={vehicleFormConfig}
              defaultValues={formDefaults}
              onSubmit={handleSubmitVehicle}
              isSubmitting={isSubmitting}
              className="space-y-4"
            />
          </DialogContent>
        </Dialog>
      </section>

      {status === "loading" ? (
        <section className="space-y-3" aria-label="Loading vehicles">
          {Array.from({ length: 3 }).map((_, index) => (
            <article
              key={`vehicle-skeleton-${index}`}
              className="rounded-[26px] border border-border/60 bg-background p-5 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="size-12 rounded-2xl" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-40" />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Skeleton className="h-10 rounded-xl" />
                <Skeleton className="h-10 rounded-xl" />
                <Skeleton className="h-10 rounded-xl" />
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {status === "failed" ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {status !== "loading" && status !== "failed" && vehicles.length === 0 ? (
        <p className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          No vehicles found.
        </p>
      ) : null}

      {status !== "loading" && status !== "failed" ? (
        <section className="space-y-3">
          {vehicles.map((vehicle) => (
            <article
              key={vehicle._id}
              className="rounded-[26px] border border-border/60 bg-background p-5 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Truck className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">
                        {vehicle.name}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {vehicle.registrationNumber}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {vehicle.status}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <TrendingUp className="size-4 text-primary" />
                      {vehicle.type}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                    <p>
                      Site:{" "}
                      <span className="text-foreground">
                        {typeof vehicle.site === "string"
                          ? vehicle.site
                          : (vehicle.site?.name ?? "-")}
                      </span>
                    </p>
                    <p>
                      Driver:{" "}
                      <span className="text-foreground">
                        {vehicle.driver?.name ?? "-"}
                      </span>
                    </p>
                  </div>
                  {vehicle.document ? (
                    <div className="mt-4">
                      <a
                        href={vehicle.document}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline"
                      >
                        <ExternalLink className="size-3.5" />
                        View vehicle document
                      </a>
                    </div>
                  ) : null}

                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(vehicle)}
                    >
                      <Pencil className="size-4" />
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  )
}
