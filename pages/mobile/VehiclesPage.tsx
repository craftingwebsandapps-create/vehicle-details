import { useEffect, useState } from "react"

type Contractor = {
  _id: string
  name: string
  contactPerson: string
  mobileNumber: string
  email: string
  status: string
  createdAt: string
  updatedAt: string
}

type Site = {
  _id: string
  name: string
  contractor: string
  contactPerson: string
  mobileNumber: string
  email: string
  location: string
  status: string
  createdAt: string
  updatedAt: string
}

type Driver = {
  _id: string
  name: string
  licenceNumber: string
  licenceUrl: string
  mobileNumber: string
  contractor: string
  status: string
  createdAt: string
  updatedAt: string
}

type Vehicle = {
  _id: string
  name: string
  contractor: Contractor
  type: string
  registrationNumber: string
  document: string
  status: string
  site: Site
  driver: Driver
  createdAt: string
  updatedAt: string
}

type VehicleMeta = {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

type VehicleListResponse = {
  success: boolean
  message: string
  data: {
    data: Vehicle[]
    meta: VehicleMeta
  }
}

const API_URL =
  "https://vi-backend.theamaravaticity.com/api/vehicles?page=1&limit=10"

const FALLBACK_ACCESS_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZTg1MGYxYTY3NWU0YzRjMTFhZjk5NCIsImVtYWlsIjoic3VwZXJhZG1pbkBleGFtcGxlLmNvbSIsImlhdCI6MTc3ODA1NjI1NSwiZXhwIjoxNzc4MTQyNjU1fQ.ZWpFLuoTDc3zdyKWbkCOHMfzJk2FKNKi7UYSkqLgeoQ"

function getAccessToken() {
  if (typeof window === "undefined") {
    return FALLBACK_ACCESS_TOKEN
  }

  return (
    window.localStorage.getItem("accessToken") ||
    window.localStorage.getItem("token") ||
    FALLBACK_ACCESS_TOKEN
  )
}

function formatDate(date: string) {
  return new Date(date).toLocaleString()
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [meta, setMeta] = useState<VehicleMeta | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadVehicles() {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(API_URL, {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const payload: VehicleListResponse = await response.json()

        if (!payload.success) {
          throw new Error(payload.message || "Failed to fetch vehicles")
        }

        setVehicles(payload.data.data)
        setMeta(payload.data.meta)
      } catch (caughtError) {
        if (
          caughtError instanceof DOMException &&
          caughtError.name === "AbortError"
        ) {
          return
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Something went wrong while loading vehicles"
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadVehicles()

    return () => {
      controller.abort()
    }
  }, [])

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-muted-foreground">Vehicles</p>
        <h2 className="mt-1 font-heading text-2xl font-semibold text-foreground">
          Vehicle list from API
        </h2>

        {meta ? (
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <p className="rounded-lg bg-muted/40 px-3 py-2">
              Total: {meta.total}
            </p>
            <p className="rounded-lg bg-muted/40 px-3 py-2">
              Page: {meta.page}
            </p>
            <p className="rounded-lg bg-muted/40 px-3 py-2">
              Limit: {meta.limit}
            </p>
            <p className="rounded-lg bg-muted/40 px-3 py-2">
              Total pages: {meta.totalPages}
            </p>
          </div>
        ) : null}
      </section>

      {isLoading ? (
        <p className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Loading vehicles...
        </p>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {!isLoading && !error && vehicles.length === 0 ? (
        <p className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          No vehicles found.
        </p>
      ) : null}

      {!isLoading && !error ? (
        <section className="space-y-3">
          {vehicles.map((vehicle) => (
            <article
              key={vehicle._id}
              className="rounded-[26px] border border-border/60 bg-background p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs tracking-wide text-muted-foreground uppercase">
                    Registration Number
                  </p>
                  <p className="font-semibold text-foreground">
                    {vehicle.registrationNumber}
                  </p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {vehicle.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                <p className="rounded-xl bg-muted/40 px-3 py-2">
                  <span className="text-xs text-muted-foreground">
                    Vehicle Name:{" "}
                  </span>
                  <span className="text-foreground">{vehicle.name}</span>
                </p>
                <p className="rounded-xl bg-muted/40 px-3 py-2">
                  <span className="text-xs text-muted-foreground">Type: </span>
                  <span className="text-foreground">{vehicle.type}</span>
                </p>
                <p className="rounded-xl bg-muted/40 px-3 py-2">
                  <span className="text-xs text-muted-foreground">
                    Contractor:{" "}
                  </span>
                  <span className="text-foreground">
                    {vehicle.contractor.name}
                  </span>
                </p>
                <p className="rounded-xl bg-muted/40 px-3 py-2">
                  <span className="text-xs text-muted-foreground">
                    Contractor Mobile:{" "}
                  </span>
                  <span className="text-foreground">
                    {vehicle.contractor.mobileNumber}
                  </span>
                </p>
                <p className="rounded-xl bg-muted/40 px-3 py-2">
                  <span className="text-xs text-muted-foreground">Site: </span>
                  <span className="text-foreground">{vehicle.site.name}</span>
                </p>
                <p className="rounded-xl bg-muted/40 px-3 py-2">
                  <span className="text-xs text-muted-foreground">
                    Site Location:{" "}
                  </span>
                  <span className="text-foreground">
                    {vehicle.site.location}
                  </span>
                </p>
                <p className="rounded-xl bg-muted/40 px-3 py-2">
                  <span className="text-xs text-muted-foreground">
                    Driver:{" "}
                  </span>
                  <span className="text-foreground">{vehicle.driver.name}</span>
                </p>
                <p className="rounded-xl bg-muted/40 px-3 py-2">
                  <span className="text-xs text-muted-foreground">
                    Driver Mobile:{" "}
                  </span>
                  <span className="text-foreground">
                    {vehicle.driver.mobileNumber}
                  </span>
                </p>
                <p className="rounded-xl bg-muted/40 px-3 py-2 md:col-span-2">
                  <span className="text-xs text-muted-foreground">
                    Document URL:{" "}
                  </span>
                  <a
                    href={vehicle.document}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-primary underline"
                  >
                    {vehicle.document}
                  </a>
                </p>
                <p className="rounded-xl bg-muted/40 px-3 py-2">
                  <span className="text-xs text-muted-foreground">
                    Created At:{" "}
                  </span>
                  <span className="text-foreground">
                    {formatDate(vehicle.createdAt)}
                  </span>
                </p>
                <p className="rounded-xl bg-muted/40 px-3 py-2">
                  <span className="text-xs text-muted-foreground">
                    Updated At:{" "}
                  </span>
                  <span className="text-foreground">
                    {formatDate(vehicle.updatedAt)}
                  </span>
                </p>
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  )
}
