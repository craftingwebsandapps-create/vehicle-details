import { useState, type ComponentType, type ReactNode } from "react"

import { format } from "date-fns"
import {
  Activity,
  Building2,
  Calendar,
  Check,
  ExternalLink,
  FileText,
  MapPin,
  ShieldCheck,
  Truck,
  UserCircle,
} from "lucide-react"

import { Badge } from "~/components/ui/badge"
import { resolveUploadedFilePublicUrl } from "~/features/files/api"
import type { PublicVehicleLookupData } from "~/types/public-vehicle"

const IMAGE_PATH_EXT = /\.(jpe?g|png|gif|webp|svg)(\?.*)?$/i

function pathnameFromHref(href: string): string {
  try {
    return new URL(href).pathname
  } catch {
    return href
  }
}

function formatStamp(iso: string | null | undefined): { date: string; time: string } | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return {
    date: format(d, "d MMM yyyy"),
    time: format(d, "hh:mm a"),
  }
}

function dash(v: string | null | undefined): string {
  const s = v?.trim()
  return s ? s : "—"
}

function isApprovedStatus(status: string | undefined): boolean {
  return (status ?? "").toLowerCase().includes("approv")
}

function StatusApprovedBadge({ label }: { label: string }) {
  const text = (label || "Approved").trim().toUpperCase()
  return (
    <span className="bg-primary text-primary-foreground inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide shadow-sm">
      <Check className="size-3.5 stroke-[3]" aria-hidden />
      {text}
    </span>
  )
}

function SummaryCell({
  icon: Icon,
  label,
  date,
  time,
  extra,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  date?: string | null
  time?: string | null
  extra?: ReactNode
}) {
  const empty = !date && !time && !extra
  return (
      <div className="flex gap-3 lg:border-l lg:border-border lg:pl-6 first:lg:border-l-0 first:lg:pl-0">
      <div className="bg-muted text-primary flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-border/80">
        <Icon className="size-5" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {label}
        </p>
        {empty ? (
          <p className="mt-1 text-sm font-semibold text-foreground">—</p>
        ) : (
          <>
            {date ? (
              <p className="mt-1 text-sm font-semibold text-foreground">{date}</p>
            ) : null}
            {time ? (
              <p className="text-muted-foreground text-xs">{time}</p>
            ) : null}
            {extra ? <div className="mt-1">{extra}</div> : null}
          </>
        )}
      </div>
    </div>
  )
}

function DocumentThumbLink({
  pathOrUrl,
  alt,
}: {
  pathOrUrl: string
  alt: string
}) {
  const [failed, setFailed] = useState(false)
  const trimmed = pathOrUrl.trim()
  if (!trimmed) return null

  const href = resolveUploadedFilePublicUrl(trimmed)
  const isImg = IMAGE_PATH_EXT.test(pathnameFromHref(href))

  return (
    <div className="flex shrink-0 flex-col items-end gap-2">
      {isImg && !failed ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden rounded-lg border border-border bg-muted/40 shadow-sm"
        >
          <img
            src={href}
            alt={alt}
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
            className="h-24 w-40 rounded-md object-cover object-center sm:h-28 sm:w-44"
          />
        </a>
      ) : (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary inline-flex items-center gap-1 text-xs font-medium underline-offset-4 hover:underline"
        >
          View file
          <ExternalLink className="size-3" aria-hidden />
        </a>
      )}
    </div>
  )
}

function DetailGridRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1 sm:grid sm:grid-cols-2 sm:gap-x-8">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-sm font-medium text-foreground">{children}</span>
    </div>
  )
}

