import {
  ClipboardList,
  LayoutDashboard,
  MapPinned,
  Truck,
  UserSquare2,
} from "lucide-react"
import { NavLink, useLocation } from "react-router"
import { useEffect } from "react"

import { useAppDispatch, useAppSelector } from "~/app/hooks"
import { cn } from "~/lib/utils"
import { setActiveMobileTab, type MobileTabKey } from "~/features/ui/uiSlice"

const tabs = [
  {
    key: "dashboard",
    label: "Dashboard",
    path: "/app/dashboard",
    icon: LayoutDashboard,
  },
  { key: "sites", label: "Sites", path: "/app/sites", icon: MapPinned },
  {
    key: "vehicles",
    label: "Vehicles",
    path: "/app/vehicles",
    icon: Truck,
  },
  {
    key: "drivers",
    label: "Drivers",
    path: "/app/drivers",
    icon: UserSquare2,
  },
  {
    key: "assignments",
    label: "Assignments",
    path: "/app/assignments",
    icon: ClipboardList,
  },
] as const satisfies ReadonlyArray<{
  key: MobileTabKey
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
}>

function getTabFromPath(pathname: string): MobileTabKey {
  if (pathname.startsWith("/app/sites")) {
    return "sites"
  }

  if (pathname.startsWith("/app/vehicles")) {
    return "vehicles"
  }

  if (pathname.startsWith("/app/drivers")) {
    return "drivers"
  }

  if (pathname.startsWith("/app/assignments")) {
    return "assignments"
  }

  return "dashboard"
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
      <div className="pointer-events-auto grid grid-cols-5 rounded-[28px] border border-border/70 bg-background/95 p-2 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.55)] backdrop-blur-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon

          return (
            <NavLink
              key={tab.key}
              to={tab.path}
              className={({ isActive }) =>
                cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[0.62rem] font-medium text-muted-foreground transition-all duration-200",
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
