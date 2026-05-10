import type { ViPaginatedMeta } from "~/types/vi-platform"

/** Contractor summary embedded on admin user when linked */
export type AdminUserContractorSummary = {
  id: string
  name: string
  email: string
  contactPerson: string
  mobileNumber: string
}

/** User row from GET /api/admin/users (no password fields). */
export type AdminUser = {
  id: string
  name: string
  email: string
  contractorId: string | null
  contractor: AdminUserContractorSummary | null
  createdAt: string
  updatedAt: string
}

export type AdminUsersListEnvelope = {
  success: boolean
  data: {
    items: unknown[]
    meta: ViPaginatedMeta
  }
}

export type AdminUserDetailEnvelope = {
  success: boolean
  data: unknown
}

export type AdminUserMutationEnvelope = {
  success: boolean
  data: unknown
}

export type ListAdminUsersParams = {
  page?: number
  limit?: number
  search?: string
  /** 24-char hex; mutually exclusive with isSuperadmin */
  contractor?: string
  /** Mutually exclusive with contractor */
  isSuperadmin?: boolean
}

export type CreateAdminUserPayload = {
  name: string
  email: string
  password: string
  /** Omit or undefined → superadmin user */
  contractorId?: string
}

export type UpdateAdminUserPayload = {
  name?: string
  email?: string
  password?: string
  /** null → promote to superadmin / unlink tenant */
  contractorId?: string | null
}
