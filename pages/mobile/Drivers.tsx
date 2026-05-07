import { useEffect, useMemo, useState } from "react"

import {
  BadgeCheck,
  Clock3,
  ExternalLink,
  Pencil,
  Plus,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"

import { useAppDispatch, useAppSelector } from "~/app/hooks"
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

  const driverFormConfig = useMemo(
    () => getDriverDialogFormConfig(dialogMode === "edit"),
    [dialogMode]
  )

  useEffect(() => {
    void dispatch(fetchDriversThunk())
  }, [dispatch])

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
    } catch (error) {
      if (dialogMode === "edit") {
        toast.error("Unable to update driver")
      } else {
        toast.error("Unable to create driver")
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
          <p className="text-sm font-medium text-muted-foreground">Drivers</p>
          <h2 className="mt-1 font-heading text-2xl font-semibold text-foreground">
            Keep driver availability and compliance visible.
          </h2>
        </div>

        <Button size="sm" onClick={openCreateDialog}>
          <Plus className="size-4" />
          Create Driver
        </Button>
      </section>

      <GenericDialog
        open={isDriverDialogOpen}
        onOpenChange={setIsDriverDialogOpen}
        title={dialogMode === "edit" ? "Edit Driver" : "Create Driver"}
        description={
          dialogMode === "edit"
            ? "Update driver details and optionally replace licence file."
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

      {status === "loading" ? (
        <p className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Loading drivers...
        </p>
      ) : null}

      {status === "failed" ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {status !== "loading" && status !== "failed" && drivers.length === 0 ? (
        <p className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          No drivers found.
        </p>
      ) : null}

      {status !== "loading" && status !== "failed" ? (
        <section className="space-y-3">
          {drivers.map((driver) => (
            <article
              key={driver.id}
              className="rounded-[26px] border border-border/60 bg-background p-5 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <UserRound className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">
                        {driver.name}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {driver.licenceNumber}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {driver.status}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Clock3 className="size-4 text-primary" />
                      {driver.mobileNumber}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <BadgeCheck className="size-4 text-primary" />
                      Verified
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                    <p>
                      Site:{" "}
                      <span className="text-foreground">
                        {driver.site?.name ?? "-"}
                      </span>
                    </p>
                    <p>
                      Vehicle:{" "}
                      <span className="text-foreground">
                        {driver.vehicle?.registrationNumber ??
                          driver.vehicle?.name ??
                          "-"}
                      </span>
                    </p>
                    <p className="sm:col-span-2">
                      Contractor:{" "}
                      <span className="text-foreground">
                        {driver.contractor?.name ?? "-"}
                      </span>
                    </p>
                  </div>

                  <div className="mt-4 flex justify-between gap-4">
                    {driver.licenceUrl ? (
                      <div className="mt-4">
                        <a
                          href={driver.licenceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline"
                        >
                          <ExternalLink className="size-3.5" />
                          View licence document
                        </a>
                      </div>
                    ) : (
                      <div />
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(driver)}
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
