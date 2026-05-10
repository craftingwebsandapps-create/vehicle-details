import type { Contractor } from "~/types/vehicle"

/** Pagination meta from GET /api/contractors and GET /api/vehicles */
export type ViPaginatedMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type ListContractorsParams = {
  page?: number
  limit?: number
  search?: string
}

export type ContractorsListResponse = {
  success: boolean
  data: {
    items: Contractor[]
    meta: ViPaginatedMeta
  }
}

export type ListPlatformVehiclesParams = {
  /** Omit for all vehicles (superadmin); set to restrict to one tenant. */
  contractor?: string
  site?: string
  search?: string
  page?: number
  limit?: number
}

/** Raw envelope for GET /api/vehicles (items normalized in the client). */
export type PlatformVehiclesListResponse = {
  success: boolean
  data: {
    items: Record<string, unknown>[]
    meta: ViPaginatedMeta
  }
}

export type ListPlatformDriversParams = {
  page?: number
  /** Clamped to 1–100 on the client. */
  limit?: number
  contractor?: string
  /** Max 200 chars; trimmed server-side. */
  search?: string
  /** Only drivers with no active vehicle assignment. */
  availableOnly?: boolean
}

export type PlatformDriversListResponse = {
  success: boolean
  data: {
    items: Record<string, unknown>[]
    meta: ViPaginatedMeta
  }
}

export type ListPlatformSitesParams = {
  page?: number
  limit?: number
  contractor?: string
  search?: string
}

export type PlatformSitesListResponse = {
  success: boolean
  data: {
    items: Record<string, unknown>[]
    meta: ViPaginatedMeta
  }
}

export type PlatformSiteDetailResponse = {
  success: boolean
  data: Record<string, unknown>
}
