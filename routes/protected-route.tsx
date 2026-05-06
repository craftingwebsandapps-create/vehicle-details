import { Navigate, Outlet, redirect } from "react-router"

import { isMobileAuthenticated } from "~/utils/auth"

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
