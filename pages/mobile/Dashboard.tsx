import { ChevronRight, ScanSearch, ShieldCheck, Truck } from "lucide-react"

const quickActions = [
  "Check permit status",
  "Find registration history",
  "Open last synced vehicle",
]

const insightCards = [
  { label: "Active requests", value: "24", icon: ScanSearch },
  { label: "Verified records", value: "1.2K", icon: ShieldCheck },
  { label: "Vehicle movements", value: "48", icon: Truck },
]

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] bg-primary p-5 text-primary-foreground shadow-[0_18px_48px_-28px_rgba(234,88,12,0.5)]">
        <p className="text-sm opacity-80">Today&apos;s focus</p>
        <h2 className="mt-2 font-heading text-2xl font-semibold">
          Manage vehicle workflows with a native-feeling shell.
        </h2>
        <p className="mt-3 text-sm leading-6 opacity-90">
          Track live assignments, run quick lookups, and keep essential actions
          within thumb reach.
        </p>
      </section>

      <section className="grid grid-cols-3 gap-3">
        {insightCards.map((item) => {
          const Icon = item.icon

          return (
            <article
              key={item.label}
              className="rounded-[24px] border border-border/60 bg-background p-4 shadow-sm"
            >
              <Icon className="size-5 text-primary" />
              <p className="mt-4 text-xl font-semibold text-foreground">
                {item.value}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {item.label}
              </p>
            </article>
          )
        })}
      </section>

      <section className="rounded-[28px] border border-border/60 bg-background p-5 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">
          Quick actions
        </p>
        <h3 className="mt-1 font-heading text-xl font-semibold text-foreground">
          Start from recent tasks
        </h3>
        <div className="mt-4 space-y-3">
          {quickActions.map((item) => (
            <button
              key={item}
              type="button"
              className="flex w-full items-center justify-between rounded-2xl bg-muted/50 px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {item}
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
