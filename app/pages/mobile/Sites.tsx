import { useEffect, useMemo, useRef, useState } from "react"

import { Mail, MapPin, Pencil, Phone, UserRound } from "lucide-react"
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
import { cn } from "~/lib/utils"

const initialFormState: CreateSiteRequest = {
  name: "",
  contactPerson: "",
  mobileNumber: "",
  email: "",
  location: "",
}

type SiteApprovalFilter = "all" | SiteApprovalStatus

const SITE_APPROVAL_FILTERS: Array<{
  label: string
  value: SiteApprovalFilter
}> = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
]

function siteListNote(site: Site): string | null {
  const n =
    site.rejectedNote?.trim() || site.approvalNote?.trim() || ""
  return n || null
}

function siteIsRejected(site: Site): boolean {
  const st = site.approvalStatus
  if (!st) return false
  if (st === "REJECTED") return true
  return String(st).toLowerCase() === "rejected"
}

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
  const [approvalFilter, setApprovalFilter] =
    useState<SiteApprovalFilter>("all")

  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const serverApprovalFilter =
    approvalFilter === "all" ? undefined : approvalFilter

  useEffect(() => {
    void dispatch(
      fetchSitesThunk({
        approvalStatus: serverApprovalFilter,
      })
    )
  }, [dispatch, serverApprovalFilter])

  const siteFormConfig = useMemo(
    () => getSiteDialogFormConfig(dialogMode === "edit"),
    [dialogMode]
  )

  const filteredSites = useMemo(() => {
    const term = query.trim().toLowerCase()

    return sites.filter((site) => {
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

      return matchesSearch
    })
  }, [query, sites])

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
    })
    setIsSiteDialogOpen(true)
  }

  const handleSubmitSite = async (values: CreateSiteRequest) => {
    const payload: CreateSiteRequest = {
      name: values.name.trim(),
      contactPerson: values.contactPerson.trim(),
      mobileNumber: values.mobileNumber.replace(/\s+/g, "").trim(),
      email: values.email.trim(),
      location: values.location.trim(),
    }

    setIsSubmitting(true)

    try {
      if (dialogMode === "edit") {
        if (!editingSiteId) {
          throw new Error("Site id is required")
        }

        const updatePayload: UpdateSiteRequest = {
          name: payload.name,
          contactPerson: payload.contactPerson,
          mobileNumber: payload.mobileNumber,
          email: payload.email,
          location: payload.location,
        }

        await updateSite(editingSiteId, updatePayload)
        toast.success("Site update submitted for approval", {
          position: "top-center",
        })
      } else {
        await createSite(payload)
        toast.success("Site submitted for approval", { position: "top-center" })
      }

      await dispatch(
        fetchSitesThunk({
          approvalStatus: serverApprovalFilter,
        })
      )

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
        segments={[{ label: "All", value: "all" }]}
        activeSegment="all"
        onSegmentChange={() => {}}
        approvalSegments={SITE_APPROVAL_FILTERS}
        activeApprovalSegment={approvalFilter}
        onApprovalSegmentChange={setApprovalFilter}
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
          {filteredSites.map((site) => {
            const adminNote = siteListNote(site)
            return (
              <OpsCard key={site.id}>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className={mobileListCardIconTile} aria-hidden>
                      <MapPin className="size-4 stroke-2" />
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-base leading-tight font-semibold break-words text-foreground">
                        {site.name}
                      </p>
                      <p className="mt-0.5 text-[0.64rem] break-words text-muted-foreground">
                        {site.location}
                      </p>
                    </div>
                    <div className="shrink-0 pt-0.5">
                      <OpsApprovalPill
                        appearance="badge"
                        status={site.approvalStatus}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <div className={mobileListCardMetaPanel}>
                      <div className="flex gap-1.5">
                        <UserRound
                          className="size-4 shrink-0 stroke-2 text-primary"
                          aria-hidden
                        />
                        <div className="min-w-0">
                          <p className="text-[0.64rem] leading-none font-medium text-muted-foreground">
                            Contact
                          </p>
                          <p className="mt-0.5 text-xs leading-snug font-medium break-words text-foreground">
                            {site.contactPerson}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className={mobileListCardMetaPanel}>
                      <div className="flex gap-1.5">
                        <Phone
                          className="size-4 shrink-0 stroke-2 text-primary"
                          aria-hidden
                        />
                        <div className="min-w-0">
                          <p className="text-[0.64rem] leading-none font-medium text-muted-foreground">
                            Mobile
                          </p>
                          <p className="mt-0.5 text-xs leading-snug font-medium break-words tabular-nums text-foreground">
                            {site.mobileNumber}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={mobileListCardMetaPanel}>
                    <div className="flex gap-1.5">
                      <Mail
                        className="size-4 shrink-0 stroke-2 text-primary"
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <p className="text-[0.64rem] leading-none font-medium text-muted-foreground">
                          Email
                        </p>
                        <p className="mt-0.5 text-xs leading-snug font-medium break-words text-foreground">
                          {site.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {adminNote ? (
                    <p
                      className={cn(
                        "rounded-lg px-2.5 py-1.5 text-[0.64rem] leading-snug",
                        siteIsRejected(site)
                          ? "border border-destructive/30 bg-destructive/5 text-destructive"
                          : "border border-border bg-muted/30 text-muted-foreground"
                      )}
                    >
                      <span className="font-medium text-foreground">Note: </span>
                      {adminNote}
                    </p>
                  ) : null}

                  <div className="border-border border-t border-dashed pt-2 dark:border-border">
                    <div className="grid grid-cols-2 gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className={mobileListCardActionBtn}
                        asChild
                      >
                        <a href={`tel:${site.mobileNumber}`}>
                          <Phone />
                          Call
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={mobileListCardActionBtn}
                        onClick={() => openEditDialog(site)}
                      >
                        <Pencil />
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
                Loading more sites...
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">End of site list</p>
            )}
          </div>
        </section>
      ) : null}

    </div>
  )
}
