import { BadgeCheck, Clock3, UserRound } from "lucide-react"

const drivers = [
  {
    name: "Ravi Teja",
    license: "AP2020DL3345",
    status: "Available",
    shift: "08:00 - 16:00",
  },
  {
    name: "Meghana Rao",
    license: "TS2019DL7788",
    status: "On route",
    shift: "10:00 - 18:00",
  },
  {
    name: "Kiran Kumar",
    license: "AP2018DL9951",
    status: "Off duty",
    shift: "Rest day",
  },
]

export default function DriversPage() {
  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-muted-foreground">Drivers</p>
        <h2 className="mt-1 font-heading text-2xl font-semibold text-foreground">
          Keep driver availability and compliance visible.
        </h2>
      </section>

      <section className="space-y-3">
        {drivers.map((driver) => (
          <article
            key={driver.license}
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
                      {driver.license}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {driver.status}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Clock3 className="size-4 text-primary" />
                    {driver.shift}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <BadgeCheck className="size-4 text-primary" />
                    Verified
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
