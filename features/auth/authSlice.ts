import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

import { mobileLogin } from "~/features/auth/api"
import { clearAccessToken, setAccessToken } from "~/features/auth/auth-storage"
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

type AuthState = {
  isAuthenticated: boolean
  user: AuthUser | null
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

const hasToken = () => {
  if (typeof window === "undefined") {
    return false
  }

  return !!localStorage.getItem("accessToken")
}

const initialState: AuthState = {
  isAuthenticated: hasToken(),
  user: hasToken() ? demoUser : null,
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
    signInDemo(state) {
      setAccessToken(`mobile-token-${Date.now()}`)
      state.isAuthenticated = true
      state.user = demoUser
      state.status = "succeeded"
      state.error = null
    },
    signOut(state) {
      clearAccessToken()
      state.isAuthenticated = false
      state.user = null
      state.status = "idle"
      state.error = null
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
        state.isAuthenticated = true
        state.user = demoUser
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

export const { signInDemo, signOut } = authSlice.actions

export default authSlice.reducer
