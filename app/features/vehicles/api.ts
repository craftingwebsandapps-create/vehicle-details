import { mapPlatformVehiclePayload } from "~/features/admin/vi-normalize"
import { getAccessToken } from "~/features/auth/auth-storage"
import { apiClient } from "~/services/api-client"
import { uploadAuthenticatedFile } from "~/features/files/api"
import type {
  CreateVehicleRequest,
  ListVehiclesParams,
  UpdateVehicleRequest,
  Vehicle,
  VehicleListResponse,
} from "~/types/vehicle"

type VehicleApiResponse = {
  success: boolean
  message: string
  data?:
    | Vehicle
    | {
        vehicle?: Vehicle
        approvalRequest?: unknown
      }
}

const VEHICLE_LIST_SEARCH_MAX = 200

const getAuthToken = () => {
  const accessToken = getAccessToken()

  if (!accessToken) {
    throw new Error("Access token is required")
  }

  return accessToken
}

type SimpleVehicleListResponse = {
  success: boolean
  message: string
  data: Vehicle[] | { data: Vehicle[]; meta?: { hasNextPage?: boolean } }
}

export const listAvailableVehicles = async (params?: {
  page?: number
  limit?: number
  search?: string
}): Promise<{ items: Vehicle[]; hasMore: boolean }> => {
  const token = getAuthToken()
  const query = new URLSearchParams()
  query.set("page", String(params?.page ?? 1))
  query.set("limit", String(params?.limit ?? 10))
  if (params?.search) query.set("search", params.search)

  const response = await apiClient.getWithAuth<SimpleVehicleListResponse>(
    `/vehicles/available?${query.toString()}`,
    token
  )

  if (!response.success) {
    throw new Error(response.message || "Unable to fetch available vehicles")
  }

  if (Array.isArray(response.data)) {
    return { items: response.data, hasMore: false }
  }

  const paginated = response.data as {
    data: Vehicle[]
    meta?: { hasNextPage?: boolean }
  }
  return {
    items: paginated.data,
    hasMore: paginated.meta?.hasNextPage ?? false,
  }
}

type VehiclesListApiEnvelope = {
  success: boolean
  message?: string
  data?: {
    items?: unknown[]
    data?: unknown[]
    meta?: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNextPage?: boolean
      hasPrevPage?: boolean
    }
  }
  error?: { message?: string; code?: string }
}

export const listVehicles = async (
  params: ListVehiclesParams
): Promise<VehicleListResponse> => {
  const token = getAuthToken()
  const query = new URLSearchParams()
  if (params.approvalStatus) {
    query.set("approvalStatus", params.approvalStatus)
  }
  if (params.page !== undefined) {
    query.set("page", String(Math.max(1, Math.floor(params.page))))
  }
  if (params.limit !== undefined) {
    query.set(
      "limit",
      String(Math.min(100, Math.max(1, Math.floor(params.limit))))
    )
  }
  const searchTrimmed = params.search?.trim()
  if (searchTrimmed) {
    query.set(
      "search",
      searchTrimmed.slice(0, VEHICLE_LIST_SEARCH_MAX)
    )
  }
  const siteId = params.site?.trim()
  if (siteId) query.set("site", siteId)

  const queryString = query.toString()
  const url = queryString ? `/vehicles?${queryString}` : "/vehicles"

  const response = await apiClient.getWithAuth<VehiclesListApiEnvelope>(
    url,
    token
  )

  if (!response.success || !response.data?.meta) {
    throw new Error(response.error?.message || "Unable to fetch vehicles")
  }

  const rawItems = Array.isArray(response.data.items)
    ? response.data.items
    : Array.isArray(response.data.data)
      ? response.data.data
      : []

  const items = rawItems.map((row) =>
    mapPlatformVehiclePayload(row as Record<string, unknown>)
  )

  const { meta } = response.data
  const hasNextPage =
    meta.hasNextPage ?? meta.page < meta.totalPages

  return {
    success: true,
    message: response.message,
    data: {
      items,
      meta: {
        ...meta,
        hasNextPage,
        hasPrevPage: meta.hasPrevPage ?? meta.page > 1,
      },
    },
  }
}

export const createVehicle = async (
  payload: CreateVehicleRequest
): Promise<Vehicle> => {
  const accessToken = getAuthToken()

  const response = await apiClient.post<VehicleApiResponse>(
    `/vehicles`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.success || !response.data) {
    throw new Error(response.message || "Unable to create vehicle")
  }

  const entity =
    "vehicle" in response.data
      ? response.data.vehicle
      : (response.data as Vehicle)

  if (!entity) {
    throw new Error(response.message || "Unable to create vehicle")
  }

  return entity
}

export const updateVehicle = async (
  id: string,
  payload: UpdateVehicleRequest
): Promise<Vehicle> => {
  const accessToken = getAuthToken()

  if (!id) {
    throw new Error("Vehicle id is required")
  }

  const response = await apiClient.request<VehicleApiResponse>(
    `/vehicles/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.success || !response.data) {
    throw new Error(response.message || "Unable to update vehicle")
  }

  const entity =
    "vehicle" in response.data
      ? response.data.vehicle
      : (response.data as Vehicle)

  if (entity && entity._id) {
    return entity
  }

  // Some update responses only return approvalRequest. Fetch latest entity.
  const latest = await apiClient.getWithAuth<{
    success: boolean
    data?: Vehicle
  }>(`/vehicles/${id}`, accessToken)

  if (!latest.success || !latest.data) {
    throw new Error(response.message || "Unable to update vehicle")
  }

  return latest.data
}

export const uploadVehicleDocument = async (file: File): Promise<string> => {
  const { url } = await uploadAuthenticatedFile(file)
  return url
}
