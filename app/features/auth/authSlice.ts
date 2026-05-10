import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

import { mobileLogin } from "~/features/auth/api"
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
  setRefreshToken,
} from "~/features/auth/auth-storage"
import { getContractorIdFromAccessToken } from "~/features/auth/jwt-utils"
import type { MobileLoginPayload } from "~/features/auth/types"

export type AuthUser = {
  name: string
  email: string
  initials: string
}

const demoUser: AuthUser = {
  name: "Aarav Kumar",
  email: "aarav.kumar@example.com",
  initials: "AK",
}

const getInitials = (value: string) => {
  const source = value.includes("@") ? value.split("@")[0] : value
  const parts = source.split(/[._\s-]+/).filter(Boolean)

  if (parts.length === 0) {
    return "GU"
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}

const buildUserFromEmail = (email: string): AuthUser => {
  const localPart = email.split("@")[0] ?? "Guest User"
  const displayName = localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((chunk) => `${chunk.charAt(0).toUpperCase()}${chunk.slice(1)}`)
    .join(" ")

  return {
    name: displayName || "Guest User",
    email,
    initials: getInitials(email),
  }
}

type AuthState = {
  isAuthenticated: boolean
  user: AuthUser | null
  /** From JWT `contractorId`; null for superadmin or missing claim (UX only). */
  contractorId: string | null
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

const readStoredContractorId = (): string | null => {
  if (typeof window === "undefined") {
    return null
  }
  return getContractorIdFromAccessToken(getAccessToken())
}

const hasToken = () => {
  if (typeof window === "undefined") {
    return false
  }

  return !!getAccessToken()
}

const initialState: AuthState = {
  isAuthenticated: hasToken(),
  user: hasToken() ? demoUser : null,
  contractorId: readStoredContractorId(),
  status: "idle",
  error: null,
}

export const loginMobileThunk = createAsyncThunk(
  "auth/loginMobile",
  async (payload: MobileLoginPayload, { rejectWithValue }) => {
    try {
      return await mobileLogin(payload)
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Login failed"
      )
    }
  }
)

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    signOut(state) {
      clearAccessToken()
      state.isAuthenticated = false
      state.user = null
      state.contractorId = null
      state.status = "idle"
      state.error = null
    },
    /** Call after silent refresh — JWT in storage may have new expiry/claims. */
    syncSessionFromStorage(state) {
      const token = getAccessToken()
      state.isAuthenticated = !!token
      state.contractorId = getContractorIdFromAccessToken(token)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginMobileThunk.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(loginMobileThunk.fulfilled, (state, action) => {
        setAccessToken(action.payload.accessToken)
        setRefreshToken(action.payload.refreshToken)
        state.isAuthenticated = true
        state.user = buildUserFromEmail(action.meta.arg.email)
        state.contractorId =
          action.payload.contractorId !== undefined
            ? action.payload.contractorId
            : getContractorIdFromAccessToken(action.payload.accessToken)
        state.status = "succeeded"
        state.error = null
      })
      .addCase(loginMobileThunk.rejected, (state, action) => {
        state.status = "failed"
        state.error =
          (action.payload as string | undefined) ?? action.error.message ?? null
      })
  },
})

export const { signOut, syncSessionFromStorage } = authSlice.actions

export default authSlice.reducer
