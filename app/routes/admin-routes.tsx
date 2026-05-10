import { lazy, Suspense } from "react"
import type { RouteObject } from "react-router"

import AdminLayout from "~/layouts/AdminLayout"
import AdminAuthLayout from "~/layouts/AdminAuthLayout"
import { PageLoader } from "~/components/ui/PageLoader"
import { adminProtectedLoader } from "~/routes/protected-route"

const AdminDashboard = lazy(() => import("~/pages/admin/AdminDashboard"))
const AdminLogin = lazy(() => import("~/pages/admin/AdminLogin"))
const AdminVehicles = lazy(() => import("~/pages/admin/AdminVehicles"))
const AdminDrivers = lazy(() => import("~/pages/admin/AdminDrivers"))
const AdminSites = lazy(() => import("~/pages/admin/AdminSites"))
const AdminContractors = lazy(() => import("~/pages/admin/AdminContractors"))
const AdminWorkTypes = lazy(() => import("~/pages/admin/AdminWorkTypes"))
const AdminUsers = lazy(() => import("~/pages/admin/AdminUsers"))
const AdminAuditLogs = lazy(() => import("~/pages/admin/AdminAuditLogs"))
const AdminVehicleQrTheme = lazy(() => import("~/pages/admin/AdminVehicleQrTheme"))

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
      { path: "contractors", element: withSuspense(AdminContractors) },
      { path: "work-types", element: withSuspense(AdminWorkTypes) },
      { path: "users", element: withSuspense(AdminUsers) },
      { path: "audit-logs", element: withSuspense(AdminAuditLogs) },
      { path: "vehicles", element: withSuspense(AdminVehicles) },
      {
        path: "vehicle-qr-theme",
        element: withSuspense(AdminVehicleQrTheme),
      },
      { path: "drivers", element: withSuspense(AdminDrivers) },
      { path: "sites", element: withSuspense(AdminSites) },
    ],
  },
]
