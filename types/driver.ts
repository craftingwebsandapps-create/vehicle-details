export type Driver = {
  id: string
  name: string
  licenceNumber: string
  mobileNumber: string
  status: string
  licenceUrl?: string
  contractor?: {
    id: string
    name: string
  }
  site?: {
    id: string
    name: string
    location?: string
  }
  vehicle?: {
    id: string
    name: string
    registrationNumber?: string
  }
  createdAt?: string
  updatedAt?: string
}

export type DriverMeta = {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export type DriverContractorApiEntity = {
  _id: string
  name: string
  contactPerson?: string
  mobileNumber?: string
  email?: string
  status?: string
}

export type DriverSiteApiEntity = {
  _id: string
  name: string
  location?: string
  status?: string
}

export type DriverVehicleApiEntity = {
  _id: string
  name: string
  type?: string
  registrationNumber?: string
  status?: string
}

export type DriverApiEntity = {
  id?: string
  _id?: string
  name: string
  licenceNumber: string
  mobileNumber: string
  status: string
  licenceUrl?: string
  contractor?: string | DriverContractorApiEntity
  site?: string | DriverSiteApiEntity
  vehicle?: string | DriverVehicleApiEntity
  createdAt?: string
  updatedAt?: string
}

export type DriverListResponse = {
  success: boolean
  message: string
  data: {
    data: DriverApiEntity[]
    meta: DriverMeta
  }
}

export type DriverUpsertRequest = {
  name: string
  licenceNumber: string
  licenceUrl: string
  mobileNumber: string
  contractor: string
  status: string
}

export type CreateDriverRequest = DriverUpsertRequest

export type UpdateDriverRequest = DriverUpsertRequest

export type DriverFormValues = {
  name: string
  licenceNumber: string
  licenceUrl: string
  mobileNumber: string
  contractor: string
  status: string
  licenceFile: File | null
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
