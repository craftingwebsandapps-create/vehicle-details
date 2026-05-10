import type { ReactNode } from "react"

import BottomTabs from "~/components/mobile/BottomTabs"
import MobileHeader from "~/components/mobile/MobileHeader"

type MobileLayoutProps = {
  children: ReactNode
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  return (
    <div className="min-h-dvh p-2">
      <div className="mx-auto flex min-h-[calc(100dvh-1.5rem)] w-full max-w-120 flex-col overflow-hidden">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto px-4 pt-5 pb-28 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {children}
        </main>
      </div>
      <BottomTabs />
    </div>
  )
}
