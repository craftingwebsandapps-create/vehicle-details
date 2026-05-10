import type { MobileLoginResponse } from "~/features/auth/types"

export const ADMIN_HOME_PATH = "/admin/dashboard"
export const MOBILE_HOME_PATH = "/mobile/dashboard"

/** Superadmin / platform: `contractorId` null → admin shell; tenant → mobile shell. */
export function routeAfterLogin(
  data: Pick<MobileLoginResponse, "contractorId">
): string {
  const id = data.contractorId
  if (id == null || (typeof id === "string" && id.trim() === "")) {
    return ADMIN_HOME_PATH
  }
  return MOBILE_HOME_PATH
}
