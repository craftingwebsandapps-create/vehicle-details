import type { ApprovalStatus } from "~/types/vehicle"

export type PlatformSiteContractorSummary = {
  name?: string
  contactPerson?: string
  mobileNumber?: string
  email?: string
}

export type PlatformSiteRecord = {
  _id: string
  name: string
  contactPerson?: string
  mobileNumber?: string
  email?: string
  location?: string
  approvalStatus?: ApprovalStatus
  approvalNote?: string | null
  approvedAt?: string | null
  rejectedAt?: string | null
  approvedBy?: string | null
  deletedAt?: string | null
  createdAt?: string
  updatedAt?: string
  contractor?: PlatformSiteContractorSummary | null
}
