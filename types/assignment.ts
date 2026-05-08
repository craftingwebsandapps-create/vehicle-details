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
  registrationNumber?: string
  mobileNumber?: string
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
  createdAt?: string
  updatedAt?: string
}

export type Assignment = {
  id: string
  driverName: string
  vehicleLabel: string
  status: string
  route: string
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
