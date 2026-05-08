import { getAccessToken } from "~/features/auth/auth-storage"
import { apiClient } from "~/services/api-client"
import { API_BASE_URL } from "~/utils/constants"
import type {
  CreateVehicleRequest,
  UpdateVehicleRequest,
  UploadSingleFileResponse,
  Vehicle,
  VehicleListResponse,
} from "~/types/vehicle"

type VehicleApiResponse = {
  success: boolean
  message: string
  data?: Vehicle
}

const CONTRACTOR_V1_PREFIX = "/v1/contractor"

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
  data: Vehicle[] | { data: Vehicle[] }
}

export const listAvailableVehicles = async (): Promise<Vehicle[]> => {
  const token = getAuthToken()

  const response = await apiClient.getWithAuth<SimpleVehicleListResponse>(
    `${CONTRACTOR_V1_PREFIX}/vehicles/available`,
    token
  )

  if (!response.success) {
    throw new Error(response.message || "Unable to fetch available vehicles")
  }

  const entities = Array.isArray(response.data)
    ? response.data
    : (response.data as { data: Vehicle[] }).data

  return entities
}

export const listVehicles = async (params?: {
  page?: number
  limit?: number
}): Promise<VehicleListResponse> => {
  const token = getAuthToken()
  const query = new URLSearchParams()
  if (params?.page) query.set("page", String(params.page))
  if (params?.limit) query.set("limit", String(params.limit))

  const queryString = query.toString()
  const url = queryString
    ? `${CONTRACTOR_V1_PREFIX}/vehicles?${queryString}`
    : `${CONTRACTOR_V1_PREFIX}/vehicles`

  const response = await apiClient.getWithAuth<VehicleListResponse>(url, token)

  if (!response.success) {
    throw new Error(response.message || "Unable to fetch vehicles")
  }

  return response
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

  return response.data
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

  return response.data
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
