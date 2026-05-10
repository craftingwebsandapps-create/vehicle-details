import {
  ClipboardList,
  LayoutDashboard,
  MapPinned,
  Truck,
  UserSquare2,
} from "lucide-react"

const rawApiUrl =
  import.meta.env.VITE_API_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  "https://vi-backend.theamaravaticity.com/api"

/** Base URL for `/auth/*`, `/contractors`, etc. (no trailing slash). */
export const API_BASE_URL = rawApiUrl.replace(/\/+$/, "")

export const QUERY_KEYS = {
  vehicles: ["mobile", "vehicles"] as const,
}

export const MOBILE_TABS = [
  {
    key: "dashboard",
    label: "Dashboard",
    path: "/mobile/dashboard",
    icon: LayoutDashboard,
  },
  {
    key: "sites",
    label: "Sites",
    path: "/mobile/sites",
    icon: MapPinned,
  },
  {
    key: "vehicles",
    label: "Vehicles",
    path: "/mobile/vehicles",
    icon: Truck,
  },
  {
    key: "drivers",
    label: "Drivers",
    path: "/mobile/drivers",
    icon: UserSquare2,
  },
  {
    key: "assignments",
    label: "Assignments",
    path: "/mobile/assignments",
    icon: ClipboardList,
  },
] as const
