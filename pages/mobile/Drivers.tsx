import { useEffect } from "react"

import { BadgeCheck, Clock3, ExternalLink, UserRound } from "lucide-react"

import { useAppDispatch, useAppSelector } from "~/app/hooks"
import { fetchDriversThunk } from "~/features/drivers/driversSlice"

export default function Drivers() {
  const dispatch = useAppDispatch()
  const {
    items: drivers,
    status,
    error,
  } = useAppSelector((state) => state.drivers)

  useEffect(() => {
    void dispatch(fetchDriversThunk())
  }, [dispatch])

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-muted-foreground">Drivers</p>
        <h2 className="mt-1 font-heading text-2xl font-semibold text-foreground">
          Keep driver availability and compliance visible.
        </h2>
      </section>

      {status === "loading" ? (
        <p className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Loading drivers...
        </p>
      ) : null}

      {status === "failed" ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {status !== "loading" && status !== "failed" && drivers.length === 0 ? (
        <p className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          No drivers found.
        </p>
      ) : null}

      {status !== "loading" && status !== "failed" ? (
        <section className="space-y-3">
          {drivers.map((driver) => (
            <article
              key={driver.id}
              className="rounded-[26px] border border-border/60 bg-background p-5 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <UserRound className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">
                        {driver.name}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {driver.licenceNumber}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {driver.status}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Clock3 className="size-4 text-primary" />
                      {driver.mobileNumber}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <BadgeCheck className="size-4 text-primary" />
                      Verified
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                    <p>
                      Contractor:{" "}
                      <span className="text-foreground">
                        {driver.contractor?.name ?? "-"}
                      </span>
                    </p>
                    <p>
                      Site:{" "}
                      <span className="text-foreground">
                        {driver.site?.name ?? "-"}
                      </span>
                    </p>
                    <p className="sm:col-span-2">
                      Vehicle:{" "}
                      <span className="text-foreground">
                        {driver.vehicle?.registrationNumber ??
                          driver.vehicle?.name ??
                          "-"}
                      </span>
                    </p>
                  </div>
                  {driver.licenceUrl ? (
                    <div className="mt-4">
                      <a
                        href={driver.licenceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline"
                      >
                        <ExternalLink className="size-3.5" />
                        View licence document
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  )
}
