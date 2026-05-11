import { useState, type ComponentType, type ReactNode } from "react"

import {
  Building2,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  ShieldCheck,
  Truck,
  UserCircle,
} from "lucide-react"

import { Skeleton } from "~/components/ui/skeleton"
import { resolveUploadedFilePublicUrl } from "~/features/files/api"
import { cn } from "~/lib/utils"
import type { PublicVehicleLookupData } from "~/types/public-vehicle"

const IMAGE_PATH_EXT = /\.(jpe?g|png|gif|webp|svg)(\?.*)?$/i

function pathnameFromHref(href: string): string {
  try {
    return new URL(href).pathname
  } catch {
    return href
  }
}

function dash(v: string | null | undefined): string {
  const s = v?.trim()
  return s ? s : "—"
}

const iconTileVariants = {
  vehicle:
    "bg-primary/15 text-primary ring-primary/25 ring-2 ring-inset sm:size-14 sm:[&>svg]:size-7",
  primary:
    "bg-primary/12 text-primary ring-primary/15 ring-1 sm:size-12 sm:[&>svg]:size-6",
  secondary:
    "bg-secondary text-secondary-foreground ring-border ring-1 sm:size-12 sm:[&>svg]:size-6 [&>svg]:text-primary",
  contractor:
    "bg-primary/10 text-primary ring-primary/15 ring-1 sm:size-12 sm:[&>svg]:size-6",
} as const

function InfoBox({
  title,
  icon: Icon,
  variant,
  children,
}: {
  title: string
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
  variant: keyof typeof iconTileVariants
  children: ReactNode
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-3 border-b border-border/60 pb-4">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl",
            iconTileVariants[variant]
          )}
          aria-hidden
        >
          <Icon className="size-6" strokeWidth={1.5} />
        </div>
        <h3 className="font-heading text-base font-semibold tracking-tight text-foreground">
          {title}
        </h3>
      </div>
      <div className="min-w-0 flex-1 space-y-3 text-sm">{children}</div>
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
    <div className="flex flex-col gap-2">
      {isImg && !failed ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block max-w-full overflow-hidden rounded-lg border border-border bg-muted/40 shadow-sm"
        >
          <img
            src={href}
            alt={alt}
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
            className="max-h-40 w-full max-w-xs object-cover object-center"
          />
        </a>
      ) : (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary inline-flex w-fit items-center gap-1 text-xs font-medium underline-offset-4 hover:underline"
        >
          View document
          <ExternalLink className="size-3" aria-hidden />
        </a>
      )}
    </div>
  )
}

function DashboardSkeletonCard() {
  return (
    <div className="flex h-full min-h-[12rem] flex-col rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-3 border-b border-border/60 pb-4">
        <Skeleton className="size-11 shrink-0 rounded-xl" />
        <Skeleton className="h-5 w-28 rounded-md" />
      </div>
      <div className="flex flex-1 flex-col gap-3">
        <Skeleton className="h-7 w-4/5 max-w-[14rem] rounded-md" />
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-3/5 rounded-md" />
        <Skeleton className="mt-auto h-4 w-2/3 rounded-md" />
      </div>
    </div>
  )
}

/** Placeholder grid matching Vehicle / Driver / Site / Contractor while lookup runs. */
export function PublicVehicleDashboardSkeleton() {
  return (
    <div
      className="flex flex-col gap-4 pb-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading vehicle details"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Loader2
          className="size-4 shrink-0 animate-spin text-primary"
          aria-hidden
        />
        Loading vehicle details…
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <DashboardSkeletonCard />
        <DashboardSkeletonCard />
        <DashboardSkeletonCard />
        <DashboardSkeletonCard />
      </div>
      <Skeleton className="h-[4.5rem] w-full rounded-2xl" />
    </div>
  )
}

export function PublicVehicleDashboard({ data }: { data: PublicVehicleLookupData }) {
  const { contractor, site, driver } = data
  const docTrimmed = data.document?.trim() ?? ""

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <InfoBox title="Vehicle" icon={Truck} variant="vehicle">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Registration
            </p>
            <p className="font-mono text-xl font-bold tracking-[0.06em] text-foreground">
              {data.registrationNumber}
            </p>
          </div>
          <div className="space-y-1 pt-1">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Name
            </p>
            <p className="text-base font-semibold text-foreground">{data.name}</p>
          </div>
          <div className="space-y-1 pt-1">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Type
            </p>
            <p className="font-medium text-foreground">{data.type}</p>
          </div>
          {docTrimmed ? (
            <div className="border-border/60 mt-2 border-t pt-4">
              <div className="mb-2 flex items-center gap-2">
                <FileText className="text-muted-foreground size-4 shrink-0" aria-hidden />
                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  RC &amp; document
                </span>
              </div>
              <DocumentThumbLink pathOrUrl={data.document} alt="Registration document" />
            </div>
          ) : null}
        </InfoBox>

        <InfoBox title="Driver" icon={UserCircle} variant="primary">
          {driver ? (
            <>
              <p className="text-lg font-bold tracking-tight text-foreground">{driver.name}</p>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase tracking-wide">Mobile</p>
                <p className="font-medium text-foreground">{dash(driver.mobileNumber)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                  Licence No.
                </p>
                <p className="font-medium text-foreground">{dash(driver.licenceNumber)}</p>
              </div>
              {driver.licenceUrl?.trim() ? (
                <div className="border-border/60 mt-2 border-t pt-4">
                  <div className="mb-2 flex items-center gap-2">
                    <FileText className="text-muted-foreground size-4 shrink-0" aria-hidden />
                    <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      Licence document
                    </span>
                  </div>
                  <DocumentThumbLink
                    pathOrUrl={driver.licenceUrl}
                    alt={`Licence — ${driver.name}`}
                  />
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-muted-foreground leading-relaxed">
              No driver assigned to this vehicle.
            </p>
          )}
        </InfoBox>

        <InfoBox title="Site" icon={MapPin} variant="secondary">
          {site ? (
            <>
              <p className="text-lg font-bold tracking-tight text-foreground">{site.name}</p>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase tracking-wide">Location</p>
                <p className="font-medium text-foreground">{dash(site.location)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase tracking-wide">Contact</p>
                <p className="font-medium text-foreground">{dash(site.contactPerson)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase tracking-wide">Mobile</p>
                <p className="font-medium text-foreground">{dash(site.mobileNumber)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase tracking-wide">Email</p>
                <p className="break-all font-medium text-foreground">{dash(site.email)}</p>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">—</p>
          )}
        </InfoBox>

        <InfoBox title="Contractor" icon={Building2} variant="contractor">
          <p className="text-lg font-bold text-foreground">{contractor.name}</p>
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Mobile</p>
            <p className="font-medium text-foreground">{dash(contractor.mobileNumber)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Email</p>
            <p className="break-all font-medium text-foreground">{dash(contractor.email)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs uppercase tracking-wide">
              Contact person
            </p>
            <p className="font-medium text-foreground">{dash(contractor.contactPerson)}</p>
          </div>
        </InfoBox>
      </div>

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
