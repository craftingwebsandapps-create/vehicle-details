export type SiteStatus = "ACTIVE" | "INACTIVE"
export type SiteApprovalStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED"

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface Site {
  id: string
  _id?: string
  name: string
  contractor?: string
  contactPerson: string
  mobileNumber: string
  email: string
  location: string
  status: SiteStatus
  approvalStatus?: SiteApprovalStatus
  approvedBy?: string | null
  approvedAt?: string | null
  rejectedNote?: string | null
  deletedAt?: string | null
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
  approvalStatus?: SiteApprovalStatus
}

export type CreateSiteApiResponse = {
  success: boolean
  message: string
  data: Site
}
