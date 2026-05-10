import { mapPlatformVehiclePayload } from "~/features/admin/vi-normalize"
import { getAccessToken } from "~/features/auth/auth-storage"
import { apiClient } from "~/services/api-client"
import { API_BASE_URL } from "~/utils/constants"
import type {
  CreateVehicleRequest,
  ListVehiclesParams,
  UpdateVehicleRequest,
  UploadSingleFileResponse,
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

const CONTRACTOR_V1_PREFIX = "/v1/contractor"

function toVehicleApprovalQuery(
  v: ListVehiclesParams["approvalStatus"]
): string | undefined {
  if (v === undefined) return undefined
  if (typeof v !== "string") return undefined
  const lower = v.toLowerCase()
  if (lower === "pending" || lower === "approved" || lower === "rejected") {
    return lower
  }
  if (v === "PENDING_APPROVAL") return "pending"
  if (v === "APPROVED") return "approved"
  if (v === "REJECTED") return "rejected"
  return undefined
}

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
    `${CONTRACTOR_V1_PREFIX}/vehicles/available?${query.toString()}`,
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
  params?: ListVehiclesParams
): Promise<VehicleListResponse> => {
  const token = getAuthToken()
  const query = new URLSearchParams()
  if (params?.page) query.set("page", String(params.page))
  if (params?.limit) query.set("limit", String(params.limit))
  if (params?.search?.trim()) query.set("search", params.search.trim())
  if (params?.name?.trim()) query.set("name", params.name.trim())
  if (params?.site?.trim()) query.set("site", params.site.trim())
  if (params?.type?.trim()) query.set("type", params.type.trim())
  if (params?.registrationNumber?.trim()) {
    query.set("registrationNumber", params.registrationNumber.trim())
  }
  if (params?.status) query.set("status", params.status)
  const approvalQs = toVehicleApprovalQuery(params?.approvalStatus)
  if (approvalQs) query.set("approvalStatus", approvalQs)

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
    `${CONTRACTOR_V1_PREFIX}/vehicles`,
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
    `${CONTRACTOR_V1_PREFIX}/vehicles/${id}`,
    {
      method: "PUT",
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
  }>(`${CONTRACTOR_V1_PREFIX}/vehicles/${id}`, accessToken)

  if (!latest.success || !latest.data) {
    throw new Error(response.message || "Unable to update vehicle")
  }

  return latest.data
}

export const uploadVehicleDocument = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append("file", file)

  const token = getAuthToken()
  const response = await fetch(`${API_BASE_URL}/upload/single`, {
    method: "POST",
    body: formData,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error("Unable to upload vehicle document")
  }

  const data = (await response.json()) as UploadSingleFileResponse
  if (!data.success) {
    throw new Error(data.message || "Unable to upload vehicle document")
  }

  return data.data?.url || ""
}
