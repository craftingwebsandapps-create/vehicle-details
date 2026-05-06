import { Building2, MapPinned, RadioTower, ShieldCheck } from "lucide-react"

const sites = [
  {
    name: "North Hub",
    region: "Vijayawada",
    status: "Operational",
    vehicles: 18,
  },
  {
    name: "East Yard",
    region: "Rajahmundry",
    status: "Dispatching",
    vehicles: 12,
  },
  {
    name: "Central Depot",
    region: "Guntur",
    status: "Ready",
    vehicles: 26,
  },
]

const metrics = [
  { label: "Active sites", value: "12", icon: Building2 },
  { label: "Monitored zones", value: "28", icon: RadioTower },
  { label: "Compliant hubs", value: "98%", icon: ShieldCheck },
]

export default function SitesPage() {
  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-muted-foreground">Sites</p>
        <h2 className="mt-1 font-heading text-2xl font-semibold text-foreground">
          Monitor operational hubs and dispatch points.
        </h2>
      </section>

      <section className="grid grid-cols-3 gap-3">
        {metrics.map((metric) => {
          const Icon = metric.icon

          return (
            <article
              key={metric.label}
              className="rounded-[24px] border border-border/60 bg-background p-4 shadow-sm"
            >
              <Icon className="size-5 text-primary" />
              <p className="mt-4 text-xl font-semibold text-foreground">
                {metric.value}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {metric.label}
              </p>
            </article>
          )
        })}
      </section>

      <section className="space-y-3">
        {sites.map((site) => (
          <article
            key={site.name}
            className="rounded-[26px] border border-border/60 bg-background p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">{site.name}</p>
                <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPinned className="size-4" />
                  {site.region}
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {site.status}
              </span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {site.vehicles} vehicles currently assigned to this site.
            </p>
          </article>
        ))}
      </section>
    </div>
  )
}
