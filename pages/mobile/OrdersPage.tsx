const orders = [
  {
    id: "#ORD-1024",
    status: "In review",
    description: "Registration transfer for passenger vehicle",
  },
  {
    id: "#ORD-1025",
    status: "Approved",
    description: "Duplicate RC issue request",
  },
  {
    id: "#ORD-1026",
    status: "Awaiting documents",
    description: "Temporary permit extension",
  },
]

export default function OrdersPage() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Orders</p>
        <h2 className="mt-1 font-heading text-2xl font-semibold text-foreground">
          Track service requests in one place.
        </h2>
      </div>

      {orders.map((order) => (
        <article key={order.id} className="rounded-[26px] border border-border/60 bg-background p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-foreground">{order.id}</p>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {order.status}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {order.description}
          </p>
        </article>
      ))}
    </div>
  )
}