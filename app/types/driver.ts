import type { ObjectIdString } from "~/types/object-id"

export type DriverStatus = "ACTIVE" | "INACTIVE"
export type ApprovalStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED"

export type Driver = {
  id: string
  name: string
  licenceNumber: string
  mobileNumber: string
  status: DriverStatus
  approvalStatus?: ApprovalStatus
  approvalNote?: string | null
  approvedAt?: string | null
  rejectedAt?: string | null
  deletedAt?: string | null
  licenceUrl?: string
  contractor?: {
    id: string
    name: string
  }
  site?: {
    id: string
    name: string
    location?: string
  }
  vehicle?: {
    id: string
    name: string
    registrationNumber?: string
  }
  createdAt?: string
  updatedAt?: string
}

export type DriverMeta = {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export type DriverContractorApiEntity = {
  _id: string
  name: string
  contactPerson?: string
  mobileNumber?: string
  email?: string
  status?: string
}

export type DriverSiteApiEntity = {
  _id: string
  name: string
  location?: string
  status?: string
}

export type DriverVehicleApiEntity = {
  _id: string
  name: string
  type?: string
  registrationNumber?: string
  status?: string
}

export type DriverApiEntity = {
  id?: string
  _id?: string
  name: string
  licenceNumber: string
  mobileNumber: string
  /** Defaults to ACTIVE in client mapping when omitted */
  status?: DriverStatus
  approvalStatus?: ApprovalStatus | string
  approvalNote?: string | null
  approvedAt?: string | null
  rejectedAt?: string | null
  deletedAt?: string | null
  licenceUrl?: string
  contractor?: string | DriverContractorApiEntity
  site?: string | DriverSiteApiEntity
  vehicle?: string | DriverVehicleApiEntity
  createdAt?: string
  updatedAt?: string
}

/** GET /api/drivers query — lowercase matches typical backend validators */
export type DriverListApprovalStatus = "pending" | "approved" | "rejected"

export type DriverListResponse = {
  success: boolean
  message?: string
  data: {
    items?: DriverApiEntity[]
    data?: DriverApiEntity[]
    meta: DriverMeta
  }
}

/** GET /api/drivers — matches listDriversQuerySchema */
export type ListDriversParams = {
  page?: number
  limit?: number
  /** Case-insensitive substring; clamped client-side */
  search?: string
  name?: string
  licenceNumber?: string
  mobileNumber?: string
  status?: DriverStatus
  approvalStatus?: DriverListApprovalStatus
  /** Query string `availableOnly=true`: no active vehicle assignment */
  availableOnly?: boolean
  /** Tenant must omit (or match JWT); else 403 */
  contractor?: ObjectIdString
}

/** Alias for API docs */
export type ListDriversQuery = ListDriversParams

/** POST /api/drivers — tenant should omit `contractor` */
export type CreateDriverRequest = {
  name: string
  licenceNumber: string
  licenceUrl: string
  mobileNumber: string
  contractor?: ObjectIdString
}

/** PATCH /api/drivers/:id */
export type UpdateDriverRequest = Partial<CreateDriverRequest>

export type DriverFormValues = {
  name: string
  licenceNumber: string
  licenceUrl: string | File | null
  mobileNumber: string
  /** Optional; tenant flows leave empty and omit from API body */
  contractor?: string
}
