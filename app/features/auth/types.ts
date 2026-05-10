export type MobileLoginPayload = {
  email: string
  password: string
}

export type MobileLoginResponse = {
  accessToken: string
  refreshToken: string
  expiresIn?: number
  /** null → superadmin / no tenant; set → tenant user (mobile app shell). */
  contractorId?: string | null
}

export type MobileLoginApiResponse = {
  success: boolean
  message?: string
  data: MobileLoginResponse
}

export type RefreshTokenPayload = {
  refreshToken: string
}

export type RefreshTokenResponse = {
  accessToken: string
  refreshToken: string
}

export type RefreshTokenApiResponse = {
  success: boolean
  message: string
  data: RefreshTokenResponse
}
