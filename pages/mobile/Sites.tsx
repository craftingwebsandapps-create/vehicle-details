import { useEffect, useMemo, useRef, useState } from "react"

import { Layers, Pencil, Phone } from "lucide-react"
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
import { createSite, updateSite } from "~/features/sites/api"
import {
  fetchSitesThunk,
  fetchMoreSitesThunk,
} from "~/features/sites/sitesSlice"
import type {
  CreateSiteRequest,
  SiteApprovalStatus,
  Site,
  UpdateSiteRequest,
} from "~/features/sites/types"
import { getSiteDialogFormConfig } from "~/schemas/site-dialog-form-config"

const initialFormState: CreateSiteRequest = {
  name: "",
  contactPerson: "",
  mobileNumber: "",
  email: "",
  location: "",
  status: "ACTIVE",
}

type SiteSegment = "all" | "active" | "inactive"
type SiteApprovalFilter = "all" | SiteApprovalStatus

const SITE_SEGMENTS: Array<{ label: string; value: SiteSegment }> = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
]

const SITE_APPROVAL_FILTERS: Array<{
  label: string
  value: SiteApprovalFilter
}> = [
  { label: "Approval: All", value: "all" },
  { label: "Approval: Pending", value: "PENDING_APPROVAL" },
  { label: "Approval: Approved", value: "APPROVED" },
  { label: "Approval: Rejected", value: "REJECTED" },
]

export default function Sites() {
  const dispatch = useAppDispatch()
  const {
    items: sites,
    hasNextPage,
    loadMoreStatus,
    status: sitesStatus,
    error: listError,
  } = useAppSelector((state) => state.sites)

  const [isSiteDialogOpen, setIsSiteDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formDefaults, setFormDefaults] =
    useState<CreateSiteRequest>(initialFormState)

  const [query, setQuery] = useState("")
  const [segment, setSegment] = useState<SiteSegment>("all")
  const [approvalFilter, setApprovalFilter] =
    useState<SiteApprovalFilter>("all")
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)

  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const serverStatusFilter =
    segment === "active"
      ? "ACTIVE"
      : segment === "inactive"
        ? "INACTIVE"
        : undefined
  const serverApprovalFilter =
    approvalFilter === "all" ? undefined : approvalFilter

  useEffect(() => {
    void dispatch(
      fetchSitesThunk({
        status: serverStatusFilter,
        approvalStatus: serverApprovalFilter,
      })
    )
  }, [dispatch, serverStatusFilter, serverApprovalFilter])

  const siteFormConfig = useMemo(
    () => getSiteDialogFormConfig(dialogMode === "edit"),
    [dialogMode]
  )

  const filteredSites = useMemo(() => {
    const term = query.trim().toLowerCase()

    return sites.filter((site) => {
      const matchesSegment =
        segment === "all"
          ? true
          : segment === "active"
            ? site.status === "ACTIVE"
            : site.status === "INACTIVE"

      const matchesSearch =
        term.length === 0
          ? true
          : [
              site.name,
              site.location,
              site.contactPerson,
              site.mobileNumber,
              site.email,
            ]
              .join(" ")
              .toLowerCase()
              .includes(term)

      return matchesSegment && matchesSearch
    })
  }, [query, segment, sites])

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
          void dispatch(fetchMoreSitesThunk())
        }
      },
      { rootMargin: "180px" }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [dispatch, hasNextPage, loadMoreStatus])

  const refreshSites = () => {
    void dispatch(
      fetchSitesThunk({
        status: serverStatusFilter,
        approvalStatus: serverApprovalFilter,
      })
    )
    toast.success("Site list refreshed", { position: "top-center" })
  }

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
        toast.success("Site update submitted for approval", {
          position: "top-center",
        })
      } else {
        await createSite(payload)
        toast.success("Site submitted for approval", { position: "top-center" })
      }

      await dispatch(fetchSitesThunk())

      setFormDefaults(initialFormState)
      setIsSiteDialogOpen(false)
      setEditingSiteId(null)
      setDialogMode("create")
    } catch (submitError) {
      if (dialogMode === "edit") {
        toast.error("Unable to update site")
      } else {
        toast.error("Unable to create site")
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
        title="Sites"
        totalLabel={`${filteredSites.length} in view`}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search site, location, contact"
        createLabel="Create"
        onCreate={openCreateDialog}
        onRefresh={refreshSites}
        segments={SITE_SEGMENTS}
        activeSegment={segment}
        onSegmentChange={setSegment}
      />

      <GenericDialog
        open={isSiteDialogOpen}
        onOpenChange={setIsSiteDialogOpen}
        title={dialogMode === "edit" ? "Edit Site" : "Create Site"}
        description={
          dialogMode === "edit"
            ? "Update operational site details."
            : "Add a new operational site."
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

      {sitesStatus === "loading" ? <OpsListSkeleton /> : null}

      {listError ? (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {listError}
        </p>
      ) : null}

      {sitesStatus !== "loading" && !listError && filteredSites.length === 0 ? (
        <OpsEmptyState
          title="No matching sites"
          subtitle="Update search terms or filter to continue."
        />
      ) : null}

      {sitesStatus !== "loading" && !listError ? (
        <section className="space-y-2">
          {filteredSites.map((site) => (
            <OpsCard key={site.id}>
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm leading-tight font-semibold text-foreground">
                      {site.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {site.location}
                    </p>
                  </div>

                  <OpsStatusPill status={site.status} />
                </div>

                <div className="rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  <p>
                    Contact:{" "}
                    <span className="text-foreground">
                      {site.contactPerson}
                    </span>
                  </p>
                  <p className="mt-0.5">
                    Mobile:{" "}
                    <span className="text-foreground">{site.mobileNumber}</span>
                  </p>
                  <p className="mt-0.5 truncate">
                    Email: <span className="text-foreground">{site.email}</span>
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => {
                        window.location.href = `tel:${site.mobileNumber}`
                      }}
                    >
                      <Phone className="size-3.5" />
                      Call
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => openEditDialog(site)}
                    >
                      <Pencil className="size-3.5" />
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            </OpsCard>
          ))}

          <div ref={loadMoreRef} className="py-2 text-center">
            {hasMore ? (
              <p className="text-xs text-muted-foreground">
                Loading more sites...
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">End of site list</p>
            )}
          </div>
        </section>
      ) : null}

      <OpsFloatingFilterButton onClick={() => setIsFilterSheetOpen(true)} />

      <OpsActionSheet
        open={isFilterSheetOpen}
        onOpenChange={setIsFilterSheetOpen}
        title="Site Filters"
        actions={[
          ...SITE_SEGMENTS.map((item) => ({
            key: `segment-${item.value}`,
            label: `${item.label}${segment === item.value ? " • selected" : ""}`,
            icon: Layers,
            onClick: () => setSegment(item.value),
          })),
          ...SITE_APPROVAL_FILTERS.map((item) => ({
            key: `approval-${item.value}`,
            label: `${item.label}${approvalFilter === item.value ? " • selected" : ""}`,
            icon: Layers,
            onClick: () => setApprovalFilter(item.value),
          })),
        ]}
      />
    </div>
  )
}
