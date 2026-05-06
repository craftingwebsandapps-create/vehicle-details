import { Sparkles } from "lucide-react"
import { Outlet } from "react-router"

import BottomTabs from "~/components/BottomTabs"

export default function MobileLayout() {
  return (
    <div className="min-h-dvh">
      <div className="mx-auto flex min-h-[calc(100dvh-1.5rem)] max-w-120 flex-col overflow-hidden">
        <div className="border-b border-border/60 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.24em] text-primary uppercase">
                Mobile workspace
              </p>
              <h1 className="mt-1 font-heading text-lg font-semibold text-foreground">
                Native-style dashboard
              </h1>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" />
              Live sync
            </span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto px-4 pt-5 pb-28">
          <Outlet />
        </main>
      </div>

      <BottomTabs />
    </div>
  )
}
