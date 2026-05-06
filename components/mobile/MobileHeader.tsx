import { Sparkles } from "lucide-react"

type MobileHeaderProps = {
  title?: string
}

export default function MobileHeader({
  title = "Vehicle Information",
}: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/95 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">
            Mobile app
          </p>
          <h1 className="font-heading text-lg font-semibold text-foreground">
            {title}
          </h1>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="size-3.5" />
          Synced
        </span>
      </div>
    </header>
  )
}
