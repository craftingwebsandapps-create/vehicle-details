import { Navigate, Outlet, redirect } from "react-router"

import {
  ADMIN_HOME_PATH,
  MOBILE_HOME_PATH,
  isTenantContractorId,
} from "~/features/auth/post-login-route"
import { getAccessToken } from "~/features/auth/auth-storage"
import { getContractorIdFromAccessToken } from "~/features/auth/jwt-utils"

function contractorIdFromAccessToken(): string | null {
  return getContractorIdFromAccessToken(getAccessToken())
}

export const mobileProtectedLoader = () => {
  if (!getAccessToken()) {
    throw redirect("/mobile/login")
  }
  if (!isTenantContractorId(contractorIdFromAccessToken())) {
    throw redirect(ADMIN_HOME_PATH)
  }

  return null
}

export function MobileProtectedRoute() {
  if (!getAccessToken()) {
    return <Navigate to="/mobile/login" replace />
  }
  if (!isTenantContractorId(contractorIdFromAccessToken())) {
    return <Navigate to={ADMIN_HOME_PATH} replace />
  }

  return <Outlet />
}

export const adminProtectedLoader = () => {
  if (!getAccessToken()) {
    throw redirect("/admin/login")
  }
  if (isTenantContractorId(contractorIdFromAccessToken())) {
    throw redirect(MOBILE_HOME_PATH)
  }

  return null
}

export function AdminProtectedRoute() {
  if (!getAccessToken()) {
    return <Navigate to="/admin/login" replace />
  }
  if (isTenantContractorId(contractorIdFromAccessToken())) {
    return <Navigate to={MOBILE_HOME_PATH} replace />
  }

  return <Outlet />
}
