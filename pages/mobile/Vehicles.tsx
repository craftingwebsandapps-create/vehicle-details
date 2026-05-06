import { useEffect } from "react"

import { useAppDispatch, useAppSelector } from "~/app/hooks"
import { fetchVehiclesThunk } from "~/features/vehicles/vehiclesSlice"

export default function Vehicles() {
  const dispatch = useAppDispatch()
  const {
    items: vehicles,
    meta,
    status,
    error,
  } = useAppSelector((state) => state.vehicles)

  useEffect(() => {
    void dispatch(fetchVehiclesThunk())
  }, [dispatch])

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

      {status === "loading" ? (
        <p className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Loading vehicles...
        </p>
      ) : null}

      {status === "failed" ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {status !== "loading" && status !== "failed" && vehicles.length === 0 ? (
        <p className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          No vehicles found.
        </p>
      ) : null}

      {status !== "loading" && status !== "failed" ? (
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

              <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <p className="rounded-xl bg-muted/40 px-3 py-2">
                  <span className="text-xs text-muted-foreground">
                    Vehicle:{" "}
                  </span>
                  {vehicle.name}
                </p>
                <p className="rounded-xl bg-muted/40 px-3 py-2">
                  <span className="text-xs text-muted-foreground">Type: </span>
                  {vehicle.type}
                </p>
                <p className="rounded-xl bg-muted/40 px-3 py-2">
                  <span className="text-xs text-muted-foreground">
                    Driver:{" "}
                  </span>
                  {vehicle.driver?.name ?? "-"}
                </p>
                <p className="rounded-xl bg-muted/40 px-3 py-2">
                  <span className="text-xs text-muted-foreground">Site: </span>
                  {vehicle.site?.name ?? "-"}
                </p>
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  )
}
