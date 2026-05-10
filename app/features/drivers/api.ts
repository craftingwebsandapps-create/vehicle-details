import {
  normalizeApprovalStatus,
  normalizeOperationalStatus,
} from "~/features/admin/vi-normalize"
import { getAccessToken } from "~/features/auth/auth-storage"
import { uploadAuthenticatedFile } from "~/features/files/api"
import { apiClient } from "~/services/api-client"

import type {
  ApprovalStatus,
  CreateDriverRequest,
  Driver,
  DriverApiEntity,
  DriverListResponse,
  ListDriversParams,
  DriverMeta,
  UpdateDriverRequest,
} from "~/types/driver"

type DriverApiResponse = {
  success: boolean
  message: string
  data?:
    | DriverApiEntity
    | {
        driver?: DriverApiEntity
        approvalRequest?: unknown
      }
}

const DRIVER_LIST_SEARCH_MAX = 200

const getAuthToken = () => {
  const accessToken = getAccessToken()

  if (!accessToken) {
    throw new Error("Access token is required")
  }

  return accessToken
}

const normalizeEntityRef = <T extends { _id: string; name: string }>(
  value: string | T | undefined
) => {
  if (!value || typeof value === "string") {
    return undefined
  }

  return {
    id: value._id,
    name: value.name,
    raw: value,
  }
}

export const toDriver = (entity: DriverApiEntity): Driver => ({
  id: entity.id ?? entity._id ?? "",
  name: entity.name,
  licenceNumber: entity.licenceNumber,
  mobileNumber: entity.mobileNumber,
  status: entity.status ?? "ACTIVE",
  approvalStatus: entity.approvalStatus as ApprovalStatus | undefined,
  approvalNote: entity.approvalNote,
  approvedAt: entity.approvedAt,
  rejectedAt: entity.rejectedAt,
  deletedAt: entity.deletedAt,
  licenceUrl: entity.licenceUrl,
  contractor: (() => {
    const contractorRef = normalizeEntityRef(entity.contractor)

    if (!contractorRef) {
      return undefined
    }

    return {
      id: contractorRef.id,
      name: contractorRef.name,
    }
  })(),
  site: (() => {
    const siteRef = normalizeEntityRef(entity.site)

    if (!siteRef) {
      return undefined
    }

    return {
      id: siteRef.id,
      name: siteRef.name,
      location: (siteRef.raw as { location?: string }).location,
    }
  })(),
  vehicle: (() => {
    const vehicleRef = normalizeEntityRef(entity.vehicle)

    if (!vehicleRef) {
      return undefined
    }

    return {
      id: vehicleRef.id,
      name: vehicleRef.name,
      registrationNumber: (vehicleRef.raw as { registrationNumber?: string })
        .registrationNumber,
    }
  })(),
  createdAt: entity.createdAt,
  updatedAt: entity.updatedAt,
})

function mapDriverPayload(entity: DriverApiEntity): Driver {
  const approvalNormalized = normalizeApprovalStatus(entity.approvalStatus)
  const prepared: DriverApiEntity = {
    ...entity,
    status: normalizeOperationalStatus(entity.status),
    ...(approvalNormalized !== undefined
      ? { approvalStatus: approvalNormalized }
      : {}),
  }
  return toDriver(prepared)
}

type SimpleDriverListResponse = {
  success: boolean
  message: string
  data:
    | DriverApiEntity[]
    | { data: DriverApiEntity[]; meta?: { hasNextPage?: boolean } }
}

export const listAvailableDrivers = async (params?: {
  page?: number
  limit?: number
  search?: string
}): Promise<{ items: Driver[]; hasMore: boolean }> => {
  const accessToken = getAuthToken()
  const query = new URLSearchParams()
  query.set("page", String(params?.page ?? 1))
  query.set("limit", String(params?.limit ?? 10))
  if (params?.search) query.set("search", params.search)

  const response = await apiClient.getWithAuth<SimpleDriverListResponse>(
    `/drivers/available?${query.toString()}`,
    accessToken
  )

  if (!response.success) {
    throw new Error(response.message || "Unable to fetch available drivers")
  }

  if (Array.isArray(response.data)) {
    return {
      items: response.data.map(mapDriverPayload),
      hasMore: false,
    }
  }

  const paginated = response.data as {
    data: DriverApiEntity[]
    meta?: { hasNextPage?: boolean }
  }
  return {
    items: paginated.data.map(mapDriverPayload),
    hasMore: paginated.meta?.hasNextPage ?? false,
  }
}

export const listDrivers = async (params: ListDriversParams = {}) => {
  const accessToken = getAuthToken()
  const query = new URLSearchParams()

  query.set("page", String(params.page ?? 1))
  query.set("limit", String(params.limit ?? 10))
  const searchTrimmed = params.search?.trim()
  if (searchTrimmed) {
    query.set("search", searchTrimmed.slice(0, DRIVER_LIST_SEARCH_MAX))
  }
  if (params.name) query.set("name", params.name)
  if (params.licenceNumber) query.set("licenceNumber", params.licenceNumber)
  if (params.mobileNumber) query.set("mobileNumber", params.mobileNumber)
  if (params.status) query.set("status", params.status)
  if (params.approvalStatus) {
    query.set("approvalStatus", params.approvalStatus)
  }

  const response = await apiClient.getWithAuth<DriverListResponse>(
    `/drivers?${query.toString()}`,
    accessToken
  )

  if (!response.success || !response.data?.meta) {
    throw new Error(response.message || "Unable to fetch drivers")
  }

  const rawItems = Array.isArray(response.data.items)
    ? response.data.items
    : Array.isArray(response.data.data)
      ? response.data.data
      : []

  const meta = response.data.meta
  const hasNextPage = meta.hasNextPage ?? meta.page < meta.totalPages

  return {
    items: rawItems.map((row) => mapDriverPayload(row)),
    meta: {
      ...meta,
      hasNextPage,
      hasPrevPage: meta.hasPrevPage ?? meta.page > 1,
    } satisfies DriverMeta,
  }
}

export const createDriver = async (
  payload: CreateDriverRequest
): Promise<Driver> => {
  const accessToken = getAuthToken()

  const response = await apiClient.post<DriverApiResponse>(
    `/drivers`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.success || !response.data) {
    throw new Error(response.message || "Unable to create driver")
  }

  const entity =
    "driver" in response.data
      ? response.data.driver
      : (response.data as DriverApiEntity)

  if (!entity) {
    throw new Error(response.message || "Unable to create driver")
  }

  return mapDriverPayload(entity)
}

export const updateDriver = async (
  driverId: string,
  payload: UpdateDriverRequest
): Promise<Driver> => {
  const accessToken = getAuthToken()

  if (!driverId) {
    throw new Error("Driver id is required")
  }

  const response = await apiClient.request<DriverApiResponse>(
    `/drivers/${driverId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.success || !response.data) {
    throw new Error(response.message || "Unable to update driver")
  }

  const entity =
    "driver" in response.data
      ? response.data.driver
      : (response.data as DriverApiEntity)

  if (entity && entity.name) {
    return mapDriverPayload(entity)
  }

  const latest = await apiClient.getWithAuth<{
    success: boolean
    data?: DriverApiEntity
  }>(`/drivers/${driverId}`, accessToken)

  if (!latest.success || !latest.data) {
    throw new Error(response.message || "Unable to update driver")
  }

  return mapDriverPayload(latest.data)
}

export const uploadDriverLicence = async (file: File): Promise<string> => {
  const { url } = await uploadAuthenticatedFile(file)
  return url
}
