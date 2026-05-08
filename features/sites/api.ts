import { getAccessToken } from "~/features/auth/auth-storage"
import { apiClient } from "~/services/api-client"

import type {
  CreateSiteRequest,
  ListSitesParams,
  Site,
  UpdateSiteRequest,
} from "~/features/sites/types"

type SiteApiEntity = Omit<Site, "id"> & {
  id?: string
  _id?: string
}

type SitesMeta = {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

type BaseSiteApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

type ListSitesApiResponse = BaseSiteApiResponse<{
  data: SiteApiEntity[]
  meta: SitesMeta
}>

type CreateOrUpdateSiteApiResponse = BaseSiteApiResponse<SiteApiEntity>

const CONTRACTOR_V1_PREFIX = "/v1/contractor"

const getAuthToken = () => {
  const accessToken = getAccessToken()

  if (!accessToken) {
    throw new Error("Access token is required")
  }

  return accessToken
}

const toSite = (site: SiteApiEntity): Site => {
  const id = site.id ?? site._id

  if (!id) {
    throw new Error("Site id is missing")
  }

  return {
    ...site,
    id,
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
    query.set("approvalStatus", params.approvalStatus)
  }

  const path = query.toString()
    ? `${CONTRACTOR_V1_PREFIX}/sites?${query.toString()}`
    : `${CONTRACTOR_V1_PREFIX}/sites`
  const response = await apiClient.getWithAuth<ListSitesApiResponse>(
    path,
    accessToken
  )

  if (!response.success || !response.data?.data) {
    throw new Error(response.message || "Unable to fetch sites")
  }

  return {
    items: response.data.data.map(toSite),
    meta: response.data.meta,
  }
}

export const createSite = async (payload: CreateSiteRequest): Promise<Site> => {
  const accessToken = getAuthToken()

  const response = await apiClient.post<CreateOrUpdateSiteApiResponse>(
    `${CONTRACTOR_V1_PREFIX}/sites`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.success || !response.data) {
    throw new Error(response.message || "Unable to create site")
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

  const response = await apiClient.request<CreateOrUpdateSiteApiResponse>(
    `${CONTRACTOR_V1_PREFIX}/sites/${siteId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.success || !response.data) {
    throw new Error(response.message || "Unable to update site")
  }

  return toSite(response.data)
}
