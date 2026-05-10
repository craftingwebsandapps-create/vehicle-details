import type { Contractor } from "~/types/vehicle"
import type { ViPaginatedMeta } from "~/types/vi-platform"

export type TenantContractorListEnvelope = {
  success: boolean
  data: {
    items: Contractor[]
    meta: ViPaginatedMeta
  }
}

export type TenantContractorDetailEnvelope = {
  success: boolean
  data: Contractor
}

export type TenantContractorMutationEnvelope = {
  success: boolean
  data: Contractor
}

export type CreateTenantContractorBody = {
  name: string
  contactPerson: string
  mobileNumber: string
  email: string
  workTypeIds?: string[]
}

export type UpdateTenantContractorBody = Partial<CreateTenantContractorBody>
