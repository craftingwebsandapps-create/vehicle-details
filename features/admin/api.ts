import { getAccessToken } from "~/features/auth/auth-storage"
import { apiClient } from "~/services/api-client"
import { mapPlatformVehiclePayload } from "~/features/admin/vi-normalize"
import type {
  ContractorsListResponse,
  ListContractorsParams,
  ListPlatformVehiclesParams,
  PlatformVehiclesListResponse,
  ViPaginatedMeta,
} from "~/types/vi-platform"
import type { Vehicle } from "~/types/vehicle"

const ADMIN_API_PREFIX = "/admin"

type BaseResponse<T = unknown> = {
  success: boolean
  message?: string
  data?: T
}

const getAuthToken = () => {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error("Access token is required")
  }
  return accessToken
}

/** GET /api/contractors — superadmin sees all tenants; tenant JWT scoped to own contractor. */
export const listContractors = async (
  params?: ListContractorsParams
): Promise<ContractorsListResponse> => {
  const token = getAuthToken()
  const query = new URLSearchParams()
  if (params?.page) query.set("page", String(params.page))
  if (params?.limit) query.set("limit", String(params.limit))
  if (params?.search) query.set("search", params.search)

  const qs = query.toString()
  const url = qs ? `/contractors?${qs}` : "/contractors"

  const response = await apiClient.getWithAuth<ContractorsListResponse>(
    url,
    token
  )

  if (!response.success) {
    throw new Error("Unable to fetch contractors")
  }

  return response
}

/** GET /api/vehicles — enriched rows. Omit `contractor` for superadmin to list all tenants (backend permitting). */
export const listPlatformVehicles = async (
  params?: ListPlatformVehiclesParams
): Promise<{ items: Vehicle[]; meta: ViPaginatedMeta }> => {
  const token = getAuthToken()
  const query = new URLSearchParams()
  if (params?.page) query.set("page", String(params.page))
  if (params?.limit) query.set("limit", String(params.limit))
  if (params?.search) query.set("search", params.search)
  if (params?.contractor?.trim()) {
    query.set("contractor", params.contractor.trim())
  }
  if (params?.site) query.set("site", params.site)

  const qs = query.toString()
  const url = qs ? `/vehicles?${qs}` : "/vehicles"

  const response =
    await apiClient.getWithAuth<PlatformVehiclesListResponse>(url, token)

  if (!response.success) {
    throw new Error("Unable to fetch vehicles")
  }

  const items = response.data.items.map((row) =>
    mapPlatformVehiclePayload(row)
  )

  return { items, meta: response.data.meta }
}

export const approveVehicle = async (vehicleId: string) => {
  const token = getAuthToken()
  const response = await apiClient.postWithAuth<BaseResponse>(
    `${ADMIN_API_PREFIX}/vehicles/${vehicleId}/approve`,
    {},
    token
  )

  if (!response.success) {
    throw new Error(response.message || "Failed to approve vehicle")
  }
  return response.data
}

export const rejectVehicle = async (vehicleId: string, note?: string) => {
  const token = getAuthToken()
  const body = note ? { note } : {}
  const response = await apiClient.postWithAuth<BaseResponse>(
    `${ADMIN_API_PREFIX}/vehicles/${vehicleId}/reject`,
    body,
    token
  )

  if (!response.success) {
    throw new Error(response.message || "Failed to reject vehicle")
  }
  return response.data
}

export const approveSite = async (siteId: string) => {
  const token = getAuthToken()
  const response = await apiClient.postWithAuth<BaseResponse>(
    `${ADMIN_API_PREFIX}/sites/${siteId}/approve`,
    {},
    token
  )

  if (!response.success) {
    throw new Error(response.message || "Failed to approve site")
  }
  return response.data
}

export const rejectSite = async (siteId: string, note?: string) => {
  const token = getAuthToken()
  const body = note ? { note } : {}
  const response = await apiClient.postWithAuth<BaseResponse>(
    `${ADMIN_API_PREFIX}/sites/${siteId}/reject`,
    body,
    token
  )

  if (!response.success) {
    throw new Error(response.message || "Failed to reject site")
  }
  return response.data
}

export const approveDriver = async (driverId: string) => {
  const token = getAuthToken()
  const response = await apiClient.postWithAuth<BaseResponse>(
    `${ADMIN_API_PREFIX}/drivers/${driverId}/approve`,
    {},
    token
  )

  if (!response.success) {
    throw new Error(response.message || "Failed to approve driver")
  }
  return response.data
}

export const rejectDriver = async (driverId: string, note?: string) => {
  const token = getAuthToken()
  const body = note ? { note } : {}
  const response = await apiClient.postWithAuth<BaseResponse>(
    `${ADMIN_API_PREFIX}/drivers/${driverId}/reject`,
    body,
    token
  )

  if (!response.success) {
    throw new Error(response.message || "Failed to reject driver")
  }
  return response.data
}
