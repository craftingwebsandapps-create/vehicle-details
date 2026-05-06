import { ArrowRightLeft, ClipboardList, Map, UserSquare2 } from "lucide-react"

const assignments = [
  {
    vehicle: "AP16AB1234",
    driver: "Ravi Teja",
    route: "North Hub to Central Depot",
    status: "Dispatched",
  },
  {
    vehicle: "TS09XY5521",
    driver: "Meghana Rao",
    route: "East Yard to South Ring",
    status: "Scheduled",
  },
  {
    vehicle: "AP07CD8890",
    driver: "Kiran Kumar",
    route: "Central Depot to West Point",
    status: "Awaiting driver",
  },
]

export default function Assignments() {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-border/60 bg-background p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ClipboardList className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Assignments
            </p>
            <h2 className="font-heading text-2xl font-semibold text-foreground">
              Link drivers, vehicles, and routes.
            </h2>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        {assignments.map((assignment) => (
          <article
            key={`${assignment.vehicle}-${assignment.driver}`}
            className="rounded-[26px] border border-border/60 bg-background p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-foreground">
                {assignment.vehicle}
              </p>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {assignment.status}
              </span>
            </div>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p className="inline-flex items-center gap-2">
                <UserSquare2 className="size-4 text-primary" />
                {assignment.driver}
              </p>
              <p className="inline-flex items-center gap-2">
                <Map className="size-4 text-primary" />
                {assignment.route}
              </p>
              <p className="inline-flex items-center gap-2">
                <ArrowRightLeft className="size-4 text-primary" />
                Route assignment synced.
              </p>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
