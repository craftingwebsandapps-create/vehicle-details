export type SiteStatus = "ACTIVE" | "INACTIVE"
export type SiteApprovalStatus =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "pending"
  | "approved"
  | "rejected"

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface Site {
  id: string
  _id?: string
  name: string
  contractor?:
    | string
    | { _id: string; name?: string; email?: string }
  contactPerson: string
  mobileNumber: string
  email: string
  location: string
  status: SiteStatus
  approvalStatus?: SiteApprovalStatus
  approvalNote?: string | null
  approvedBy?: string | null
  approvedAt?: string | null
  rejectedAt?: string | null
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
}

export interface UpdateSiteRequest {
  name?: string
  contactPerson?: string
  mobileNumber?: string
  email?: string
  location?: string
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
