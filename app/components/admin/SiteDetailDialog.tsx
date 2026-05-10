import { format } from "date-fns"
import type { ReactNode } from "react"

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
import type { PlatformSiteRecord } from "~/types/platform-site"

type SiteDetailDialogProps = {
  site: PlatformSiteRecord | null
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

export function SiteDetailDialog({
  site,
  open,
  onOpenChange,
}: SiteDetailDialogProps) {
  if (!site) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-border border-b p-6 pb-4">
          <DialogTitle className="pr-8 font-heading text-lg leading-snug">
            {dash(site.name)}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2 pt-1">
            <span>{dash(site.location)}</span>
            <OpsApprovalPill status={site.approvalStatus} />
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <section className="space-y-1">
            <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
              Site
            </h3>
            <DetailRows
              rows={[
                {
                  label: "ID",
                  value: <code className="text-xs">{site._id}</code>,
                },
                {
                  label: "Contact person",
                  value: dash(site.contactPerson),
                },
                { label: "Mobile", value: dash(site.mobileNumber) },
                { label: "Email", value: dash(site.email) },
                {
                  label: "Created",
                  value: formatWhen(site.createdAt),
                },
                {
                  label: "Updated",
                  value: formatWhen(site.updatedAt),
                },
                ...(site.deletedAt
                  ? [
                      {
                        label: "Deleted",
                        value: formatWhen(site.deletedAt),
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
                { label: "Note", value: dash(site.approvalNote) },
                { label: "Approved at", value: formatWhen(site.approvedAt) },
                { label: "Rejected at", value: formatWhen(site.rejectedAt) },
                { label: "Approved by", value: dash(site.approvedBy) },
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
                site.contractor
                  ? [
                      { label: "Name", value: dash(site.contractor.name) },
                      {
                        label: "Contact person",
                        value: dash(site.contractor.contactPerson),
                      },
                      {
                        label: "Mobile",
                        value: dash(site.contractor.mobileNumber),
                      },
                      {
                        label: "Email",
                        value: dash(site.contractor.email),
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
        </div>

        <div className={dialogActionsFooterClass}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto shrink-0 px-2 py-1 text-muted-foreground hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
