import type {
  MobileLoginPayload,
  MobileLoginResponse,
} from "~/features/auth/types"

export const mobileLogin = async (
  payload: MobileLoginPayload
): Promise<MobileLoginResponse> => {
  await new Promise((resolve) => window.setTimeout(resolve, 500))

  if (!payload.username || !payload.password) {
    throw new Error("Username and password are required")
  }

  return {
    accessToken: `mobile-token-${Date.now()}`,
  }
}
