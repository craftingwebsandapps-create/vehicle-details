import { lazy, Suspense } from "react"
import type { RouteObject } from "react-router"

import AdminLayout from "~/layouts/AdminLayout"
import AdminAuthLayout from "~/layouts/AdminAuthLayout"
import { PageLoader } from "~/components/ui/PageLoader"
import { adminProtectedLoader } from "~/routes/protected-route"

const AdminDashboard = lazy(() => import("~/pages/admin/AdminDashboard"))
const AdminLogin = lazy(() => import("~/pages/admin/AdminLogin"))
const AdminVehicles = lazy(() => import("~/pages/admin/AdminVehicles"))

const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
)

export const adminRoutes: RouteObject[] = [
  {
    path: "admin/login",
    Component: AdminAuthLayout,
    children: [{ index: true, element: withSuspense(AdminLogin) }],
  },
  {
    path: "admin",
    loader: adminProtectedLoader,
    Component: AdminLayout,
    children: [
      { index: true, element: withSuspense(AdminDashboard) },
      { path: "dashboard", element: withSuspense(AdminDashboard) },
      { path: "vehicles", element: withSuspense(AdminVehicles) },
    ],
  },
]