export function PublicVehicleDashboard({ data }: { data: PublicVehicleLookupData }) {
  const { contractor, site, driver } = data
  const docTrimmed = data.document?.trim() ?? ""

  const registered = formatStamp(data.registeredAt ?? data.createdAt ?? null)
  const approved = formatStamp(data.approvedAt ?? null)
  const created = formatStamp(data.createdAt ?? null)
  const updated = formatStamp(data.updatedAt ?? null)

  const approvedMain = isApprovedStatus(data.approvalStatus)
  const driverApproved = driver && isApprovedStatus(driver.approvalStatus)
  const siteApproved = site && isApprovedStatus(site.approvalStatus)

  const operationalActive =
    (data.status ?? "").toUpperCase() === "ACTIVE" ||
    (data.status ?? "").toLowerCase().includes("active")

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Hero */}
      <div className="rounded-2xl border border-border bg-card px-5 py-6 shadow-sm sm:px-8 sm:py-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4 sm:gap-5">
            <div
              className="bg-primary/15 text-primary ring-primary/25 flex size-[4.5rem] shrink-0 items-center justify-center rounded-2xl ring-2 ring-inset sm:size-20"
              aria-hidden
            >
              <Truck className="size-10 sm:size-11" strokeWidth={1.25} />
            </div>
            <div className="min-w-0">
              <h2 className="font-mono text-2xl font-bold tracking-[0.06em] text-foreground sm:text-3xl md:text-4xl">
                {data.registrationNumber}
              </h2>
              <p className="text-muted-foreground mt-2 text-base font-medium sm:text-lg">
                <span className="text-foreground">{data.name}</span>
                <span className="text-muted-foreground/80"> • </span>
                <span>{data.type}</span>
              </p>
            </div>
          </div>
          <div className="flex shrink-0 lg:pt-1">
            {approvedMain ? (
              <StatusApprovedBadge label={data.approvalStatus} />
            ) : (
              <Badge variant="outline" className="px-3 py-1 text-xs font-semibold uppercase">
                {data.approvalStatus}
              </Badge>
            )}
          </div>
        </div>

        {/* Summary bar */}
        <div className="mt-8 grid gap-8 border-t border-border pt-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          <SummaryCell
            icon={Calendar}
            label="Registered On"
            date={registered?.date}
            time={registered?.time}
          />
          <SummaryCell
            icon={ShieldCheck}
            label="Approved On"
            date={approved?.date}
            time={approved?.time}
          />
          <SummaryCell
            icon={Activity}
            label="Status"
            extra={
              operationalActive || (!data.status && approvedMain) ? (
                <span className="bg-primary text-primary-foreground inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold">
                  {dash(data.status) === "—" && approvedMain ? "Active" : dash(data.status)}
                </span>
              ) : (
                <span className="text-sm font-semibold">{dash(data.status)}</span>
              )
            }
          />
        </div>
      </div>

      {/* Driver + Site */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex gap-4">
            <div className="bg-primary/12 text-primary ring-primary/15 flex size-11 shrink-0 items-center justify-center rounded-xl ring-1">
              <UserCircle className="size-6" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Driver Details
              </p>
              {driver ? (
                <>
                  <p className="mt-3 text-xl font-bold tracking-tight text-foreground">
                    {driver.name}
                  </p>
                  <p className="text-muted-foreground mt-2 text-sm">
                    {dash(driver.mobileNumber)}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    License No. {dash(driver.licenceNumber)}
                  </p>
                  <div className="mt-4">
                    {driverApproved ? (
                      <StatusApprovedBadge label={driver.approvalStatus ?? "Approved"} />
                    ) : driver.approvalStatus ? (
                      <Badge variant="outline">{driver.approvalStatus}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </div>
                  {driver.licenceUrl?.trim() ? (
                    <a
                      href={resolveUploadedFilePublicUrl(driver.licenceUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary mt-3 inline-flex items-center gap-1 text-xs font-medium underline-offset-4 hover:underline"
                    >
                      View licence document
                      <ExternalLink className="size-3" aria-hidden />
                    </a>
                  ) : null}
                </>
              ) : (
                <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
                  No driver assigned to this vehicle.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex gap-4">
            <div className="bg-secondary text-secondary-foreground ring-border flex size-11 shrink-0 items-center justify-center rounded-xl ring-1">
              <MapPin className="text-primary size-6" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Site Details
              </p>
              {site ? (
                <>
                  <p className="mt-3 text-xl font-bold tracking-tight text-foreground">
                    {site.name}
                  </p>
                  <p className="text-muted-foreground mt-2 text-sm">
                    {dash(site.location)}
                  </p>
                  <p className="text-muted-foreground mt-2 text-sm">
                    {dash(site.contactPerson)}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {dash(site.mobileNumber)}
                  </p>
                  <div className="mt-4">
                    {siteApproved ? (
                      <StatusApprovedBadge label={site.approvalStatus ?? "Approved"} />
                    ) : site.approvalStatus ? (
                      <Badge variant="outline">{site.approvalStatus}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground mt-4 text-sm">—</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contractor */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <div className="bg-primary/10 text-primary ring-primary/15 flex size-11 shrink-0 items-center justify-center rounded-xl ring-1">
              <Building2 className="size-6" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Contractor Details
              </p>
              <p className="mt-3 text-xl font-bold text-foreground">{contractor.name}</p>
            </div>
          </div>
          <div className="text-muted-foreground space-y-1 pl-[3.75rem] text-sm lg:pl-0 lg:text-right">
            <p className="font-medium text-foreground">{dash(contractor.mobileNumber)}</p>
            <p>{dash(contractor.email)}</p>
            <p>{dash(contractor.contactPerson)}</p>
          </div>
        </div>
      </div>

      {/* RC & Document */}
      {docTrimmed ? (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-4">
              <div className="bg-destructive/10 text-destructive ring-destructive/15 flex size-11 shrink-0 items-center justify-center rounded-xl ring-1">
                <FileText className="size-6" aria-hidden />
              </div>
              <div>
                <p className="text-primary text-xs font-semibold tracking-wide uppercase">
                  RC &amp; Document
                </p>
                <p className="text-muted-foreground mt-2 max-w-md text-sm leading-relaxed">
                  Registration certificate and other documents on file.
                </p>
              </div>
            </div>
            <DocumentThumbLink pathOrUrl={data.document} alt="Registration document" />
          </div>
        </div>
      ) : null}

      {/* Detailed grid */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <p className="text-muted-foreground mb-6 text-xs font-semibold tracking-wide uppercase">
          Detailed Information
        </p>
        <div className="grid gap-5 sm:gap-x-12">
          <DetailGridRow label="Vehicle Type">{data.type}</DetailGridRow>
          <DetailGridRow label="Registration Number">
            <span className="font-mono tracking-wide">{data.registrationNumber}</span>
          </DetailGridRow>
          <DetailGridRow label="Created At">
            {created ? `${created.date}, ${created.time}` : "—"}
          </DetailGridRow>
          <DetailGridRow label="Updated At">
            {updated ? `${updated.date}, ${updated.time}` : "—"}
          </DetailGridRow>
          <DetailGridRow label="Approval Status">
            {approvedMain ? (
              <span className="bg-primary text-primary-foreground inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold">
                Approved
              </span>
            ) : (
              data.approvalStatus
            )}
          </DetailGridRow>
          <DetailGridRow label="Approved At">
            {approved ? `${approved.date}, ${approved.time}` : "—"}
          </DetailGridRow>
          <DetailGridRow label="Approval Note">{dash(data.approvalNote)}</DetailGridRow>
          <DetailGridRow label="Rejection Note">{dash(data.rejectionNote)}</DetailGridRow>
        </div>
      </div>

      {/* Footer trust strip */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-muted/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-3 sm:items-center">
          <ShieldCheck className="text-primary mt-0.5 size-5 shrink-0 opacity-80 sm:mt-0" />
          <p className="text-muted-foreground text-sm leading-relaxed">
            All information is verified and approved by{" "}
            <span className="font-semibold text-foreground">APCRDA</span>.
          </p>
        </div>
      </div>
    </div>
  )
}
