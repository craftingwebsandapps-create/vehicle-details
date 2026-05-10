import { lazy, Suspense } from "react"
import type { RouteObject } from "react-router"

import AdminLayout from "~/layouts/AdminLayout"
import { PageLoader } from "~/components/ui/PageLoader"

const AdminDashboard = lazy(() => import("~/pages/admin/AdminDashboard"))

const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
)

export const adminRoutes: RouteObject[] = [
  {
    path: "admin",
    Component: AdminLayout,
    children: [
      { index: true, element: withSuspense(AdminDashboard) },
      { path: "dashboard", element: withSuspense(AdminDashboard) },
    ],
  },
]
