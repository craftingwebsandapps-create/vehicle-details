export type AssignmentMeta = {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export type AssignmentApiRef = {
  id?: string
  _id?: string
  name?: string
  licenceNumber?: string
  registrationNumber?: string
  type?: string
  mobileNumber?: string
  status?: string
}

export type AssignmentApiEntity = {
  id?: string
  _id?: string
  driver?: string | AssignmentApiRef
  vehicle?: string | AssignmentApiRef
  status?: string
  route?: string
  from?: string
  to?: string
  source?: string
  destination?: string
  sourceSite?: { name?: string }
  destinationSite?: { name?: string }
  assignedAt?: string
  unassignedAt?: string
  createdAt?: string
  updatedAt?: string
}

export type Assignment = {
  id: string
  driver: {
    name: string
    licenceNumber?: string
    mobileNumber?: string
  }
  vehicle: {
    name: string
    registrationNumber?: string
    type?: string
  }
  status: string
  assignedAt?: string
  unassignedAt?: string
  createdAt?: string
  updatedAt?: string
}

export type AssignmentListApiResponse = {
  success: boolean
  message: string
  data: {
    data: AssignmentApiEntity[]
    meta: AssignmentMeta
  }
}

export type CreateAssignmentRequest = {
  driver: string
  vehicle: string
}

export type ChangeAssignmentDriverRequest = {
  driver: string
}

export type AssignmentMutationResponse = {
  success: boolean
  message: string
  data?: AssignmentApiEntity
}
