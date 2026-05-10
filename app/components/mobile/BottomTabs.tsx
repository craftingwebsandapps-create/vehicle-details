import { NavLink } from "react-router"

import { cn } from "~/lib/utils"
import { MOBILE_TABS } from "~/utils/constants"

export default function BottomTabs() {
  return (
    <nav
      aria-label="Mobile navigation tabs"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-120 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
    >
      <div className="flex gap-1 rounded-3xl border border-border/70 bg-background/95 p-2 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.45)] backdrop-blur-md">
        {MOBILE_TABS.map((tab) => {
          const Icon = tab.icon

          return (
            <NavLink
              key={tab.key}
              to={tab.path}
              className={({ isActive }) =>
                cn(
                  "flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[0.64rem] font-medium text-muted-foreground transition-all duration-200",
                  isActive &&
                    "bg-primary text-primary-foreground shadow-[0_10px_26px_-15px_var(--color-primary)]"
                )
              }
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate text-center leading-tight">
                {tab.label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
