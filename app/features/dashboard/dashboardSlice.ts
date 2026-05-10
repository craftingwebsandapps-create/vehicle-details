import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

import { getAccessToken } from "~/features/auth/auth-storage"
import { getApiErrorMeta } from "~/services/api-error"
import type { DashboardData } from "~/types/dashboard"
import { fetchDashboard } from "./api"

type DashboardState = {
  data: DashboardData | null
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
  errorCode?: string
}

const initialState: DashboardState = {
  data: null,
  status: "idle",
  error: null,
  errorCode: undefined,
}

export const fetchDashboardThunk = createAsyncThunk(
  "dashboard/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const token = getAccessToken()
      const response = await fetchDashboard(token ?? "")

      if (!response.success || !response.data) {
        return rejectWithValue({
          message: response.error?.message || "Unable to fetch dashboard data",
          code: response.error?.code,
        })
      }

      return response.data
    } catch (error: unknown) {
      const meta = getApiErrorMeta(error)
      return rejectWithValue({
        message: meta.message || "Unable to fetch dashboard data",
        code: meta.code,
      })
    }
  }
)

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardThunk.pending, (state) => {
        state.status = "loading"
        state.error = null
        state.errorCode = undefined
      })
      .addCase(fetchDashboardThunk.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.data = action.payload
      })
      .addCase(fetchDashboardThunk.rejected, (state, action) => {
        state.status = "failed"
        const payload = action.payload as
          | { message?: string; code?: string }
          | undefined
        state.error =
          payload?.message ?? action.error.message ?? "Unable to fetch dashboard data"
        state.errorCode = payload?.code
      })
  },
})

export default dashboardSlice.reducer
