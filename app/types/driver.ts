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
  status: DriverStatus
  approvalStatus?: ApprovalStatus
  licenceUrl?: string
  contractor?: string | DriverContractorApiEntity
  site?: string | DriverSiteApiEntity
  vehicle?: string | DriverVehicleApiEntity
  createdAt?: string
  updatedAt?: string
}

export type DriverListResponse = {
  success: boolean
  message: string
  data: {
    data: DriverApiEntity[]
    meta: DriverMeta
  }
}

export type ListDriversParams = {
  page?: number
  limit?: number
  search?: string
  name?: string
  licenceNumber?: string
  mobileNumber?: string
  status?: DriverStatus
  approvalStatus?: ApprovalStatus
}

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
