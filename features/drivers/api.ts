import { getAccessToken } from "~/features/auth/auth-storage"
import { apiClient } from "~/services/api-client"
import { API_BASE_URL } from "~/utils/constants"

import type {
  CreateDriverRequest,
  Driver,
  DriverApiEntity,
  DriverListResponse,
  DriverMeta,
  UpdateDriverRequest,
  UploadSingleFileResponse,
} from "~/types/driver"

type DriverApiResponse = {
  success: boolean
  message: string
  data?: DriverApiEntity
}

const CONTRACTOR_V1_PREFIX = "/v1/contractor"

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
  status: entity.status,
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
    `${CONTRACTOR_V1_PREFIX}/drivers/available?${query.toString()}`,
    accessToken
  )

  if (!response.success) {
    throw new Error(response.message || "Unable to fetch available drivers")
  }

  if (Array.isArray(response.data)) {
    return { items: response.data.map(toDriver), hasMore: false }
  }

  const paginated = response.data as {
    data: DriverApiEntity[]
    meta?: { hasNextPage?: boolean }
  }
  return {
    items: paginated.data.map(toDriver),
    hasMore: paginated.meta?.hasNextPage ?? false,
  }
}

export const listDrivers = async (
  params: {
    page?: number
    limit?: number
    search?: string
    name?: string
    licenceNumber?: string
    mobileNumber?: string
    status?: string
  } = {}
) => {
  const accessToken = getAuthToken()
  const query = new URLSearchParams()

  query.set("page", String(params.page ?? 1))
  query.set("limit", String(params.limit ?? 10))
  if (params.search) query.set("search", params.search)
  if (params.name) query.set("name", params.name)
  if (params.licenceNumber) query.set("licenceNumber", params.licenceNumber)
  if (params.mobileNumber) query.set("mobileNumber", params.mobileNumber)
  if (params.status) query.set("status", params.status)

  const response = await apiClient.getWithAuth<DriverListResponse>(
    `${CONTRACTOR_V1_PREFIX}/drivers?${query.toString()}`,
    accessToken
  )

  if (!response.success) {
    throw new Error(response.message || "Unable to fetch drivers")
  }

  return {
    items: response.data.data.map(toDriver),
    meta: response.data.meta as DriverMeta,
  }
}

export const createDriver = async (
  payload: CreateDriverRequest
): Promise<Driver> => {
  const accessToken = getAuthToken()

  const response = await apiClient.post<DriverApiResponse>(
    `${CONTRACTOR_V1_PREFIX}/drivers`,
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

  return toDriver(response.data)
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
    `${CONTRACTOR_V1_PREFIX}/drivers/${driverId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.success || !response.data) {
    throw new Error(response.message || "Unable to update driver")
  }

  return toDriver(response.data)
}

export const uploadDriverLicence = async (file: File): Promise<string> => {
  const accessToken = getAuthToken()

  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch(`${API_BASE_URL}/upload/single`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`)
  }

  const data = (await response.json()) as UploadSingleFileResponse

  if (!data.success || !data.data?.url) {
    throw new Error(data.message || "Unable to upload licence")
  }

  return data.data.url
}
