import { History, Search } from "lucide-react"

import { Input } from "~/components/ui/input"

const recentSearches = [
  "AP16AB1234",
  "Chassis ending 2290",
  "Permit renewal - Vijayawada",
]

const searchResults = [
  {
    title: "AP16AB1234",
    subtitle: "Passenger vehicle • Last updated 6 min ago",
  },
  {
    title: "TS09XY5521",
    subtitle: "Goods carrier • Pending compliance review",
  },
]

export default function SearchPage() {
  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-muted-foreground">Search vehicles</p>
        <div className="mt-3 flex items-center gap-3 rounded-[24px] border border-border/60 bg-background px-4 py-3 shadow-sm">
          <Search className="size-5 text-muted-foreground" />
          <Input
            className="h-auto border-0 px-0 py-0 text-sm shadow-none focus-visible:ring-0"
            placeholder="Search by registration, owner, or permit"
          />
        </div>
      </section>

      <section className="rounded-[28px] border border-border/60 bg-background p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <History className="size-4 text-primary" />
          Recent searches
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {recentSearches.map((item) => (
            <span
              key={item}
              className="rounded-full border border-border/70 bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground"
            >
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        {searchResults.map((result) => (
          <article key={result.title} className="rounded-[24px] border border-border/60 bg-background p-4 shadow-sm">
            <p className="font-semibold text-foreground">{result.title}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{result.subtitle}</p>
          </article>
        ))}
      </section>
    </div>
  )
}