import { Navigate, Outlet, redirect } from "react-router"

import { isMobileAuthenticated, isAdminAuthenticated } from "~/utils/auth"

export const mobileProtectedLoader = () => {
  if (!isMobileAuthenticated()) {
    throw redirect("/mobile/login")
  }

  return null
}

export function MobileProtectedRoute() {
  if (!isMobileAuthenticated()) {
    return <Navigate to="/mobile/login" replace />
  }

  return <Outlet />
}

export const adminProtectedLoader = () => {
  if (!isAdminAuthenticated()) {
    throw redirect("/admin/login")
  }

  return null
}

export function AdminProtectedRoute() {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin/login" replace />
  }

  return <Outlet />
}
