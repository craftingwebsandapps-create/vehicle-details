import { useAppSelector } from "~/app/hooks"

export const useAuthState = () => {
  return useAppSelector((state) => state.auth)
}

export const useIsMobileAuthenticated = () => {
  return useAppSelector((state) => state.auth.isAuthenticated)
}
