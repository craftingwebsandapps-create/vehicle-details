import type { ViPaginatedMeta } from "~/types/vi-platform"

export type WorkTypeRecord = {
  _id: string
  name: string
  code: string
  description?: string | null
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

/** Minimal shape for contractor multi-select pickers */
export type WorkTypePickerItem = Pick<WorkTypeRecord, "_id" | "name" | "code">

export type ListWorkTypesParams = {
  page?: number
  limit?: number
  search?: string
}

export type WorkTypesListEnvelope = {
  success: boolean
  data: {
    items: unknown[]
    meta: ViPaginatedMeta
  }
}

export type WorkTypeDetailEnvelope = {
  success: boolean
  data: unknown
}

export type WorkTypeMutationEnvelope = {
  success: boolean
  data: unknown
}

export type CreateWorkTypePayload = {
  name: string
  code: string
  description?: string | null
}

export type UpdateWorkTypePayload = {
  name?: string
  code?: string
  description?: string | null
}
