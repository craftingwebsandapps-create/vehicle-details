import { Fuel, Gauge, Truck } from "lucide-react"

const vehicles = [
  {
    id: "AP16AB1234",
    model: "Ashok Leyland Dost+",
    status: "Active",
    mileage: "68,220 km",
  },
  {
    id: "TS09XY5521",
    model: "Tata Ace Gold",
    status: "In service",
    mileage: "41,008 km",
  },
  {
    id: "AP07CD8890",
    model: "Eicher Pro 2049",
    status: "Ready",
    mileage: "93,884 km",
  },
]

export default function VehiclesPage() {
  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-muted-foreground">Vehicles</p>
        <h2 className="mt-1 font-heading text-2xl font-semibold text-foreground">
          Inspect fleet readiness and movement status.
        </h2>
      </section>

      <section className="space-y-3">
        {vehicles.map((vehicle) => (
          <article
            key={vehicle.id}
            className="rounded-[26px] border border-border/60 bg-background p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">{vehicle.id}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {vehicle.model}
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {vehicle.status}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm text-muted-foreground">
              <div className="rounded-2xl bg-muted/40 p-3">
                <Truck className="mb-2 size-4 text-primary" />
                Fleet unit
              </div>
              <div className="rounded-2xl bg-muted/40 p-3">
                <Gauge className="mb-2 size-4 text-primary" />
                {vehicle.mileage}
              </div>
              <div className="rounded-2xl bg-muted/40 p-3">
                <Fuel className="mb-2 size-4 text-primary" />
                Diesel
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
