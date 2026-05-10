import { getAccessToken } from "~/features/auth/auth-storage"
import { apiClient } from "~/services/api-client"
import type { ApiSuccessBody } from "~/types/api-envelope"
import type {
  ContractorsListResponse,
  ListContractorsParams,
} from "~/types/vi-platform"
import type { Contractor } from "~/types/vehicle"

function requireToken(): string {
  const token = getAccessToken()
  if (!token) {
    throw new Error("Access token is required")
  }
  return token
}

function clampPage(page?: number) {
  return Math.max(1, page ?? 1)
}

function clampLimit(limit?: number) {
  return Math.min(100, Math.max(1, limit ?? 20))
}

const OBJECT_ID_HEX = /^[a-f0-9]{24}$/i

export function isValidObjectId(id: string): boolean {
  return OBJECT_ID_HEX.test(id.trim())
}

/** GET /api/contractors — superadmin list + search (tenant JWT is scoped to own row). */
export async function listContractors(
  params?: ListContractorsParams
): Promise<ContractorsListResponse> {
  const token = requireToken()
  const query = new URLSearchParams()
  query.set("page", String(clampPage(params?.page)))
  query.set("limit", String(clampLimit(params?.limit)))
  if (params?.search?.trim()) {
    query.set("search", params.search.trim().slice(0, 200))
  }

  const response = await apiClient.getWithAuth<ContractorsListResponse>(
    `/contractors?${query.toString()}`,
    token
  )

  if (!response.success || !response.data) {
    throw new Error("Unable to fetch contractors")
  }

  return response
}

export type ContractorDetailResponse = ApiSuccessBody<Contractor>

export type ContractorMutationResponse = ApiSuccessBody<Contractor>

export async function getContractor(id: string): Promise<Contractor> {
  if (!isValidObjectId(id)) {
    throw new Error("Contractor id must be a 24-character hex ObjectId")
  }
  const token = requireToken()
  const response = await apiClient.getWithAuth<ContractorDetailResponse>(
    `/contractors/${encodeURIComponent(id)}`,
    token
  )
  if (!response.success || !response.data) {
    throw new Error("Unable to fetch contractor")
  }
  return response.data
}

export type CreateContractorPayload = {
  name: string
  contactPerson: string
  mobileNumber: string
  email: string
  workTypeIds?: string[]
}

export type UpdateContractorPayload = Partial<CreateContractorPayload>

export async function createContractor(
  body: CreateContractorPayload
): Promise<Contractor> {
  const token = requireToken()
  const response = await apiClient.postWithAuth<ContractorMutationResponse>(
    "/contractors",
    body,
    token
  )
  if (!response.success || !response.data) {
    throw new Error("Unable to create contractor")
  }
  return response.data
}

export async function updateContractor(
  id: string,
  body: UpdateContractorPayload
): Promise<Contractor> {
  if (!isValidObjectId(id)) {
    throw new Error("Contractor id must be a 24-character hex ObjectId")
  }
  const token = requireToken()
  const response = await apiClient.patchWithAuth<ContractorMutationResponse>(
    `/contractors/${encodeURIComponent(id)}`,
    body,
    token
  )
  if (!response.success || !response.data) {
    throw new Error("Unable to update contractor")
  }
  return response.data
}

export async function deleteContractor(id: string): Promise<void> {
  if (!isValidObjectId(id)) {
    throw new Error("Contractor id must be a 24-character hex ObjectId")
  }
  const token = requireToken()
  await apiClient.deleteWithAuth<void>(
    `/contractors/${encodeURIComponent(id)}`,
    token
  )
}
