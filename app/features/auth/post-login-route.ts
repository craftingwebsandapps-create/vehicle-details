import type { MobileLoginResponse } from "~/features/auth/types"

export const ADMIN_HOME_PATH = "/admin/dashboard"
export const MOBILE_HOME_PATH = "/mobile/dashboard"

/** Tenant session when API/JWT has a non-empty contractor id. */
export function isTenantContractorId(
  contractorId: string | null | undefined
): boolean {
  if (contractorId == null) return false
  return !(typeof contractorId === "string" && contractorId.trim() === "")
}

/** Superadmin / platform: no tenant id → admin shell; tenant → mobile shell. */
export function routeAfterLogin(
  data: Pick<MobileLoginResponse, "contractorId">
): string {
  return isTenantContractorId(data.contractorId)
    ? MOBILE_HOME_PATH
    : ADMIN_HOME_PATH
}
