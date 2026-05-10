import type {
  MobileLoginApiResponse,
  MobileLoginPayload,
  MobileLoginResponse,
  RefreshTokenApiResponse,
  RefreshTokenPayload,
  RefreshTokenResponse,
} from "~/features/auth/types"
import { apiClient } from "~/services/api-client"

export const mobileLogin = async (
  payload: MobileLoginPayload
): Promise<MobileLoginResponse> => {
  if (!payload.email || !payload.password) {
    throw new Error("Email and password are required")
  }

  const response = await apiClient.post<MobileLoginApiResponse>(
    "/auth/login",
    payload
  )

  if (!response.success || !response.data?.accessToken) {
    throw new Error(response.message || "Login failed")
  }

  return response.data
}

export const refreshAccessToken = async (
  payload: RefreshTokenPayload
): Promise<RefreshTokenResponse> => {
  if (!payload.refreshToken) {
    throw new Error("Refresh token is required")
  }

  const response = await apiClient.post<RefreshTokenApiResponse>(
    "/auth/refresh",
    payload,
    { skipAuthRefresh: true }
  )

  if (!response.success || !response.data?.accessToken) {
    throw new Error(response.message || "Unable to refresh token")
  }

  return response.data
}
