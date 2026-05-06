export type MobileLoginPayload = {
  email: string
  password: string
}

export type MobileLoginResponse = {
  accessToken: string
  refreshToken: string
}

export type MobileLoginApiResponse = {
  success: boolean
  message: string
  data: MobileLoginResponse
}
