import { getAccessToken } from "~/features/auth/auth-storage"
import { apiClient } from "~/services/api-client"
import { normalizeApprovalStatus } from "~/features/admin/vi-normalize"

import type {
  CreateSiteRequest,
  ListSitesParams,
  Site,
  UpdateSiteRequest,
} from "~/features/sites/types"

type SitesMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

type ListSitesApiResponse = {
  success: boolean
  data?: {
    items: unknown[]
    meta: SitesMeta
  }
  error?: { message?: string; code?: string }
}

function toApprovalStatusQuery(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined
  const lower = v.toLowerCase()
  if (lower === "pending" || lower === "approved" || lower === "rejected") {
    return lower
  }
  if (v === "PENDING_APPROVAL") return "pending"
  if (v === "APPROVED") return "approved"
  if (v === "REJECTED") return "rejected"
  return undefined
}

const getAuthToken = () => {
  const accessToken = getAccessToken()

  if (!accessToken) {
    throw new Error("Access token is required")
  }

  return accessToken
}

const toSite = (raw: unknown): Site => {
  const site = raw as Record<string, unknown>
  const id = (site.id ?? site._id) as string | undefined

  if (!id) throw new Error("Site id is missing")
  const approvalStatus = normalizeApprovalStatus(site.approvalStatus)
  const contractorRaw = site.contractor as unknown
  const statusRaw = site.status
  const status =
    statusRaw === "ACTIVE" || statusRaw === "INACTIVE"
      ? statusRaw
      : typeof statusRaw === "string"
        ? statusRaw.toUpperCase() === "INACTIVE"
          ? "INACTIVE"
          : "ACTIVE"
        : "ACTIVE"

  return {
    id,
    _id: typeof site._id === "string" ? site._id : undefined,
    name: String(site.name ?? ""),
    contractor:
      typeof contractorRaw === "string"
        ? contractorRaw
        : contractorRaw && typeof contractorRaw === "object"
          ? {
              _id: String((contractorRaw as Record<string, unknown>)._id ?? ""),
              name:
                typeof (contractorRaw as Record<string, unknown>).name === "string"
                  ? ((contractorRaw as Record<string, unknown>).name as string)
                  : undefined,
              contactPerson:
                typeof (contractorRaw as Record<string, unknown>).contactPerson ===
                "string"
                  ? ((contractorRaw as Record<string, unknown>)
                      .contactPerson as string)
                  : undefined,
              mobileNumber:
                typeof (contractorRaw as Record<string, unknown>).mobileNumber ===
                "string"
                  ? ((contractorRaw as Record<string, unknown>)
                      .mobileNumber as string)
                  : undefined,
              email:
                typeof (contractorRaw as Record<string, unknown>).email === "string"
                  ? ((contractorRaw as Record<string, unknown>).email as string)
                  : undefined,
            }
          : undefined,
    contactPerson: String(site.contactPerson ?? ""),
    mobileNumber: String(site.mobileNumber ?? ""),
    email: String(site.email ?? ""),
    location: String(site.location ?? ""),
    status,
    approvalStatus: approvalStatus as Site["approvalStatus"],
    approvalNote:
      site.approvalNote === null || typeof site.approvalNote === "string"
        ? (site.approvalNote as string | null)
        : undefined,
    approvedBy:
      site.approvedBy === null || typeof site.approvedBy === "string"
        ? (site.approvedBy as string | null)
        : undefined,
    approvedAt:
      site.approvedAt === null || typeof site.approvedAt === "string"
        ? (site.approvedAt as string | null)
        : undefined,
    rejectedAt:
      site.rejectedAt === null || typeof site.rejectedAt === "string"
        ? (site.rejectedAt as string | null)
        : undefined,
    rejectedNote:
      site.rejectedNote === null || typeof site.rejectedNote === "string"
        ? (site.rejectedNote as string | null)
        : undefined,
    deletedAt:
      site.deletedAt === null || typeof site.deletedAt === "string"
        ? (site.deletedAt as string | null)
        : undefined,
    createdAt: String(site.createdAt ?? ""),
    updatedAt: String(site.updatedAt ?? ""),
  }
}

export const listSites = async (params: ListSitesParams = {}) => {
  const accessToken = getAuthToken()
  const query = new URLSearchParams()

  if (params.page) {
    query.set("page", String(params.page))
  }

  if (params.limit) {
    query.set("limit", String(params.limit))
  }

  if (params.name) {
    query.set("name", params.name)
  }

  if (params.status) {
    query.set("status", params.status)
  }

  if (params.approvalStatus) {
    const qs = toApprovalStatusQuery(params.approvalStatus)
    if (qs) query.set("approvalStatus", qs)
  }

  const path = query.toString() ? `/sites?${query.toString()}` : "/sites"
  const response = await apiClient.getWithAuth<ListSitesApiResponse>(
    path,
    accessToken
  )

  if (!response.success || !response.data?.items) {
    throw new Error(response.error?.message || "Unable to fetch sites")
  }

  return {
    items: response.data.items.map(toSite),
    meta: response.data.meta,
  }
}

export const createSite = async (payload: CreateSiteRequest): Promise<Site> => {
  const accessToken = getAuthToken()

  const response = await apiClient.postWithAuth<{
    success: boolean
    data?: unknown
    error?: { message?: string; code?: string }
  }>("/sites", payload, accessToken)

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || "Unable to create site")
  }

  return toSite(response.data)
}

export const updateSite = async (
  siteId: string,
  payload: UpdateSiteRequest
): Promise<Site> => {
  const accessToken = getAuthToken()

  if (!siteId) {
    throw new Error("Site id is required")
  }

  const response = await apiClient.request<{
    success: boolean
    data?: unknown
    error?: { message?: string; code?: string }
  }>(
    `/sites/${siteId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || "Unable to update site")
  }

  return toSite(response.data)
}
