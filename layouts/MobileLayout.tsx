import { Sparkles } from "lucide-react"
import { Outlet } from "react-router"

import BottomTabs from "~/components/BottomTabs"

export default function MobileLayout() {
  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top,_rgba(244,114,42,0.16),_transparent_26%),linear-gradient(180deg,_rgba(255,247,237,1),_rgba(255,255,255,1))] px-3 py-3 sm:px-6 sm:py-6">
      <div className="mx-auto flex min-h-[calc(100dvh-1.5rem)] max-w-[480px] flex-col overflow-hidden rounded-[32px] border border-white/70 bg-background/90 shadow-[0_30px_90px_-40px_rgba(15,23,42,0.55)] backdrop-blur">
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

        <main className="flex-1 overflow-y-auto px-4 pb-28 pt-5">
          <Outlet />
        </main>
      </div>

      <BottomTabs />
    </div>
  )
}