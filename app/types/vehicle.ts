export type VehicleStatus = "ACTIVE" | "INACTIVE"
export type ApprovalStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED"

/** Populated work-type refs from GET /api/contractors when expanded server-side */
export type ContractorWorkTypeRef = {
  _id?: string
  name: string
  code: string
}

export type Contractor = {
  _id: string
  name: string
  contactPerson: string
  mobileNumber: string
  email: string
  status: string
  createdAt: string
  updatedAt: string
  workTypeIds?: ContractorWorkTypeRef[]
}

/** Embedded site shape returned by vehicle aggregation lookups */
export type EmbeddedSite = {
  _id: string
  name: string
  location?: string
  status: string
  approvalStatus?: ApprovalStatus
  approvalNote?: string | null
  contactPerson?: string
  mobileNumber?: string
  email?: string
  approvedAt?: string | null
  rejectedAt?: string | null
  /** Enriched list payloads may nest a contractor summary on the site */
  contractor?: Pick<
    Contractor,
    "name" | "contactPerson" | "mobileNumber" | "email"
  > | null
}

/** Full site document (used in standalone site responses) */
export type Site = EmbeddedSite & {
  contractor?: string
  contactPerson?: string
  mobileNumber?: string
  email?: string
  createdAt?: string
  updatedAt?: string
}

/** Embedded driver shape returned by vehicle aggregation (from active assignment lookup) */
export type EmbeddedDriver = {
  _id: string
  name: string
  licenceNumber?: string
  licenceUrl?: string
  mobileNumber?: string
  status: string
  approvalStatus?: ApprovalStatus | string
  approvalNote?: string | null
  approvedAt?: string | null
  rejectedAt?: string | null
}

/** Full driver document (used in standalone driver responses) */
export type Driver = EmbeddedDriver & {
  contractor?: string
  createdAt?: string
  updatedAt?: string
}

export type Vehicle = {
  _id: string
  name: string
  type: string
  registrationNumber: string
  document?: string | null
  status: VehicleStatus
  approvalStatus?: ApprovalStatus
  approvalNote?: string | null
  approvedAt?: string | null
  rejectedAt?: string | null
  approvedBy?: string | null
  /** Populated via aggregation lookup; null when not assigned */
  contractor?: Contractor | null
  /** Populated via aggregation lookup; null when not allocated */
  site?: EmbeddedSite | null
  /** Derived from active drivervehicleassignment lookup; null when unassigned */
  driver?: EmbeddedDriver | null
  createdAt?: string
  updatedAt?: string
}

export type VehicleMeta = {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export type VehicleListResponse = {
  success: boolean
  message: string
  data: {
    data: Vehicle[]
    meta: VehicleMeta
  }
}

export type ListVehiclesParams = {
  page?: number
  limit?: number
  search?: string
  name?: string
  site?: string
  type?: string
  registrationNumber?: string
  status?: VehicleStatus
  approvalStatus?: ApprovalStatus
}

export type VehicleUpsertRequest = {
  name: string
  type: string
  registrationNumber: string
  document: string
  status: VehicleStatus
  site: string
}

export type CreateVehicleRequest = VehicleUpsertRequest

export type UpdateVehicleRequest = VehicleUpsertRequest

export type VehicleFormValues = {
  name: string
  type: string
  registrationNumber: string
  document: string | File | null
  status: VehicleStatus
  site: string
}

export type UploadSingleFileResponse = {
  success: boolean
  message: string
  data?: {
    filename: string
    originalName: string
    mimeType: string
    size: number
    url: string
  }
}
