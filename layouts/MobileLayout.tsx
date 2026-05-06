import type { ReactNode } from "react"

import BottomTabs from "~/components/mobile/BottomTabs"
import MobileHeader from "~/components/mobile/MobileHeader"

type MobileLayoutProps = {
  children: ReactNode
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top,#fff7ed_0%,#ffffff_50%,#f8fafc_100%)] px-3 py-3">
      <div className="mx-auto flex min-h-[calc(100dvh-1.5rem)] w-full max-w-120 flex-col overflow-hidden rounded-[30px] border border-border/70 bg-background shadow-[0_32px_70px_-42px_rgba(15,23,42,0.7)]">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto px-4 pt-5 pb-28 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {children}
        </main>
      </div>
      <BottomTabs />
    </div>
  )
}
