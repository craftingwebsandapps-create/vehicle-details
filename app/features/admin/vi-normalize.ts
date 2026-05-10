import type {
  ApprovalStatus,
  EmbeddedSite,
  Vehicle,
  VehicleStatus,
} from "~/types/vehicle"

export function normalizeApprovalStatus(
  raw: unknown
): ApprovalStatus | undefined {
  if (typeof raw !== "string") return undefined
  const lower = raw.toLowerCase()
  if (lower === "pending") return "PENDING_APPROVAL"
  if (lower === "approved") return "APPROVED"
  if (lower === "rejected") return "REJECTED"
  if (
    raw === "PENDING_APPROVAL" ||
    raw === "APPROVED" ||
    raw === "REJECTED"
  ) {
    return raw
  }
  return undefined
}

/** ACTIVE | INACTIVE; defaults to ACTIVE when omitted from API payloads */
export function normalizeOperationalStatus(raw: unknown): VehicleStatus {
  if (raw === "ACTIVE" || raw === "INACTIVE") return raw
  if (typeof raw === "string") {
    const u = raw.toUpperCase()
    if (u === "ACTIVE" || u === "INACTIVE") return u
    const lower = raw.toLowerCase()
    if (lower === "inactive") return "INACTIVE"
    if (lower === "active") return "ACTIVE"
  }
  return "ACTIVE"
}

function normalizeEmbeddedSite(raw: unknown): Vehicle["site"] {
  if (raw === null || raw === undefined) {
    return raw as null | undefined
  }
  if (typeof raw === "string") {
    return raw
  }
  if (typeof raw !== "object" || Array.isArray(raw)) {
    return undefined
  }
  const o = raw as Record<string, unknown>
  const approvalStatus = normalizeApprovalStatus(o.approvalStatus)
  return {
    ...(raw as unknown as EmbeddedSite),
    approvalStatus,
  }
}

/** Maps vi-backend vehicle rows (lower-case approvals, etc.) onto shared Vehicle typing. */
export function mapPlatformVehiclePayload(raw: Record<string, unknown>): Vehicle {
  const approvalStatus = normalizeApprovalStatus(raw.approvalStatus)
  const status = normalizeOperationalStatus(raw.status)
  const site = normalizeEmbeddedSite(raw.site)

  return {
    ...(raw as unknown as Vehicle),
    approvalStatus,
    status,
    site,
  }
}
