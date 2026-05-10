import { useEffect, useState } from "react"

import { useSearchParams } from "react-router"

import { AlertCircle, Loader2, Search } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"
import { Button } from "~/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Skeleton } from "~/components/ui/skeleton"
import { PublicVehicleDashboard } from "~/components/web/public-vehicle-dashboard"
import { fetchPublicVehicleByRegistration } from "~/features/public/api"
import { ApiRequestError } from "~/services/api-error"
import type { PublicVehicleLookupData } from "~/types/public-vehicle"
import { cn } from "~/lib/utils"

const REG_PARAM = "registrationNumber"

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

      {result && !error ? <PublicVehicleDashboard data={result} /> : null}
    </section>
  )
}
