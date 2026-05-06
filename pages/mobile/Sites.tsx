import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"

import {
  Building2,
  Loader2,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { createSite, updateSite } from "~/features/sites/api"
import { fetchSitesThunk } from "~/features/sites/sitesSlice"
import type {
  CreateSiteRequest,
  Site,
  SiteStatus,
  UpdateSiteRequest,
} from "~/features/sites/types"

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
  const [formError, setFormError] = useState<string | null>(null)
  const [formValues, setFormValues] =
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

  const handleInputChange = (
    key: keyof Omit<CreateSiteRequest, "status">,
    value: string
  ) => {
    setFormValues((previous) => ({ ...previous, [key]: value }))
  }

  const handleStatusChange = (value: SiteStatus) => {
    setFormValues((previous) => ({ ...previous, status: value }))
  }

  const openCreateDialog = () => {
    setDialogMode("create")
    setEditingSiteId(null)
    setFormValues(initialFormState)
    setFormError(null)
    setIsSiteDialogOpen(true)
  }

  const openEditDialog = (site: Site) => {
    setDialogMode("edit")
    setEditingSiteId(site.id)
    setFormValues({
      name: site.name,
      contactPerson: site.contactPerson,
      mobileNumber: site.mobileNumber,
      email: site.email,
      location: site.location,
      status: site.status,
    })
    setFormError(null)
    setIsSiteDialogOpen(true)
  }

  const handleSubmitSite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const payload: CreateSiteRequest = {
      name: formValues.name.trim(),
      contactPerson: formValues.contactPerson.trim(),
      mobileNumber: formValues.mobileNumber.trim(),
      email: formValues.email.trim(),
      location: formValues.location.trim(),
      status: formValues.status,
    }

    if (
      !payload.name ||
      !payload.contactPerson ||
      !payload.mobileNumber ||
      !payload.email ||
      !payload.location
    ) {
      setFormError("All fields are required")
      return
    }

    setIsSubmitting(true)
    setFormError(null)

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

      setFormValues(initialFormState)
      setIsSiteDialogOpen(false)
      setEditingSiteId(null)
      setDialogMode("create")
    } catch (error) {
      if (dialogMode === "edit") {
        toast.error("Unable to update site")
      }

      setFormError(
        error instanceof Error
          ? error.message
          : dialogMode === "edit"
            ? "Unable to update site"
            : "Unable to create site"
      )
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

        <Dialog open={isSiteDialogOpen} onOpenChange={setIsSiteDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreateDialog}>
              <Plus className="size-4" />
              Create Site
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {dialogMode === "edit" ? "Edit Site" : "Create Site"}
              </DialogTitle>
              <DialogDescription>
                {dialogMode === "edit"
                  ? "Update site details."
                  : "Add a new site to the operational hubs list."}
              </DialogDescription>
            </DialogHeader>

            <form
              id="create-site-form"
              className="space-y-3"
              onSubmit={handleSubmitSite}
            >
              <Input
                disabled={isSubmitting || dialogMode === "edit"}
                value={formValues.name}
                placeholder="Site name"
                onChange={(event) =>
                  handleInputChange("name", event.target.value)
                }
              />
              <Input
                value={formValues.contactPerson}
                placeholder="Contact person"
                onChange={(event) =>
                  handleInputChange("contactPerson", event.target.value)
                }
              />
              <Input
                value={formValues.mobileNumber}
                placeholder="Mobile number"
                onChange={(event) =>
                  handleInputChange("mobileNumber", event.target.value)
                }
              />
              <Input
                type="email"
                value={formValues.email}
                placeholder="Email"
                onChange={(event) =>
                  handleInputChange("email", event.target.value)
                }
              />
              <Input
                value={formValues.location}
                placeholder="Location"
                onChange={(event) =>
                  handleInputChange("location", event.target.value)
                }
              />
              <Select
                value={formValues.status ?? "ACTIVE"}
                onValueChange={(value) =>
                  handleStatusChange(value as SiteStatus)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                </SelectContent>
              </Select>

              {formError ? (
                <p className="text-xs text-destructive">{formError}</p>
              ) : null}
            </form>

            <DialogFooter>
              <Button
                type="submit"
                form="create-site-form"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {dialogMode === "edit" ? "Updating..." : "Creating..."}
                  </>
                ) : dialogMode === "edit" ? (
                  "Update"
                ) : (
                  "Create"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>

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
