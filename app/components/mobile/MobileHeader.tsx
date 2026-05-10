import {
  Building2,
  ClipboardList,
  LayoutDashboard,
  MapPinned,
  Sparkles,
  Truck,
  UserSquare2,
  LogOut,
} from "lucide-react"
import { useLocation, useNavigate } from "react-router"
import { useAppDispatch } from "~/hooks"
import { signOut } from "~/features/auth/authSlice"

type MobileHeaderProps = {
  title?: string
}

export default function MobileHeader({
  title = "Vehicle Information",
}: MobileHeaderProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const handleLogout = () => {
    dispatch(signOut())
    navigate("/mobile/login", { replace: true })
  }

  const headerAction = (() => {
    if (pathname.startsWith("/mobile/sites")) {
      return { label: "Sites", Icon: MapPinned }
    }

    if (pathname.startsWith("/mobile/vehicles")) {
      return { label: "Vehicles", Icon: Truck }
    }

    if (pathname.startsWith("/mobile/drivers")) {
      return { label: "Drivers", Icon: UserSquare2 }
    }

    if (pathname.startsWith("/mobile/assignments")) {
      return { label: "Tasks", Icon: ClipboardList }
    }

    if (pathname.startsWith("/mobile/dashboard")) {
      return { label: "Live", Icon: LayoutDashboard }
    }

    if (pathname.startsWith("/mobile/organization")) {
      return { label: "Org", Icon: Building2 }
    }

    return { label: "Synced", Icon: Sparkles }
  })()

  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/95 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center">
          <img src="/logo.png" alt={title} className="h-9 w-auto" />
          <span className="sr-only">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <headerAction.Icon className="size-3.5" />
            {headerAction.label}
          </span>
          <button
            onClick={handleLogout}
            className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground active:scale-95"
            aria-label="Log out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
