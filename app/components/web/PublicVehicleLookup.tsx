import { useEffect, useState, type ComponentType, type ReactNode } from "react"

import { useSearchParams } from "react-router"

import {
  AlertCircle,
  Building2,
  ExternalLink,
  Loader2,
  MapPin,
  Search,
  Truck,
  UserCircle,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Separator } from "~/components/ui/separator"
import { Skeleton } from "~/components/ui/skeleton"
import { resolveUploadedFilePublicUrl } from "~/features/files/api"
import { fetchPublicVehicleByRegistration } from "~/features/public/api"
import { ApiRequestError } from "~/services/api-error"
import { cn } from "~/lib/utils"
import type { PublicVehicleLookupData } from "~/types/public-vehicle"

const REG_PARAM = "registrationNumber"

const IMAGE_PATH_EXT = /\.(jpe?g|png|gif|webp|svg)(\?.*)?$/i

function pathnameFromHref(href: string): string {
  try {
    return new URL(href).pathname
  } catch {
    return href
  }
}

function approvalBadgeVariant(status: string | undefined) {
  const s = (status ?? "").toLowerCase()
  if (s.includes("approv")) return "secondary" as const
  if (s.includes("pending")) return "outline" as const
  if (s.includes("reject")) return "destructive" as const
  return "outline" as const
}

/** Public file URL + optional inline preview for images. */
function PublicFileView({
  pathOrUrl,
  linkLabel,
  previewAlt,
}: {
  pathOrUrl: string
  linkLabel: string
  previewAlt: string
}) {
  const [imgFailed, setImgFailed] = useState(false)
  const trimmed = pathOrUrl.trim()
  if (!trimmed) return null

  const href = resolveUploadedFilePublicUrl(trimmed)
  const showImagePreview = IMAGE_PATH_EXT.test(pathnameFromHref(href))

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-fit items-center gap-1.5 rounded-md text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        {linkLabel}
        <ExternalLink className="size-3.5 shrink-0 opacity-70" aria-hidden />
      </a>
      {showImagePreview && !imgFailed ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block max-w-full rounded-lg outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <img
            src={href}
            alt={previewAlt}
            loading="lazy"
            decoding="async"
            onError={() => setImgFailed(true)}
            className="max-h-64 w-full max-w-md rounded-lg border border-border bg-muted/40 object-contain shadow-sm"
          />
        </a>
      ) : null}
      {showImagePreview && imgFailed ? (
        <p className="text-muted-foreground text-xs leading-relaxed">
          Preview could not be loaded (often a browser security limit). Use the
          link above to open the file.
        </p>
      ) : null}
    </div>
  )
}

function DetailBlock({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon?: ComponentType<{ className?: string }>
  children: ReactNode
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/15 p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2.5">
        {Icon ? (
          <span className="flex size-9 items-center justify-center rounded-lg bg-background shadow-sm ring-1 ring-border/60">
            <Icon className="size-4 text-muted-foreground" aria-hidden />
          </span>
        ) : null}
        <h3 className="font-heading text-base font-semibold text-foreground">
          {title}
        </h3>
      </div>
      <div className="flex flex-col gap-3.5">{children}</div>
    </div>
  )
}

function DlRow({ label, children }: { label: string; children: ReactNode }) {
  if (
    children === null ||
    children === undefined ||
    children === "" ||
    children === false
  ) {
    return null
  }
  return (
    <div className="grid gap-1 sm:grid-cols-[minmax(0,10.5rem)_minmax(0,1fr)] sm:gap-x-5">
      <span className="text-muted-foreground text-sm leading-snug">{label}</span>
      <span className="min-w-0 break-words text-sm leading-snug font-medium text-foreground">
        {children}
      </span>
    </div>
  )
}

