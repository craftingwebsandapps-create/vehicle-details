import { getAccessToken } from "~/features/auth/auth-storage"
import { apiClient } from "~/services/api-client"
import { isValidObjectId } from "~/features/admin/contractors-admin-api"
import type {
  CreateWorkTypePayload,
  ListWorkTypesParams,
  UpdateWorkTypePayload,
  WorkTypeDetailEnvelope,
  WorkTypeMutationEnvelope,
  WorkTypePickerItem,
  WorkTypeRecord,
  WorkTypesListEnvelope,
} from "~/types/work-type"

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

export function normalizeWorkType(row: unknown): WorkTypeRecord {
  if (!row || typeof row !== "object") {
    throw new Error("Invalid work type payload")
  }
  const r = row as Record<string, unknown>
  const _id =
    typeof r._id === "string"
      ? r._id
      : typeof r.id === "string"
        ? r.id
        : ""
  if (!_id || !OBJECT_ID_HEX.test(_id)) {
    throw new Error("Invalid work type id")
  }
  const name = typeof r.name === "string" ? r.name : ""
  const code = typeof r.code === "string" ? r.code : ""
  let description: string | null | undefined
  if (r.description === null || r.description === undefined) {
    description = r.description as undefined
  } else if (typeof r.description === "string") {
    description = r.description
  }

  return {
    _id,
    name,
    code,
    description,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : undefined,
    updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : undefined,
    deletedAt:
      r.deletedAt === null || typeof r.deletedAt === "string"
        ? (r.deletedAt as string | null)
        : undefined,
  }
}

/** GET /api/work-types — paginated list (sorted by code on server). */
export async function listWorkTypesPaginated(
  params?: ListWorkTypesParams
): Promise<{ items: WorkTypeRecord[]; meta: WorkTypesListEnvelope["data"]["meta"] }> {
  const token = requireToken()
  const query = new URLSearchParams()
  query.set("page", String(clampPage(params?.page)))
  query.set("limit", String(clampLimit(params?.limit)))
  if (params?.search?.trim()) {
    query.set("search", params.search.trim().slice(0, 200))
  }

  const response = await apiClient.getWithAuth<WorkTypesListEnvelope>(
    `/work-types?${query.toString()}`,
    token
  )

  if (!response.success || !response.data) {
    throw new Error("Unable to fetch work types")
  }

  const items = response.data.items.map((row) => normalizeWorkType(row))

  return { items, meta: response.data.meta }
}

/**
 * Flat list for contractor forms (first page, up to 100 rows).
 * Same resource as {@link listWorkTypesPaginated}.
 */
export async function listWorkTypesForPicker(): Promise<WorkTypePickerItem[]> {
  const { items } = await listWorkTypesPaginated({ page: 1, limit: 100 })
  return items.map((w) => ({
    _id: w._id,
    name: w.name,
    code: w.code,
  }))
}

/** GET /api/work-types/:id */
export async function getWorkType(id: string): Promise<WorkTypeRecord> {
  if (!isValidObjectId(id)) {
    throw new Error("Work type id must be a 24-character hex ObjectId")
  }
  const token = requireToken()
  const response = await apiClient.getWithAuth<WorkTypeDetailEnvelope>(
    `/work-types/${encodeURIComponent(id)}`,
    token
  )
  if (!response.success || response.data === undefined || response.data === null) {
    throw new Error("Unable to fetch work type")
  }
  return normalizeWorkType(response.data)
}

/** POST /api/work-types */
export async function createWorkType(
  body: CreateWorkTypePayload
): Promise<WorkTypeRecord> {
  const token = requireToken()
  const payload: Record<string, unknown> = {
    name: body.name.trim(),
    code: body.code.trim(),
  }
  if (
    body.description !== undefined &&
    body.description !== null &&
    String(body.description).trim().length > 0
  ) {
    payload.description = String(body.description).trim()
  }

  const response = await apiClient.postWithAuth<WorkTypeMutationEnvelope>(
    "/work-types",
    payload,
    token
  )

  if (!response.success || response.data === undefined || response.data === null) {
    throw new Error("Unable to create work type")
  }

  return normalizeWorkType(response.data)
}

/** PATCH /api/work-types/:id */
export async function updateWorkType(
  id: string,
  body: UpdateWorkTypePayload
): Promise<WorkTypeRecord> {
  if (!isValidObjectId(id)) {
    throw new Error("Work type id must be a 24-character hex ObjectId")
  }

  const patch: Record<string, unknown> = {}
  if (body.name !== undefined) {
    patch.name = body.name.trim()
  }
  if (body.code !== undefined) {
    patch.code = body.code.trim()
  }
  if (body.description !== undefined) {
    if (
      body.description === null ||
      (typeof body.description === "string" && body.description.trim() === "")
    ) {
      patch.description = ""
    } else {
      patch.description = String(body.description).trim()
    }
  }

  const keys = Object.keys(patch)
  if (keys.length === 0) {
    throw new Error("Send at least one field to update.")
  }

  const token = requireToken()
  const response = await apiClient.patchWithAuth<WorkTypeMutationEnvelope>(
    `/work-types/${encodeURIComponent(id)}`,
    patch,
    token
  )

  if (!response.success || response.data === undefined || response.data === null) {
    throw new Error("Unable to update work type")
  }

  return normalizeWorkType(response.data)
}

/** DELETE /api/work-types/:id — 204 */
export async function deleteWorkType(id: string): Promise<void> {
  if (!isValidObjectId(id)) {
    throw new Error("Work type id must be a 24-character hex ObjectId")
  }
  const token = requireToken()
  await apiClient.deleteWithAuth<void>(
    `/work-types/${encodeURIComponent(id)}`,
    token
  )
}
