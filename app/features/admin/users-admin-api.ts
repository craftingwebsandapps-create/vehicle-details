import { getAccessToken } from "~/features/auth/auth-storage"
import { apiClient } from "~/services/api-client"
import type {
  AdminUser,
  AdminUserDetailEnvelope,
  AdminUserMutationEnvelope,
  AdminUsersListEnvelope,
  CreateAdminUserPayload,
  ListAdminUsersParams,
  UpdateAdminUserPayload,
} from "~/types/admin-user"
import { isValidObjectId } from "~/features/admin/contractors-admin-api"

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

function normalizeContractorSummary(
  raw: Record<string, unknown>
): AdminUser["contractor"] {
  const id =
    typeof raw.id === "string"
      ? raw.id
      : typeof raw._id === "string"
        ? raw._id
        : ""
  if (!id || !isValidObjectId(id)) {
    return null
  }
  return {
    id,
    name: typeof raw.name === "string" ? raw.name : "",
    email: typeof raw.email === "string" ? raw.email : "",
    contactPerson:
      typeof raw.contactPerson === "string" ? raw.contactPerson : "",
    mobileNumber:
      typeof raw.mobileNumber === "string" ? raw.mobileNumber : "",
  }
}

export function normalizeAdminUser(row: unknown): AdminUser {
  if (!row || typeof row !== "object") {
    throw new Error("Invalid user payload")
  }
  const r = row as Record<string, unknown>
  const id =
    typeof r.id === "string"
      ? r.id
      : typeof r._id === "string"
        ? r._id
        : ""
  if (!id || !isValidObjectId(id)) {
    throw new Error("Invalid user id")
  }

  let contractorId: string | null = null
  const cidRaw = r.contractorId
  if (cidRaw === null || cidRaw === undefined) {
    contractorId = null
  } else if (typeof cidRaw === "string" && isValidObjectId(cidRaw)) {
    contractorId = cidRaw
  }

  let contractor: AdminUser["contractor"] = null
  const cRaw = r.contractor
  if (cRaw && typeof cRaw === "object") {
    contractor = normalizeContractorSummary(cRaw as Record<string, unknown>)
  }

  return {
    id,
    name: typeof r.name === "string" ? r.name : "",
    email: typeof r.email === "string" ? r.email : "",
    contractorId,
    contractor,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : "",
    updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : "",
  }
}

/** GET /api/admin/users */
export async function listAdminUsers(
  params?: ListAdminUsersParams
): Promise<{ items: AdminUser[]; meta: AdminUsersListEnvelope["data"]["meta"] }> {
  const token = requireToken()
  const query = new URLSearchParams()
  query.set("page", String(clampPage(params?.page)))
  query.set("limit", String(clampLimit(params?.limit)))
  if (params?.search?.trim()) {
    query.set("search", params.search.trim().slice(0, 200))
  }
  const hasContractor =
    typeof params?.contractor === "string" &&
    params.contractor.trim().length > 0 &&
    isValidObjectId(params.contractor.trim())
  const hasSuperFlag = typeof params?.isSuperadmin === "boolean"
  if (hasContractor && hasSuperFlag) {
    throw new Error("Cannot send both contractor and isSuperadmin filters.")
  }
  if (hasContractor) {
    query.set("contractor", params!.contractor!.trim())
  }
  if (hasSuperFlag && !hasContractor) {
    query.set("isSuperadmin", params!.isSuperadmin ? "true" : "false")
  }

  const response = await apiClient.getWithAuth<AdminUsersListEnvelope>(
    `/admin/users?${query.toString()}`,
    token
  )

  if (!response.success || !response.data) {
    throw new Error("Unable to fetch users")
  }

  const items = response.data.items.map((row) =>
    normalizeAdminUser(row as unknown)
  )

  return { items, meta: response.data.meta }
}

/** GET /api/admin/users/:id */
export async function getAdminUser(id: string): Promise<AdminUser> {
  if (!isValidObjectId(id)) {
    throw new Error("User id must be a 24-character hex ObjectId")
  }
  const token = requireToken()
  const response = await apiClient.getWithAuth<AdminUserDetailEnvelope>(
    `/admin/users/${encodeURIComponent(id)}`,
    token
  )
  if (!response.success || !response.data) {
    throw new Error("Unable to fetch user")
  }
  return normalizeAdminUser(response.data as unknown)
}

/** POST /api/admin/users */
export async function createAdminUser(
  body: CreateAdminUserPayload
): Promise<AdminUser> {
  const token = requireToken()
  const payload: Record<string, unknown> = {
    name: body.name,
    email: body.email,
    password: body.password,
  }
  if (body.contractorId?.trim()) {
    if (!isValidObjectId(body.contractorId.trim())) {
      throw new Error("contractorId must be a valid 24-character hex ObjectId")
    }
    payload.contractorId = body.contractorId.trim()
  }

  const response = await apiClient.postWithAuth<AdminUserMutationEnvelope>(
    "/admin/users",
    payload,
    token
  )

  if (!response.success || !response.data) {
    throw new Error("Unable to create user")
  }

  return normalizeAdminUser(response.data as unknown)
}

/** PATCH /api/admin/users/:id */
export async function updateAdminUser(
  id: string,
  body: UpdateAdminUserPayload
): Promise<AdminUser> {
  if (!isValidObjectId(id)) {
    throw new Error("User id must be a 24-character hex ObjectId")
  }
  const patch: Record<string, unknown> = {}
  if (body.name !== undefined) {
    patch.name = body.name
  }
  if (body.email !== undefined) {
    patch.email = body.email
  }
  if (body.password !== undefined && body.password.length > 0) {
    patch.password = body.password
  }
  if (body.contractorId !== undefined) {
    if (
      body.contractorId !== null &&
      !isValidObjectId(body.contractorId.trim())
    ) {
      throw new Error("contractorId must be null or a valid 24-character hex")
    }
    patch.contractorId =
      body.contractorId === null ? null : body.contractorId.trim()
  }

  const keys = Object.keys(patch)
  if (keys.length === 0) {
    throw new Error("Send at least one field to update.")
  }

  const token = requireToken()
  const response = await apiClient.patchWithAuth<AdminUserMutationEnvelope>(
    `/admin/users/${encodeURIComponent(id)}`,
    patch,
    token
  )

  if (!response.success || !response.data) {
    throw new Error("Unable to update user")
  }

  return normalizeAdminUser(response.data as unknown)
}

/** DELETE /api/admin/users/:id — 204 */
export async function deleteAdminUser(id: string): Promise<void> {
  if (!isValidObjectId(id)) {
    throw new Error("User id must be a 24-character hex ObjectId")
  }
  const token = requireToken()
  await apiClient.deleteWithAuth<void>(
    `/admin/users/${encodeURIComponent(id)}`,
    token
  )
}
