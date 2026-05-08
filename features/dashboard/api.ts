import { apiClient } from "~/services/api-client"
import type { DashboardApiResponse } from "~/types/dashboard"

export async function fetchDashboard(
  token: string
): Promise<DashboardApiResponse> {
  return apiClient.getWithAuth<DashboardApiResponse>(
    "/v1/contractor/dashboard/summary",
    token
  )
}
