import type { RouteObject } from "react-router"

import MobileAuthLayout from "~/layouts/MobileAuthLayout"
import MobileProtectedLayout from "~/layouts/MobileProtectedLayout"
import Assignments from "~/pages/mobile/Assignments"
import Dashboard from "~/pages/mobile/Dashboard"
import Drivers from "~/pages/mobile/Drivers"
import Login from "~/pages/mobile/Login"
import Sites from "~/pages/mobile/Sites"
import Vehicles from "~/pages/mobile/Vehicles"

import { mobileProtectedLoader } from "~/routes/protected-route"

export const mobileRoutes: RouteObject[] = [
  {
    path: "mobile/login",
    Component: MobileAuthLayout,
    children: [{ index: true, Component: Login }],
  },
  {
    path: "mobile",
    loader: mobileProtectedLoader,
    Component: MobileProtectedLayout,
    children: [
      { path: "dashboard", Component: Dashboard },
      { path: "sites", Component: Sites },
      { path: "vehicles", Component: Vehicles },
      { path: "drivers", Component: Drivers },
      { path: "assignments", Component: Assignments },
    ],
  },
]
