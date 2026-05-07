export type Contractor = {
  _id: string
  name: string
  contactPerson: string
  mobileNumber: string
  email: string
  status: string
  createdAt: string
  updatedAt: string
}

export type Site = {
  _id: string
  name: string
  contractor: string
  contactPerson: string
  mobileNumber: string
  email: string
  location: string
  status: string
  createdAt: string
  updatedAt: string
}

export type Driver = {
  _id: string
  name: string
  licenceNumber: string
  licenceUrl: string
  mobileNumber: string
  contractor: string
  status: string
  createdAt: string
  updatedAt: string
}

export type Vehicle = {
  _id: string
  name: string
  contractor: Contractor
  type: string
  registrationNumber: string
  document: string
  status: string
  site: Site
  driver: Driver
  createdAt: string
  updatedAt: string
}

export type VehicleMeta = {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export type VehicleListResponse = {
  success: boolean
  message: string
  data: {
    data: Vehicle[]
    meta: VehicleMeta
  }
}

export type VehicleUpsertRequest = {
  name: string
  type: string
  registrationNumber: string
  document: string
  status: string
  site: string
}

export type CreateVehicleRequest = VehicleUpsertRequest

export type UpdateVehicleRequest = VehicleUpsertRequest

export type VehicleFormValues = {
  name: string
  type: string
  registrationNumber: string
  document: string | File | null
  status: string
  site: string
}

export type UploadSingleFileResponse = {
  success: boolean
  message: string
  data?: {
    filename: string
    originalName: string
    mimeType: string
    size: number
    url: string
  }
}
