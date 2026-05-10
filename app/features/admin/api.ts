import { getAccessToken } from "~/features/auth/auth-storage"
import { apiClient } from "~/services/api-client"
import { mapPlatformDriverPayload } from "~/features/admin/driver-normalize"
import { mapPlatformSitePayload } from "~/features/admin/site-normalize"
import { mapPlatformVehiclePayload } from "~/features/admin/vi-normalize"
import type { PlatformDriverRecord } from "~/types/platform-driver"
import type { PlatformSiteRecord } from "~/types/platform-site"
import type {
  ListPlatformDriversParams,
  ListPlatformSitesParams,
  ListPlatformVehiclesParams,
  PlatformDriversListResponse,
  PlatformSiteDetailResponse,
  PlatformSitesListResponse,
  PlatformVehiclesListResponse,
  ViPaginatedMeta,
} from "~/types/vi-platform"
import type { Vehicle } from "~/types/vehicle"
import type { AdminDashboardData } from "~/types/admin-dashboard"
import type {
  AuditLogReport,
  ListAdminAuditLogsParams,
  PaginationMeta,
} from "~/types/admin-audit-log"
import type { ApiSuccessBody } from "~/types/api-envelope"
import type {
  UpdateVehicleQrThemePayload,
  VehicleQrThemeApiData,
} from "~/types/admin-vehicle-qr-theme"
import { isValidObjectId } from "~/features/admin/contractors-admin-api"

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

export { listContractors } from "~/features/admin/contractors-admin-api"

/** GET /api/admin/dashboard — requireAuth + requireSuperadmin */
export async function getAdminDashboard(): Promise<AdminDashboardData> {
  const token = getAuthToken()
  const response = await apiClient.getWithAuth<
    ApiSuccessBody<AdminDashboardData>
  >(`${ADMIN_API_PREFIX}/dashboard`, token)

  if (!response.success || response.data === undefined) {
    throw new Error("Unable to load admin dashboard")
  }

  return response.data
}

function clampAuditPage(page?: number) {
  return Math.max(1, page ?? 1)
}

function clampAuditLimit(limit?: number) {
  return Math.min(100, Math.max(1, limit ?? 20))
}

/** GET /api/admin/audit-logs — requireAuth + requireSuperadmin */
export async function listAdminAuditLogs(
  params?: ListAdminAuditLogsParams
): Promise<{ items: AuditLogReport[]; meta: PaginationMeta }> {
  const token = getAuthToken()
  const query = new URLSearchParams()
  query.set("page", String(clampAuditPage(params?.page)))
  query.set("limit", String(clampAuditLimit(params?.limit)))

  const actorUserId = params?.actorUserId?.trim()
  if (actorUserId && isValidObjectId(actorUserId)) {
    query.set("actorUserId", actorUserId)
  }

  if (params?.actorRole === "superadmin" || params?.actorRole === "tenant") {
    query.set("actorRole", params.actorRole)
  }
  if (params?.apiScope === "admin" || params?.apiScope === "tenant_api") {
    query.set("apiScope", params.apiScope)
  }

  const methodRaw = (params?.method ?? "").trim().toUpperCase().slice(0, 8)
  if (methodRaw.length >= 1) {
    query.set("method", methodRaw)
  }

  const statusCode = params?.statusCode
  if (
    typeof statusCode === "number" &&
    Number.isInteger(statusCode) &&
    statusCode >= 100 &&
    statusCode <= 599
  ) {
    query.set("statusCode", String(statusCode))
  }

  const pathContains = (params?.pathContains ?? "").trim().slice(0, 200)
  if (pathContains.length >= 1) {
    query.set("pathContains", pathContains)
  }

  const from = params?.from?.trim()
  if (from) {
    query.set("from", from)
  }
  const to = params?.to?.trim()
  if (to) {
    query.set("to", to)
  }

  const qs = query.toString()
  const response = await apiClient.getWithAuth<{
    success: boolean
    data?: { items: AuditLogReport[]; meta: PaginationMeta }
  }>(`${ADMIN_API_PREFIX}/audit-logs?${qs}`, token)

  if (!response.success || !response.data) {
    throw new Error("Unable to fetch audit logs")
  }

  return { items: response.data.items, meta: response.data.meta }
}

/** GET /api/admin/audit-logs/:id — requireAuth + requireSuperadmin */
export async function getAuditLog(id: string): Promise<AuditLogReport> {
  if (!isValidObjectId(id)) {
    throw new Error("Audit log id must be a 24-character hex ObjectId")
  }
  const token = getAuthToken()
  const response = await apiClient.getWithAuth<{
    success: boolean
    data?: AuditLogReport
  }>(`${ADMIN_API_PREFIX}/audit-logs/${encodeURIComponent(id)}`, token)

  if (!response.success || !response.data) {
    throw new Error("Unable to fetch audit log")
  }

  return response.data
}

