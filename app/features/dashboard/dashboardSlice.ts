import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

import { getAccessToken } from "~/features/auth/auth-storage"
import type { DashboardData } from "~/types/dashboard"
import { fetchDashboard } from "./api"

type DashboardState = {
  data: DashboardData | null
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

const initialState: DashboardState = {
  data: null,
  status: "idle",
  error: null,
}

export const fetchDashboardThunk = createAsyncThunk(
  "dashboard/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const token = getAccessToken()
      const response = await fetchDashboard(token ?? "")

      if (!response.success) {
        throw new Error(response.message || "Unable to fetch dashboard data")
      }

      return response.data
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Unable to fetch dashboard data"
      )
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
      })
      .addCase(fetchDashboardThunk.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.data = action.payload
      })
      .addCase(fetchDashboardThunk.rejected, (state, action) => {
        state.status = "failed"
        state.error =
          (action.payload as string | undefined) ??
          action.error.message ??
          "Unable to fetch dashboard data"
      })
  },
})

export default dashboardSlice.reducer
