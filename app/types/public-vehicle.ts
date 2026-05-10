/** `GET /api/public/vehicle-by-registration` — approved vehicles only. */

export type PublicVehicleContractorSummary = {
  name: string
  contactPerson?: string
  mobileNumber?: string
  email?: string
}

export type PublicVehicleSite = {
  name: string
  contactPerson?: string
  mobileNumber?: string
  email?: string
  location?: string
  approvalStatus?: string
  contractor?: PublicVehicleContractorSummary | null
}

export type PublicVehicleDriver = {
  name: string
  licenceNumber?: string
  licenceUrl?: string
  mobileNumber?: string
  approvalStatus?: string
}

export type PublicVehicleLookupData = {
  _id: string
  name: string
  type: string
  registrationNumber: string
  document: string
  approvalStatus: string
  contractor: PublicVehicleContractorSummary
  /** Present when the vehicle is linked to a site (may be omitted by older APIs). */
  site?: PublicVehicleSite | null
  driver: PublicVehicleDriver | null
}

export type PublicVehicleLookupSuccessResponse = {
  success: true
  data: PublicVehicleLookupData
}
