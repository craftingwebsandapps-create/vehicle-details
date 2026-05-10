import { normalizeApprovalStatus } from "~/features/admin/vi-normalize"
import type {
  PlatformSiteContractorSummary,
  PlatformSiteRecord,
} from "~/types/platform-site"

function mapContractorSummary(
  raw: unknown
): PlatformSiteContractorSummary | null {
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

function optStringOrNull(v: unknown): string | null | undefined {
  if (v === undefined) return undefined
  if (v === null) return null
  if (typeof v === "string") return v
  return undefined
}

export function mapPlatformSitePayload(
  raw: Record<string, unknown>
): PlatformSiteRecord {
  return {
    _id: typeof raw._id === "string" ? raw._id : "",
    name: typeof raw.name === "string" ? raw.name : "",
    contactPerson:
      typeof raw.contactPerson === "string" ? raw.contactPerson : undefined,
    mobileNumber:
      typeof raw.mobileNumber === "string" ? raw.mobileNumber : undefined,
    email: typeof raw.email === "string" ? raw.email : undefined,
    location: typeof raw.location === "string" ? raw.location : undefined,
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
  }
}
