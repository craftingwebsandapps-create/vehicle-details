import { format } from "date-fns"
import { ExternalLink, QrCode } from "lucide-react"
import { useState, type ReactNode } from "react"
import { toast } from "sonner"

import { OpsApprovalPill } from "~/components/mobile/ops/OpsListPrimitives"
import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  dialogActionsFooterClass,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Separator } from "~/components/ui/separator"
import { cn } from "~/lib/utils"
import { downloadVehicleQrPng } from "~/features/vehicles/api"
import { getApiErrorMeta } from "~/services/api-error"
import { API_BASE_URL } from "~/utils/constants"
import type { EmbeddedSite, Vehicle } from "~/types/vehicle"

type VehicleDetailDialogProps = {
  vehicle: Vehicle | null
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

function siteRows(site: EmbeddedSite | string | null | undefined) {
  if (!site || typeof site === "string") {
    return [{ label: "Site", value: dash(typeof site === "string" ? site : null) }]
  }
  const nested = site.contractor
  return [
    { label: "Name", value: dash(site.name) },
    { label: "Location", value: dash(site.location) },
    { label: "Contact", value: dash(site.contactPerson) },
    { label: "Mobile", value: dash(site.mobileNumber) },
    { label: "Email", value: dash(site.email) },
    { label: "Approval", value: <OpsApprovalPill status={site.approvalStatus} /> },
    { label: "Approval note", value: dash(site.approvalNote) },
    { label: "Approved at", value: formatWhen(site.approvedAt) },
    { label: "Rejected at", value: formatWhen(site.rejectedAt) },
    ...(nested
      ? [
          {
            label: "Site contractor",
            value: dash(nested.name),
          },
        ]
      : []),
  ]
}

export function VehicleDetailDialog({
  vehicle,
  open,
  onOpenChange,
}: VehicleDetailDialogProps) {
  const [qrDownloading, setQrDownloading] = useState(false)

  if (!vehicle) return null

  const docUrl = vehicle.document?.trim()
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

  const handleDownloadQr = () => {
    void (async () => {
      setQrDownloading(true)
      try {
        await downloadVehicleQrPng(vehicle._id)
        toast.success("Vehicle QR downloaded")
      } catch (e) {
        toast.error(getApiErrorMeta(e).message)
      } finally {
        setQrDownloading(false)
      }
    })()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,760px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-border border-b p-6 pb-4">
          <DialogTitle className="pr-8 font-heading text-lg leading-snug">
            {dash(vehicle.name)}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2 pt-1">
            <span className="tabular-nums">{dash(vehicle.registrationNumber)}</span>
            <span className="text-muted-foreground">·</span>
            <span>{dash(vehicle.type)}</span>
            <OpsApprovalPill status={vehicle.approvalStatus} />
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <section className="space-y-1">
            <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
              Vehicle
            </h3>
            <DetailRows
              rows={[
                { label: "ID", value: <code className="text-xs">{vehicle._id}</code> },
                {
                  label: "Document",
                  value: docLink,
                },
                {
                  label: "Created",
                  value: formatWhen(vehicle.createdAt),
                },
                {
                  label: "Updated",
                  value: formatWhen(vehicle.updatedAt),
                },
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
                { label: "Note", value: dash(vehicle.approvalNote) },
                { label: "Approved at", value: formatWhen(vehicle.approvedAt) },
                { label: "Rejected at", value: formatWhen(vehicle.rejectedAt) },
                { label: "Approved by", value: dash(vehicle.approvedBy) },
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
                vehicle.contractor
                  ? [
                      { label: "Name", value: dash(vehicle.contractor.name) },
                      {
                        label: "Contact person",
                        value: dash(vehicle.contractor.contactPerson),
                      },
                      {
                        label: "Mobile",
                        value: dash(vehicle.contractor.mobileNumber),
                      },
                      { label: "Email", value: dash(vehicle.contractor.email) },
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

          <section className="space-y-1">
            <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
              Site
            </h3>
            <DetailRows rows={siteRows(vehicle.site)} />
          </section>

          <Separator className="my-5" />

          <section className="space-y-1">
            <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
              Driver
            </h3>
            <DetailRows
              rows={
                vehicle.driver
                  ? [
                      { label: "Name", value: dash(vehicle.driver.name) },
                      {
                        label: "Licence",
                        value: dash(vehicle.driver.licenceNumber),
                      },
                      {
                        label: "Licence doc",
                        value: vehicle.driver.licenceUrl ? (
                          <a
                            href={resolveAssetHref(vehicle.driver.licenceUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary inline-flex items-center gap-1 underline-offset-4 hover:underline"
                          >
                            Open
                            <ExternalLink className="size-3.5" />
                          </a>
                        ) : (
                          "—"
                        ),
                      },
                      {
                        label: "Mobile",
                        value: dash(vehicle.driver.mobileNumber),
                      },
                      {
                        label: "Approval",
                        value: (
                          <OpsApprovalPill status={vehicle.driver.approvalStatus} />
                        ),
                      },
                      {
                        label: "Approval note",
                        value: dash(vehicle.driver.approvalNote),
                      },
                      {
                        label: "Approved at",
                        value: formatWhen(vehicle.driver.approvedAt),
                      },
                      {
                        label: "Rejected at",
                        value: formatWhen(vehicle.driver.rejectedAt),
                      },
                    ]
                  : [
                      {
                        label: "Assignment",
                        value: (
                          <span className="text-muted-foreground">Unassigned</span>
                        ),
                      },
                    ]
              }
            />
          </section>
        </div>

        <div className={cn(dialogActionsFooterClass, "justify-between")}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto shrink-0 px-2 py-1 text-muted-foreground hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={qrDownloading}
            onClick={handleDownloadQr}
          >
            <QrCode className="size-4" />
            {qrDownloading ? "Downloading…" : "Download QR"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
