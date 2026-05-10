import type { ApprovalStatus } from "~/types/vehicle"

/** Contractor summary on GET /api/drivers rows */
export type PlatformDriverContractorSummary = {
  name?: string
  contactPerson?: string
  mobileNumber?: string
  email?: string
}

/** Site nested under assignedVehicle */
export type AssignedVehicleSite = {
  name?: string
  contactPerson?: string
  mobileNumber?: string
  email?: string
  location?: string
  approvalStatus?: ApprovalStatus
  approvalNote?: string | null
  approvedAt?: string | null
  rejectedAt?: string | null
  contractor?: PlatformDriverContractorSummary | null
}

/** Active assignment vehicle snippet on driver list rows */
export type AssignedVehicleSummary = {
  name?: string
  type?: string
  registrationNumber?: string
  document?: string | null
  approvalStatus?: ApprovalStatus
  approvalNote?: string | null
  approvedAt?: string | null
  rejectedAt?: string | null
  site?: AssignedVehicleSite | null
}

/** Normalized driver row from GET /api/drivers */
export type PlatformDriverRecord = {
  _id: string
  name: string
  licenceNumber: string
  licenceUrl?: string | null
  mobileNumber?: string
  approvalStatus?: ApprovalStatus
  approvalNote?: string | null
  approvedAt?: string | null
  rejectedAt?: string | null
  approvedBy?: string | null
  deletedAt?: string | null
  createdAt?: string
  updatedAt?: string
  contractor?: PlatformDriverContractorSummary | null
  assignedVehicle?: AssignedVehicleSummary | null
}
