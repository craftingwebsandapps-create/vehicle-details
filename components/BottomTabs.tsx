import { Home, Search, ShoppingBag, UserRound } from "lucide-react"
import { NavLink, useLocation } from "react-router"
import { useEffect } from "react"

import { useAppDispatch, useAppSelector } from "~/app/hooks"
import { cn } from "~/lib/utils"
import {
  setActiveMobileTab,
  type MobileTabKey,
} from "~/features/ui/uiSlice"

const tabs = [
  { key: "home", label: "Home", path: "/app/home", icon: Home },
  { key: "search", label: "Search", path: "/app/search", icon: Search },
  { key: "orders", label: "Orders", path: "/app/orders", icon: ShoppingBag },
  { key: "profile", label: "Profile", path: "/app/profile", icon: UserRound },
] as const satisfies ReadonlyArray<{
  key: MobileTabKey
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
}>

function getTabFromPath(pathname: string): MobileTabKey {
  if (pathname.startsWith("/app/search")) {
    return "search"
  }

  if (pathname.startsWith("/app/orders")) {
    return "orders"
  }

  if (pathname.startsWith("/app/profile")) {
    return "profile"
  }

  return "home"
}

export default function BottomTabs() {
  const location = useLocation()
  const dispatch = useAppDispatch()
  const activeMobileTab = useAppSelector((state) => state.ui.activeMobileTab)

  useEffect(() => {
    dispatch(setActiveMobileTab(getTabFromPath(location.pathname)))
  }, [dispatch, location.pathname])

  return (
    <nav
      aria-label="Mobile tab navigation"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-40 mx-auto w-[calc(100%-1.5rem)] max-w-[448px]"
    >
      <div className="pointer-events-auto grid grid-cols-4 rounded-[28px] border border-border/70 bg-background/95 p-2 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.55)] backdrop-blur-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon

          return (
            <NavLink
              key={tab.key}
              to={tab.path}
              className={({ isActive }) =>
                cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl text-[0.7rem] font-medium text-muted-foreground transition-all duration-200",
                  (isActive || activeMobileTab === tab.key) &&
                    "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                )
              }
              onClick={() => dispatch(setActiveMobileTab(tab.key))}
            >
              <Icon className="size-5" />
              <span>{tab.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}