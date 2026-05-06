import { Mail, MapPin, Phone } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"

const contactItems = [
  { label: "Support line", value: "+91 98765 43210", icon: Phone },
  { label: "Email", value: "support@vehicleinfo.app", icon: Mail },
  { label: "Office", value: "Vijayawada, Andhra Pradesh", icon: MapPin },
]

export default function ContactPage() {
  return (
    <div className="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-[32px] border border-border/60 bg-background/90 p-6 shadow-[0_18px_48px_-34px_rgba(15,23,42,0.35)] sm:p-8">
        <p className="text-sm font-semibold tracking-[0.22em] text-primary uppercase">
          Contact us
        </p>
        <h1 className="mt-4 font-heading text-3xl font-semibold text-foreground">
          Reach the team managing the experience.
        </h1>
        <div className="mt-8 space-y-4">
          {contactItems.map((item) => {
            const Icon = item.icon

            return (
              <div key={item.label} className="flex items-start gap-4 rounded-2xl bg-muted/40 p-4">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="mt-1 font-medium text-foreground">{item.value}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="rounded-[32px] border border-border/60 bg-background/90 p-6 shadow-[0_18px_48px_-34px_rgba(15,23,42,0.35)] sm:p-8">
        <div className="grid gap-5">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Project inquiry</p>
            <h2 className="mt-2 font-heading text-2xl font-semibold text-foreground">
              Ask about integration, onboarding, or rollout planning.
            </h2>
          </div>
          <Input placeholder="Your name" />
          <Input type="email" placeholder="Work email" />
          <Input placeholder="Company or department" />
          <textarea
            className="min-h-32 rounded-2xl border border-input bg-transparent px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            placeholder="Tell us what you need from the platform."
          />
          <Button size="lg">Send request</Button>
        </div>
      </section>
    </div>
  )
}