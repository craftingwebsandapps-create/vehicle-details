export type SiteStatus = "ACTIVE" | "INACTIVE"

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface Site {
  id: string
  name: string
  contactPerson: string
  mobileNumber: string
  email: string
  location: string
  status: SiteStatus
  createdAt: string
  updatedAt: string
}

export interface CreateSiteRequest {
  name: string
  contactPerson: string
  mobileNumber: string
  email: string
  location: string
  status?: SiteStatus
}

export interface UpdateSiteRequest {
  contactPerson?: string
  mobileNumber?: string
  email?: string
  location?: string
  status?: SiteStatus
}

export interface ListSitesParams extends PaginationParams {
  name?: string
  status?: SiteStatus
}

export type CreateSiteApiResponse = {
  success: boolean
  message: string
  data: Site
}
