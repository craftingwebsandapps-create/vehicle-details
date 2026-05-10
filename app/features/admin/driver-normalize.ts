import { normalizeApprovalStatus } from "~/features/admin/vi-normalize"
import type {
  AssignedVehicleSite,
  AssignedVehicleSummary,
  PlatformDriverContractorSummary,
  PlatformDriverRecord,
} from "~/types/platform-driver"

function mapContractorSummary(
  raw: unknown
): PlatformDriverContractorSummary | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  return {
    name: typeof o.name === "string" ? o.name : undefined,
    contactPerson:
      typeof o.contactPerson === "string" ? o.contactPerson : undefined,
    mobileNumber:
      typeof o.mobileNumber === "string" ? o.mobileNumber : undefined,
    email: typeof o.email === "string" ? o.email : undefined,
  }
}

function mapAssignedVehicleSite(raw: unknown): AssignedVehicleSite | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  return {
    name: typeof o.name === "string" ? o.name : undefined,
    contactPerson:
      typeof o.contactPerson === "string" ? o.contactPerson : undefined,
    mobileNumber:
      typeof o.mobileNumber === "string" ? o.mobileNumber : undefined,
    email: typeof o.email === "string" ? o.email : undefined,
    location: typeof o.location === "string" ? o.location : undefined,
    approvalStatus: normalizeApprovalStatus(o.approvalStatus),
    approvalNote:
      typeof o.approvalNote === "string"
        ? o.approvalNote
        : o.approvalNote === null
          ? null
          : undefined,
    approvedAt:
      typeof o.approvedAt === "string"
        ? o.approvedAt
        : o.approvedAt === null
          ? null
          : undefined,
    rejectedAt:
      typeof o.rejectedAt === "string"
        ? o.rejectedAt
        : o.rejectedAt === null
          ? null
          : undefined,
    contractor: mapContractorSummary(o.contractor),
  }
}

function mapAssignedVehicle(raw: unknown): AssignedVehicleSummary | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  const doc = o.document
  return {
    name: typeof o.name === "string" ? o.name : undefined,
    type: typeof o.type === "string" ? o.type : undefined,
    registrationNumber:
      typeof o.registrationNumber === "string"
        ? o.registrationNumber
        : undefined,
    document:
      doc === null ? null : typeof doc === "string" ? doc : undefined,
    approvalStatus: normalizeApprovalStatus(o.approvalStatus),
    approvalNote:
      typeof o.approvalNote === "string"
        ? o.approvalNote
        : o.approvalNote === null
          ? null
          : undefined,
    approvedAt:
      typeof o.approvedAt === "string"
        ? o.approvedAt
        : o.approvedAt === null
          ? null
          : undefined,
    rejectedAt:
      typeof o.rejectedAt === "string"
        ? o.rejectedAt
        : o.rejectedAt === null
          ? null
          : undefined,
    site: mapAssignedVehicleSite(o.site),
  }
}

function optStringOrNull(v: unknown): string | null | undefined {
  if (v === undefined) return undefined
  if (v === null) return null
  if (typeof v === "string") return v
  return undefined
}

export function mapPlatformDriverPayload(
  raw: Record<string, unknown>
): PlatformDriverRecord {
  const lic = raw.licenceUrl
  return {
    _id: typeof raw._id === "string" ? raw._id : "",
    name: typeof raw.name === "string" ? raw.name : "",
    licenceNumber:
      typeof raw.licenceNumber === "string" ? raw.licenceNumber : "",
    licenceUrl:
      lic === null ? null : typeof lic === "string" ? lic : undefined,
    mobileNumber:
      typeof raw.mobileNumber === "string" ? raw.mobileNumber : "",
    approvalStatus: normalizeApprovalStatus(raw.approvalStatus),
    approvalNote: optStringOrNull(raw.approvalNote),
    approvedAt: optStringOrNull(raw.approvedAt),
    rejectedAt: optStringOrNull(raw.rejectedAt),
    approvedBy:
      typeof raw.approvedBy === "string" ? raw.approvedBy : undefined,
    deletedAt: optStringOrNull(raw.deletedAt),
    createdAt:
      typeof raw.createdAt === "string" ? raw.createdAt : undefined,
    updatedAt:
      typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
    contractor: mapContractorSummary(raw.contractor),
    assignedVehicle: mapAssignedVehicle(raw.assignedVehicle),
  }
}
