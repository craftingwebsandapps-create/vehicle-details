/**
 * Decode JWT payload for UX only; authorization is enforced by the server.
 */

export function decodeJwtPayload(
  accessToken: string
): Record<string, unknown> | null {
  try {
    const parts = accessToken.trim().split(".")
    if (parts.length !== 3) {
      return null
    }
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    while (base64.length % 4) {
      base64 += "="
    }
    const json = atob(base64)
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

const OBJECT_ID_HEX = /^[a-f0-9]{24}$/i

export function getContractorIdFromAccessToken(
  accessToken: string | null | undefined
): string | null {
  if (!accessToken?.trim()) {
    return null
  }
  const payload = decodeJwtPayload(accessToken.trim())
  if (!payload) {
    return null
  }
  const raw = payload.contractorId ?? payload.contractor_id
  if (raw === null || raw === undefined) {
    return null
  }
  if (typeof raw === "string" && OBJECT_ID_HEX.test(raw)) {
    return raw
  }
  return null
}

/** Current user Mongo id from JWT (UX only); used e.g. to block self-delete. */
export function getUserIdFromAccessToken(
  accessToken: string | null | undefined
): string | null {
  if (!accessToken?.trim()) {
    return null
  }
  const payload = decodeJwtPayload(accessToken.trim())
  if (!payload) {
    return null
  }
  const candidates = [
    payload.userId,
    payload.user_id,
    payload.sub,
    payload.id,
    payload._id,
  ]
  for (const c of candidates) {
    if (typeof c === "string" && OBJECT_ID_HEX.test(c)) {
      return c
    }
  }
  return null
}
