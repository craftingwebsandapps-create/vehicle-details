import { apiClient } from "~/services/api-client"
import type { PublicVehicleLookupSuccessResponse } from "~/types/public-vehicle"

const REG_MIN = 1
const REG_MAX = 80

/**
 * Public lookup — no auth. Uses flexible plate matching on the server.
 * @throws Error for invalid input client-side; ApiRequestError from client on HTTP errors.
 */
export async function fetchPublicVehicleByRegistration(
  registrationNumber: string
): Promise<PublicVehicleLookupSuccessResponse["data"]> {
  const trimmed = registrationNumber.trim()
  if (trimmed.length < REG_MIN || trimmed.length > REG_MAX) {
    throw new Error(
      `Registration must be between ${REG_MIN} and ${REG_MAX} characters.`
    )
  }

  const qs = new URLSearchParams({
    registrationNumber: trimmed,
  })

  const response = await apiClient.get<PublicVehicleLookupSuccessResponse>(
    `/public/vehicle-by-registration?${qs.toString()}`,
    { skipAuthRefresh: true }
  )

  if (!response.success || !response.data) {
    throw new Error("Unexpected response from vehicle lookup.")
  }

  return response.data
}
