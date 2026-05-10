import { format } from "date-fns"
import { ExternalLink } from "lucide-react"
import type { ReactNode } from "react"

import { OpsApprovalPill } from "~/components/mobile/ops/OpsListPrimitives"
import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Separator } from "~/components/ui/separator"
import { API_BASE_URL } from "~/utils/constants"
import type {
  AssignedVehicleSite,
  AssignedVehicleSummary,
  PlatformDriverRecord,
} from "~/types/platform-driver"

type DriverDetailDialogProps = {
  driver: PlatformDriverRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function dash(value: string | undefined | null) {
  const v = value?.trim()
  return v && v.length > 0 ? v : "—"
}

function formatWhen(iso: string | undefined | null) {
  if (!iso) return "—"
  try {
    return format(new Date(iso), "PPpp")
  } catch {
    return iso
  }
}

function resolveAssetHref(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path
  if (path.startsWith("/")) {
    const origin = API_BASE_URL.replace(/\/api\/?$/, "")
    return `${origin}${path}`
  }
  return path
}

function DetailRows({
  rows,
}: {
  rows: Array<{ label: string; value: ReactNode }>
}) {
  return (
    <dl className="space-y-0">
      {rows.map(({ label, value }) => (
        <div
          key={label}
          className="grid grid-cols-1 gap-1 py-2 sm:grid-cols-[minmax(0,140px)_1fr] sm:gap-4 sm:py-1.5"
        >
          <dt className="text-muted-foreground text-xs font-medium sm:text-sm">
            {label}
          </dt>
          <dd className="text-sm break-words">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function siteDetailRows(site: AssignedVehicleSite | null | undefined) {
  if (!site) {
    return [{ label: "Site", value: "—" }]
  }
  const nested = site.contractor
  return [
    { label: "Name", value: dash(site.name) },
    { label: "Location", value: dash(site.location) },
    { label: "Contact", value: dash(site.contactPerson) },
    { label: "Mobile", value: dash(site.mobileNumber) },
    { label: "Email", value: dash(site.email) },
    {
      label: "Approval",
      value: <OpsApprovalPill status={site.approvalStatus} />,
    },
    { label: "Approval note", value: dash(site.approvalNote) },
    { label: "Approved at", value: formatWhen(site.approvedAt) },
    { label: "Rejected at", value: formatWhen(site.rejectedAt) },
    ...(nested
      ? [{ label: "Site contractor", value: dash(nested.name) }]
      : []),
  ]
}

function assignedVehicleSection(av: AssignedVehicleSummary | null | undefined) {
  if (!av) {
    return (
      <p className="text-muted-foreground text-sm">No active assignment.</p>
    )
  }
  const docUrl = av.document?.trim()
  const docLink =
    docUrl &&
    (docUrl.startsWith("http://") ||
      docUrl.startsWith("https://") ||
      docUrl.startsWith("/")) ? (
      <a
        href={resolveAssetHref(docUrl)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary inline-flex items-center gap-1 underline-offset-4 hover:underline"
      >
        Open document
        <ExternalLink className="size-3.5" />
      </a>
    ) : (
      dash(docUrl ?? null)
    )

  return (
    <div className="space-y-4">
      <DetailRows
        rows={[
          { label: "Vehicle", value: dash(av.name) },
          { label: "Type", value: dash(av.type) },
          {
            label: "Registration",
            value: dash(av.registrationNumber),
          },
          { label: "Document", value: docLink },
          {
            label: "Approval",
            value: <OpsApprovalPill status={av.approvalStatus} />,
          },
          { label: "Approval note", value: dash(av.approvalNote) },
          { label: "Approved at", value: formatWhen(av.approvedAt) },
          { label: "Rejected at", value: formatWhen(av.rejectedAt) },
        ]}
      />
      <div>
        <h4 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
          Assignment site
        </h4>
        <DetailRows rows={siteDetailRows(av.site ?? null)} />
      </div>
    </div>
  )
}

export function DriverDetailDialog({
  driver,
  open,
  onOpenChange,
}: DriverDetailDialogProps) {
  if (!driver) return null

  const licenceUrl = driver.licenceUrl?.trim()
  const licenceLink =
    licenceUrl &&
    (licenceUrl.startsWith("http://") ||
      licenceUrl.startsWith("https://") ||
      licenceUrl.startsWith("/")) ? (
      <a
        href={resolveAssetHref(licenceUrl)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary inline-flex items-center gap-1 underline-offset-4 hover:underline"
      >
        Open licence
        <ExternalLink className="size-3.5" />
      </a>
    ) : (
      dash(licenceUrl ?? null)
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,760px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-border border-b p-6 pb-4">
          <DialogTitle className="pr-8 font-heading text-lg leading-snug">
            {dash(driver.name)}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2 pt-1">
            <span className="tabular-nums">{dash(driver.licenceNumber)}</span>
            <span className="text-muted-foreground">·</span>
            <span>{dash(driver.mobileNumber)}</span>
            <OpsApprovalPill status={driver.approvalStatus} />
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <section className="space-y-1">
            <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
              Driver
            </h3>
            <DetailRows
              rows={[
                {
                  label: "ID",
                  value: <code className="text-xs">{driver._id}</code>,
                },
                { label: "Licence", value: licenceLink },
                {
                  label: "Created",
                  value: formatWhen(driver.createdAt),
                },
                {
                  label: "Updated",
                  value: formatWhen(driver.updatedAt),
                },
                ...(driver.deletedAt
                  ? [
                      {
                        label: "Deleted",
                        value: formatWhen(driver.deletedAt),
                      },
                    ]
                  : []),
              ]}
            />
          </section>

          <Separator className="my-5" />

          <section className="space-y-1">
            <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
              Approval
            </h3>
            <DetailRows
              rows={[
                { label: "Note", value: dash(driver.approvalNote) },
                { label: "Approved at", value: formatWhen(driver.approvedAt) },
                { label: "Rejected at", value: formatWhen(driver.rejectedAt) },
                { label: "Approved by", value: dash(driver.approvedBy) },
              ]}
            />
          </section>

          <Separator className="my-5" />

          <section className="space-y-1">
            <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
              Contractor
            </h3>
            <DetailRows
              rows={
                driver.contractor
                  ? [
                      { label: "Name", value: dash(driver.contractor.name) },
                      {
                        label: "Contact person",
                        value: dash(driver.contractor.contactPerson),
                      },
                      {
                        label: "Mobile",
                        value: dash(driver.contractor.mobileNumber),
                      },
                      {
                        label: "Email",
                        value: dash(driver.contractor.email),
                      },
                    ]
                  : [
                      {
                        label: "Assigned",
                        value: (
                          <span className="text-muted-foreground">None</span>
                        ),
                      },
                    ]
              }
            />
          </section>

          <Separator className="my-5" />

          <section className="space-y-2">
            <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Assigned vehicle
            </h3>
            {assignedVehicleSection(driver.assignedVehicle ?? null)}
          </section>
        </div>

        <DialogFooter className="mx-0 mb-0 gap-0 border-border bg-muted/30 border-t px-4 py-2.5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto shrink-0 px-2 py-1 text-muted-foreground hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