function PublicVehicleResult({ data }: { data: PublicVehicleLookupData }) {
  const { contractor, site, driver } = data
  const docTrimmed = data.document?.trim() ?? ""

  return (
    <Card className="overflow-visible shadow-md ring-1 ring-border/60">
      <CardHeader className="space-y-4 pb-2">
        <div className="rounded-xl bg-muted/50 px-4 py-5 sm:px-5">
          <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Registration
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold tracking-[0.08em] text-foreground sm:text-3xl">
            {data.registrationNumber}
          </p>
          <p className="mt-3 text-lg font-semibold leading-snug text-foreground">
            {data.name}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-normal">
              {data.type}
            </Badge>
            <Badge variant={approvalBadgeVariant(data.approvalStatus)}>
              {data.approvalStatus}
            </Badge>
          </div>
        </div>
        <CardTitle className="sr-only">Full vehicle record</CardTitle>
        <CardDescription className="text-pretty">
          Contractor, site, and driver details below are shown when provided by
          the operator.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 overflow-visible pt-0">
        <Separator />
        <div className="flex flex-col gap-5">
          <DetailBlock title="Vehicle" icon={Truck}>
            <DlRow label="Type" children={data.type} />
            <DlRow label="Approval" children={data.approvalStatus} />
            {docTrimmed ? (
              <div className="grid gap-1 sm:grid-cols-[minmax(0,10.5rem)_minmax(0,1fr)] sm:gap-x-5">
                <span className="text-muted-foreground text-sm leading-snug">
                  Document
                </span>
                <div className="min-w-0">
                  <PublicFileView
                    pathOrUrl={data.document}
                    linkLabel="Open document"
                    previewAlt="Vehicle document"
                  />
                </div>
              </div>
            ) : null}
          </DetailBlock>

          <DetailBlock title="Contractor" icon={Building2}>
            <DlRow label="Name" children={contractor.name} />
            <DlRow label="Contact" children={contractor.contactPerson} />
            <DlRow label="Mobile" children={contractor.mobileNumber} />
            <DlRow label="Email" children={contractor.email} />
          </DetailBlock>

          {site ? (
            <DetailBlock title="Site" icon={MapPin}>
              <DlRow label="Name" children={site.name} />
              <DlRow label="Location" children={site.location} />
              <DlRow label="Approval" children={site.approvalStatus} />
              <DlRow label="Contact" children={site.contactPerson} />
              <DlRow label="Mobile" children={site.mobileNumber} />
              <DlRow label="Email" children={site.email} />
              {site.contractor ? (
                <>
                  <Separator className="my-1" />
                  <div className="text-muted-foreground pt-1 text-xs font-semibold tracking-wide uppercase">
                    Site contractor
                  </div>
                  <DlRow label="Name" children={site.contractor.name} />
                  <DlRow label="Contact" children={site.contractor.contactPerson} />
                  <DlRow label="Mobile" children={site.contractor.mobileNumber} />
                  <DlRow label="Email" children={site.contractor.email} />
                </>
              ) : null}
            </DetailBlock>
          ) : null}

          <DetailBlock title="Driver" icon={UserCircle}>
            {driver ? (
              <>
                <DlRow label="Name" children={driver.name} />
                <DlRow label="Licence No." children={driver.licenceNumber} />
                <DlRow label="Mobile" children={driver.mobileNumber} />
                <DlRow label="Approval" children={driver.approvalStatus} />
                {driver.licenceUrl?.trim() ? (
                  <div className="grid gap-1 sm:grid-cols-[minmax(0,10.5rem)_minmax(0,1fr)] sm:gap-x-5">
                    <span className="text-muted-foreground text-sm leading-snug">
                      Licence file
                    </span>
                    <div className="min-w-0">
                      <PublicFileView
                        pathOrUrl={driver.licenceUrl}
                        linkLabel="Open licence"
                        previewAlt={`Licence — ${driver.name}`}
                      />
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-muted-foreground text-sm leading-relaxed">
                No driver is assigned to this vehicle.
              </p>
            )}
          </DetailBlock>
        </div>
      </CardContent>
    </Card>
  )
}

export function PublicVehicleLookup() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(
    () => searchParams.get(REG_PARAM)?.trim() ?? ""
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorTitle, setErrorTitle] = useState("Something went wrong")
  const [errorVariant, setErrorVariant] = useState<"default" | "destructive">(
    "destructive"
  )
  const [result, setResult] = useState<PublicVehicleLookupData | null>(null)

  const hasUrlReg = Boolean(searchParams.get(REG_PARAM)?.trim())

  useEffect(() => {
    const reg = searchParams.get(REG_PARAM)?.trim() ?? ""
    setQuery(reg)

    if (!reg) {
      setLoading(false)
      setError(null)
      setResult(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    setResult(null)
    setErrorVariant("destructive")
    setErrorTitle("Something went wrong")

    void fetchPublicVehicleByRegistration(reg)
      .then((data) => {
        if (cancelled) return
        setResult(data)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setResult(null)
        if (e instanceof ApiRequestError) {
          if (e.status === 404 || e.code === "PUBLIC_VEHICLE_NOT_FOUND") {
            setErrorVariant("default")
            setErrorTitle("No match")
            setError(
              "We could not find an approved vehicle with that registration. Check the plate and try again."
            )
          } else if (e.status === 400 || e.code === "VALIDATION_ERROR") {
            setErrorVariant("destructive")
            setErrorTitle("Check registration")
            setError(e.message || "That registration does not look valid.")
          } else {
            setErrorVariant("destructive")
            setErrorTitle("Lookup failed")
            setError(e.message || "Please try again in a moment.")
          }
        } else if (e instanceof Error) {
          setErrorVariant("destructive")
          setErrorTitle("Lookup failed")
          if (
            e.message.includes("must be between") ||
            e.message.includes("Unexpected response")
          ) {
            setErrorTitle("Invalid registration")
          }
          setError(e.message)
        } else {
          setErrorVariant("destructive")
          setErrorTitle("Lookup failed")
          setError("Something went wrong.")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [searchParams])

  const clearSearch = () => {
    setSearchParams({}, { replace: true })
    setQuery("")
    setError(null)
    setResult(null)
  }

  return (
    <section
      className="flex flex-col gap-6"
      aria-labelledby="lookup-heading"
    >
      <Card className="overflow-visible shadow-md ring-1 ring-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="font-heading text-lg">Look up</CardTitle>
          <CardDescription className="text-pretty">
            Use the plate as printed. You can paste or type spaces — the server
            normalizes them.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-0">
          <form
            className="space-y-4"
            onSubmit={(ev) => {
              ev.preventDefault()
              const trimmed = query.trim()
              if (!trimmed) {
                setSearchParams({}, { replace: true })
                return
              }
              setSearchParams({ [REG_PARAM]: trimmed }, { replace: true })
            }}
          >
            <div className="space-y-2">
              <label
                htmlFor="public-reg-lookup"
                className="text-sm font-medium text-foreground"
              >
                Registration number
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                <Input
                  id="public-reg-lookup"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. AB12 CDE"
                  maxLength={80}
                  autoComplete="off"
                  spellCheck={false}
                  inputMode="text"
                  className="min-h-11 font-mono text-base uppercase tracking-wide sm:min-h-10 sm:flex-1 sm:text-sm"
                />
                <div className="flex gap-2 sm:w-auto">
                  <Button
                    type="submit"
                    disabled={loading}
                    aria-busy={loading}
                    className="min-h-11 flex-1 gap-2 sm:min-w-[7.5rem] sm:flex-none"
                  >
                    {loading ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Search className="size-4" aria-hidden />
                    )}
                    Search
                  </Button>
                  {(query.trim() || hasUrlReg || result) && (
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 shrink-0 px-4"
                      onClick={clearSearch}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Tip: After you search, you can bookmark or share the page — the
                address includes this registration.
              </p>
            </div>
          </form>

          {loading ? (
            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="space-y-3 rounded-xl border border-border/70 bg-muted/25 px-4 py-4"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Loader2
                  className="size-4 shrink-0 animate-spin text-primary"
                  aria-hidden
                />
                Looking up registration…
              </div>
              <Skeleton className="h-11 w-full rounded-lg" />
              <Skeleton className="h-11 w-4/5 max-w-md rounded-lg" />
            </div>
          ) : null}

        </CardContent>
      </Card>

      {error ? (
        <Alert
          variant={errorVariant}
          className={cn(
            errorVariant === "default" &&
              "border-border bg-muted/30 text-foreground [&_[data-slot=alert-description]]:text-muted-foreground"
          )}
        >
          <AlertCircle className="size-4" />
          <AlertTitle>{errorTitle}</AlertTitle>
          <AlertDescription className="space-y-3">
            <span className="block">{error}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => {
                document.getElementById("public-reg-lookup")?.focus()
              }}
            >
              Edit registration
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {result && !error ? <PublicVehicleResult data={result} /> : null}
    </section>
  )
}
