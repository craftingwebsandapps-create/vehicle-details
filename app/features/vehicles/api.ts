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
  VehicleQrQuery,
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
    return mapPlatformVehiclePayload(entity as unknown as Record<string, unknown>)
  }

  // Some update responses only return approvalRequest. Fetch latest entity.
  const latest = await apiClient.getWithAuth<{
    success: boolean
    data?: Vehicle | Record<string, unknown>
  }>(`/vehicles/${id}`, accessToken)

  if (!latest.success || !latest.data) {
    throw new Error(response.message || "Unable to update vehicle")
  }

  return mapPlatformVehiclePayload(latest.data as Record<string, unknown>)
}

/** PATCH `/vehicles/:id` — assign or clear driver only */
export const patchVehicleDriver = async (
  vehicleId: string,
  driverId: string | null
): Promise<Vehicle> =>
  updateVehicle(vehicleId, { driver: driverId })

export const uploadVehicleDocument = async (file: File): Promise<string> => {
  const { url } = await uploadAuthenticatedFile(file)
  return url
}

const parseContentDispositionFilename = (
  header: string | null
): string | undefined => {
  if (!header) return undefined
  const quoted = /filename\s*=\s*"([^"]+)"/i.exec(header)
  if (quoted?.[1]) return quoted[1]
  const plain = /filename\s*=\s*([^;\s]+)/i.exec(header)
  const raw = plain?.[1]
  if (!raw) return undefined
  return raw.replace(/^"|"$/g, "")
}

/**
 * GET `/vehicles/:id/qr` — PNG bytes (not JSON). Use blob URLs for `<img>` or
 * {@link triggerVehicleQrDownload} for save-as.
 */
export const fetchVehicleQrPng = async (
  vehicleId: string,
  query?: VehicleQrQuery,
  accessToken = getAuthToken()
): Promise<{ blob: Blob; filename?: string }> => {
  if (!vehicleId) {
    throw new Error("Vehicle id is required")
  }

  const params = new URLSearchParams()
  if (query?.download) {
    params.set("download", "true")
  }

  const qs = params.toString()
  const path = qs ? `/vehicles/${vehicleId}/qr?${qs}` : `/vehicles/${vehicleId}/qr`

  const { blob, headers } = await apiClient.getBlobWithAuth(path, accessToken)

  const cd = headers.get("Content-Disposition")

  return {
    blob,
    filename: parseContentDispositionFilename(cd),
  }
}

export const triggerVehicleQrDownload = (
  blob: Blob,
  fallbackFilename: string
): void => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = fallbackFilename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Convenience: `download=true` plus anchor click with server filename when available */
export const downloadVehicleQrPng = async (
  vehicleId: string,
  accessToken = getAuthToken()
): Promise<void> => {
  const { blob, filename } = await fetchVehicleQrPng(
    vehicleId,
    { download: true },
    accessToken
  )

  triggerVehicleQrDownload(blob, filename ?? `vehicle-qr-${vehicleId}.png`)
}

/** Object URL for `<img src={url} />` — call `revoke()` on unmount */
export const createVehicleQrObjectUrl = async (
  vehicleId: string,
  accessToken?: string
): Promise<{ url: string; revoke: () => void }> => {
  const token = accessToken ?? getAuthToken()
  const { blob } = await fetchVehicleQrPng(vehicleId, undefined, token)
  const url = URL.createObjectURL(blob)

  return {
    url,
    revoke: () => URL.revokeObjectURL(url),
  }
}
