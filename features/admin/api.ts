import { getAccessToken } from "~/features/auth/auth-storage"
import { apiClient } from "~/services/api-client"

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
