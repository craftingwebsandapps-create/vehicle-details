import { useEffect, useMemo, useState } from "react"

import {
  Building2,
  MapPinned,
  Pencil,
  Plus,
  RadioTower,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"

import { useAppDispatch, useAppSelector } from "~/app/hooks"
import { Button } from "~/components/ui/button"
import {
  GenericDialog,
  GenericDialogFooter,
} from "~/components/ui/generic-dialog"
import { FormBuilder } from "~/components/form"
import { createSite, updateSite } from "~/features/sites/api"
import { fetchSitesThunk } from "~/features/sites/sitesSlice"
import type {
  CreateSiteRequest,
  Site,
  UpdateSiteRequest,
} from "~/features/sites/types"
import { getSiteDialogFormConfig } from "~/schemas/site-dialog-form-config"

const baseMetrics = [
  { label: "Monitored zones", value: "28", icon: RadioTower },
  { label: "Compliant hubs", value: "98%", icon: ShieldCheck },
]

const initialFormState: CreateSiteRequest = {
  name: "",
  contactPerson: "",
  mobileNumber: "",
  email: "",
  location: "",
  status: "ACTIVE",
}

export default function Sites() {
  const dispatch = useAppDispatch()
  const {
    items: sites,
    status: sitesStatus,
    error: listError,
  } = useAppSelector((state) => state.sites)

  const [isSiteDialogOpen, setIsSiteDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formDefaults, setFormDefaults] =
    useState<CreateSiteRequest>(initialFormState)

  useEffect(() => {
    void dispatch(fetchSitesThunk())
  }, [dispatch])

  const metrics = useMemo(
    () => [
      {
        label: "Active sites",
        value: String(sites.length),
        icon: Building2,
      },
      ...baseMetrics,
    ],
    [sites.length]
  )

  const siteFormConfig = useMemo(
    () => getSiteDialogFormConfig(dialogMode === "edit"),
    [dialogMode]
  )

  const openCreateDialog = () => {
    setDialogMode("create")
    setEditingSiteId(null)
    setFormDefaults(initialFormState)
    setIsSiteDialogOpen(true)
  }

  const openEditDialog = (site: Site) => {
    setDialogMode("edit")
    setEditingSiteId(site.id)
    setFormDefaults({
      name: site.name,
      contactPerson: site.contactPerson,
      mobileNumber: site.mobileNumber,
      email: site.email,
      location: site.location,
      status: site.status,
    })
    setIsSiteDialogOpen(true)
  }

  const handleSubmitSite = async (values: CreateSiteRequest) => {
    const payload: CreateSiteRequest = {
      name: values.name.trim(),
      contactPerson: values.contactPerson.trim(),
      mobileNumber: values.mobileNumber.trim(),
      email: values.email.trim(),
      location: values.location.trim(),
      status: values.status,
    }

    setIsSubmitting(true)

    try {
      if (dialogMode === "edit") {
        if (!editingSiteId) {
          throw new Error("Site id is required")
        }

        const updatePayload: UpdateSiteRequest = {
          contactPerson: payload.contactPerson,
          mobileNumber: payload.mobileNumber,
          email: payload.email,
          location: payload.location,
          status: payload.status,
        }

        await updateSite(editingSiteId, updatePayload)
        toast.success("Site updated successfully", { position: "top-center" })
      } else {
        await createSite(payload)
      }

      await dispatch(fetchSitesThunk())

      setFormDefaults(initialFormState)
      setIsSiteDialogOpen(false)
      setEditingSiteId(null)
      setDialogMode("create")
    } catch (error) {
      if (dialogMode === "edit") {
        toast.error("Unable to update site")
      } else {
        toast.error("Unable to create site")
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
          <p className="text-sm font-medium text-muted-foreground">Sites</p>
          <h2 className="mt-1 font-heading text-2xl font-semibold text-foreground">
            Monitor operational hubs and dispatch points.
          </h2>
        </div>

        <Button size="sm" onClick={openCreateDialog}>
          <Plus className="size-4" />
          Create Site
        </Button>
      </section>

      <GenericDialog
        open={isSiteDialogOpen}
        onOpenChange={setIsSiteDialogOpen}
        title={dialogMode === "edit" ? "Edit Site" : "Create Site"}
        description={
          dialogMode === "edit"
            ? "Update site details."
            : "Add a new site to the operational hubs list."
        }
        maxWidth="lg"
        footer={
          <GenericDialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSiteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="site-dialog-form"
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
          key={`${dialogMode}-${editingSiteId ?? "new"}-${isSiteDialogOpen ? "open" : "closed"}`}
          config={siteFormConfig}
          defaultValues={formDefaults}
          onSubmit={handleSubmitSite}
          isSubmitting={isSubmitting}
          className="space-y-4 px-1"
          hideButtons
        />
      </GenericDialog>

      <section className="grid grid-cols-3 gap-3">
        {metrics.map((metric) => {
          const Icon = metric.icon

          return (
            <article
              key={metric.label}
              className="rounded-[24px] border border-border/60 bg-background p-4 shadow-sm"
            >
              <Icon className="size-5 text-primary" />
              <p className="mt-4 text-xl font-semibold text-foreground">
                {metric.value}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {metric.label}
              </p>
            </article>
          )
        })}
      </section>

      <section className="space-y-3">
        {sitesStatus === "loading" ? (
          <p className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Loading sites...
          </p>
        ) : null}

        {listError ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {listError}
          </p>
        ) : null}

        {sitesStatus !== "loading" && !listError && sites.length === 0 ? (
          <p className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            No sites found.
          </p>
        ) : null}

        {sitesStatus !== "loading" && !listError
          ? sites.map((site) => (
              <article
                key={site.id}
                className="rounded-[26px] border border-border/60 bg-background p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{site.name}</p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPinned className="size-4" />
                      {site.location}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {site.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <p>
                    Contact:{" "}
                    <span className="text-foreground">
                      {site.contactPerson}
                    </span>
                  </p>
                  <p>
                    Mobile:{" "}
                    <span className="text-foreground">{site.mobileNumber}</span>
                  </p>
                  <p className="sm:col-span-2">
                    Email: <span className="text-foreground">{site.email}</span>
                  </p>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(site)}
                  >
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                </div>
              </article>
            ))
          : null}
      </section>
    </div>
  )
}
