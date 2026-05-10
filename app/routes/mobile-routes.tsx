import { lazy, Suspense } from "react"
import type { RouteObject } from "react-router"

import MobileAuthLayout from "~/layouts/MobileAuthLayout"
import MobileProtectedLayout from "~/layouts/MobileProtectedLayout"
import { PageLoader } from "~/components/ui/PageLoader"
import { mobileProtectedLoader } from "~/routes/protected-route"

const Assignments = lazy(() => import("~/pages/mobile/Assignments"))
const Dashboard = lazy(() => import("~/pages/mobile/Dashboard"))
const Organization = lazy(() => import("~/pages/mobile/Organization"))
const Drivers = lazy(() => import("~/pages/mobile/Drivers"))
const FormSystemDemo = lazy(() => import("~/pages/mobile/FormSystemDemo"))
const Login = lazy(() => import("~/pages/mobile/Login"))
const Sites = lazy(() => import("~/pages/mobile/Sites"))
const Vehicles = lazy(() => import("~/pages/mobile/Vehicles"))

const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
)

export const mobileRoutes: RouteObject[] = [
  {
    path: "mobile/login",
    Component: MobileAuthLayout,
    children: [{ index: true, element: withSuspense(Login) }],
  },
  {
    path: "mobile",
    loader: mobileProtectedLoader,
    Component: MobileProtectedLayout,
    children: [
      { path: "dashboard", element: withSuspense(Dashboard) },
      { path: "sites", element: withSuspense(Sites) },
      { path: "vehicles", element: withSuspense(Vehicles) },
      { path: "drivers", element: withSuspense(Drivers) },
      { path: "organization", element: withSuspense(Organization) },
      { path: "assignments", element: withSuspense(Assignments) },
      { path: "forms", element: withSuspense(FormSystemDemo) },
    ],
  },
]
