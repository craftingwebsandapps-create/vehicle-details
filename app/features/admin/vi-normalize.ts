import type { ApprovalStatus, Vehicle, VehicleStatus } from "~/types/vehicle"

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

function normalizeOperationalStatus(raw: unknown): VehicleStatus {
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

/** Maps vi-backend vehicle rows (lower-case approvals, etc.) onto shared Vehicle typing. */
export function mapPlatformVehiclePayload(raw: Record<string, unknown>): Vehicle {
  const approvalStatus = normalizeApprovalStatus(raw.approvalStatus)
  const status = normalizeOperationalStatus(raw.status)

  return {
    ...(raw as unknown as Vehicle),
    approvalStatus,
    status,
  }
}
