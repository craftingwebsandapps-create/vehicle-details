import { getAccessToken } from "~/features/auth/auth-storage"

export const isMobileAuthenticated = () => {
  return !!getAccessToken()
}

export const isAdminAuthenticated = () => {
  return !!getAccessToken()
}
