import { getAccessToken } from "~/features/auth/auth-storage"
import { apiClient } from "~/services/api-client"
import type {
  CreateTenantContractorBody,
  TenantContractorDetailEnvelope,
  TenantContractorListEnvelope,
  TenantContractorMutationEnvelope,
  UpdateTenantContractorBody,
} from "~/types/tenant-contractor"
import type { Contractor } from "~/types/vehicle"
import type { ViPaginatedMeta } from "~/types/vi-platform"

function requireAccessToken(): string {
  const token = getAccessToken()
  if (!token) {
    throw new Error("Access token is required")
  }
  return token
}

function clampContractorsPage(page?: number) {
  return Math.max(1, page ?? 1)
}

function clampContractorsLimit(limit?: number) {
  return Math.min(100, Math.max(1, limit ?? 20))
}

export type ListTenantContractorsParams = {
  page?: number
  limit?: number
  /** Max 200 chars; matches name, contactPerson, email (case-insensitive). */
  search?: string
}

/** GET /api/contractors — tenant list scoped to JWT contractorId. */
export async function listTenantContractors(
  params?: ListTenantContractorsParams
): Promise<{ items: Contractor[]; meta: ViPaginatedMeta }> {
  const token = requireAccessToken()
  const query = new URLSearchParams()
  query.set("page", String(clampContractorsPage(params?.page)))
  query.set("limit", String(clampContractorsLimit(params?.limit)))
  if (params?.search?.trim()) {
    query.set("search", params.search.trim().slice(0, 200))
  }

  const response = await apiClient.getWithAuth<TenantContractorListEnvelope>(
    `/contractors?${query.toString()}`,
    token
  )

  if (!response.success || !response.data) {
    throw new Error("Unable to fetch contractors")
  }

  return {
    items: response.data.items,
    meta: response.data.meta,
  }
}

/** GET /api/contractors/:id — call only with id === JWT.contractorId. */
export async function getTenantContractor(id: string): Promise<Contractor> {
  const token = requireAccessToken()
  const response = await apiClient.getWithAuth<TenantContractorDetailEnvelope>(
    `/contractors/${encodeURIComponent(id)}`,
    token
  )

  if (!response.success || !response.data) {
    throw new Error("Unable to fetch contractor")
  }

  return response.data
}

/** POST /api/contractors — tenant-only; blocked for superadmin (SUPERADMIN_READ_ONLY). */
export async function createTenantContractor(
  body: CreateTenantContractorBody
): Promise<Contractor> {
  const token = requireAccessToken()
  const response = await apiClient.postWithAuth<TenantContractorMutationEnvelope>(
    "/contractors",
    body,
    token
  )

  if (!response.success || !response.data) {
    throw new Error("Unable to create contractor")
  }

  return response.data
}

/** PATCH /api/contractors/:id — id must equal JWT.contractorId. */
export async function updateTenantContractor(
  id: string,
  body: UpdateTenantContractorBody
): Promise<Contractor> {
  const token = requireAccessToken()
  const response = await apiClient.patchWithAuth<TenantContractorMutationEnvelope>(
    `/contractors/${encodeURIComponent(id)}`,
    body,
    token
  )

  if (!response.success || !response.data) {
    throw new Error("Unable to update contractor")
  }

  return response.data
}

/** DELETE /api/contractors/:id — 204 empty body on success. */
export async function deleteTenantContractor(id: string): Promise<void> {
  const token = requireAccessToken()
  await apiClient.deleteWithAuth<void>(
    `/contractors/${encodeURIComponent(id)}`,
    token
  )
}