/** GET /api/vehicles — enriched rows. Omit `contractor` for superadmin to list all tenants (backend permitting). */
export const listPlatformVehicles = async (
  params?: ListPlatformVehiclesParams
): Promise<{ items: Vehicle[]; meta: ViPaginatedMeta }> => {
  const token = getAuthToken()
  const query = new URLSearchParams()
  if (params?.page) query.set("page", String(params.page))
  if (params?.limit) query.set("limit", String(params.limit))
  if (params?.search) query.set("search", params.search)
  if (params?.contractor?.trim()) {
    query.set("contractor", params.contractor.trim())
  }
  if (params?.site) query.set("site", params.site)

  const qs = query.toString()
  const url = qs ? `/vehicles?${qs}` : "/vehicles"

  const response =
    await apiClient.getWithAuth<PlatformVehiclesListResponse>(url, token)

  if (!response.success) {
    throw new Error("Unable to fetch vehicles")
  }

  const items = response.data.items.map((row) =>
    mapPlatformVehiclePayload(row)
  )

  return { items, meta: response.data.meta }
}

function clampPlatformPage(page?: number) {
  return Math.max(1, page ?? 1)
}

function clampPlatformLimit(limit?: number) {
  return Math.min(100, Math.max(1, limit ?? 20))
}

/** GET /api/drivers — enriched rows; optional contractor filter for superadmin. */
export const listPlatformDrivers = async (
  params?: ListPlatformDriversParams
): Promise<{ items: PlatformDriverRecord[]; meta: ViPaginatedMeta }> => {
  const token = getAuthToken()
  const query = new URLSearchParams()
  query.set("page", String(clampPlatformPage(params?.page)))
  query.set("limit", String(clampPlatformLimit(params?.limit)))
  if (params?.contractor?.trim()) {
    query.set("contractor", params.contractor.trim())
  }
  if (params?.search?.trim()) {
    const s = params.search.trim().slice(0, 200)
    query.set("search", s)
  }
  if (params?.availableOnly === true) {
    query.set("availableOnly", "true")
  }

  const url = `/drivers?${query.toString()}`

  const response =
    await apiClient.getWithAuth<PlatformDriversListResponse>(url, token)

  if (!response.success) {
    throw new Error("Unable to fetch drivers")
  }

  const items = response.data.items.map((row) =>
    mapPlatformDriverPayload(row as Record<string, unknown>)
  )

  return { items, meta: response.data.meta }
}

/** GET /api/sites — enriched rows; optional contractor filter for superadmin. */
export const listPlatformSites = async (
  params?: ListPlatformSitesParams
): Promise<{ items: PlatformSiteRecord[]; meta: ViPaginatedMeta }> => {
  const token = getAuthToken()
  const query = new URLSearchParams()
  query.set("page", String(clampPlatformPage(params?.page)))
  query.set("limit", String(clampPlatformLimit(params?.limit)))
  if (params?.contractor?.trim()) {
    query.set("contractor", params.contractor.trim())
  }
  if (params?.search?.trim()) {
    query.set("search", params.search.trim().slice(0, 200))
  }

  const url = `/sites?${query.toString()}`

  const response =
    await apiClient.getWithAuth<PlatformSitesListResponse>(url, token)

  if (!response.success) {
    throw new Error("Unable to fetch sites")
  }

  const items = response.data.items.map((row) =>
    mapPlatformSitePayload(row as Record<string, unknown>)
  )

  return { items, meta: response.data.meta }
}

/** GET /api/sites/:id — single enriched site (same shape as list rows). */
export const getPlatformSite = async (
  siteId: string
): Promise<PlatformSiteRecord> => {
  const token = getAuthToken()
  const response = await apiClient.getWithAuth<PlatformSiteDetailResponse>(
    `/sites/${encodeURIComponent(siteId)}`,
    token
  )

  if (!response.success) {
    throw new Error("Unable to fetch site")
  }

  return mapPlatformSitePayload(response.data)
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

type VehicleQrThemeEnvelope = {
  success: boolean
  message?: string
  data?: VehicleQrThemeApiData
}

/** GET /api/admin/vehicle-qr-theme */
export async function getAdminVehicleQrTheme(): Promise<VehicleQrThemeApiData> {
  const token = getAuthToken()
  const response = await apiClient.getWithAuth<VehicleQrThemeEnvelope>(
    `${ADMIN_API_PREFIX}/vehicle-qr-theme`,
    token
  )

  if (!response.success || response.data === undefined) {
    throw new Error(response.message || "Unable to load vehicle QR theme")
  }

  return response.data
}

/** PUT /api/admin/vehicle-qr-theme — partial body; server merges with stored values */
export async function updateAdminVehicleQrTheme(
  payload: UpdateVehicleQrThemePayload
): Promise<VehicleQrThemeApiData> {
  const token = getAuthToken()
  const response = await apiClient.putWithAuth<VehicleQrThemeEnvelope>(
    `${ADMIN_API_PREFIX}/vehicle-qr-theme`,
    payload,
    token
  )

  if (!response.success || response.data === undefined) {
    throw new Error(response.message || "Unable to save vehicle QR theme")
  }

  return response.data
}
