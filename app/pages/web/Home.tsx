import { ArrowRight, BarChart3, ShieldCheck, Smartphone } from "lucide-react"
import { Link } from "react-router"

import { Button } from "~/components/ui/button"

const highlights = [
  {
    title: "Unified journeys",
    description:
      "Serve both responsive web visitors and app-style users from one production-ready codebase.",
    icon: ShieldCheck,
  },
  {
    title: "Data-aware routing",
    description:
      "React Router Data Mode keeps route boundaries explicit and scalable as features grow.",
    icon: BarChart3,
  },
  {
    title: "App shell parity",
    description:
      "A mobile-first tabbed experience sits alongside the full web navigation without sharing layout assumptions.",
    icon: Smartphone,
  },
]

export default function Home() {
  return (
    <div className="flex w-full flex-col gap-10 lg:gap-14">
      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="space-y-6">
          <p className="text-sm font-semibold tracking-[0.22em] text-primary uppercase">
            Dual experience platform
          </p>
          <div className="space-y-4">
            <h1 className="max-w-3xl font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Build once for the web, ship again for the app shell.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              This project separates the website journey from the mobile app
              journey with isolated layouts, typed route modules, and reusable
              UI components.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/mobile/dashboard" className="gap-2">
                Launch mobile app
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/web/about">Explore architecture</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 rounded-[32px] border border-border/60 bg-background/90 p-5 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.45)] sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-[28px] bg-primary p-6 text-primary-foreground">
            <p className="text-sm uppercase opacity-80">Current status</p>
            <p className="mt-3 text-3xl font-semibold">Production ready</p>
            <p className="mt-3 text-sm leading-6 opacity-90">
              Router, layouts, and TanStack Query are integrated with a clean
              scalable architecture.
            </p>
          </div>
          <div className="rounded-[28px] border border-border/60 bg-muted/40 p-6">
            <p className="text-sm font-medium text-muted-foreground">
              What you can extend next
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-foreground">
              <li>Typed loaders and actions per route</li>
              <li>Role-aware profile and order flows</li>
              <li>Offline-first mobile features</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {highlights.map((item) => {
          const Icon = item.icon

          return (
            <article
              key={item.title}
              className="rounded-[28px] border border-border/60 bg-background/90 p-6 shadow-[0_18px_48px_-34px_rgba(15,23,42,0.42)]"
            >
              <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <h2 className="mt-5 font-heading text-xl font-semibold text-foreground">
                {item.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {item.description}
              </p>
            </article>
          )
        })}
      </section>
    </div>
  )
}
