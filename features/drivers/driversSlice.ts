import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

import { listDrivers } from "~/features/drivers/api"
import type { Driver, DriverMeta } from "~/types/driver"

type DriversState = {
  items: Driver[]
  meta: DriverMeta | null
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

const initialState: DriversState = {
  items: [],
  meta: null,
  status: "idle",
  error: null,
}

export const fetchDriversThunk = createAsyncThunk(
  "drivers/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await listDrivers({ page: 1, limit: 10 })
      return response
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Unable to fetch drivers"
      )
    }
  }
)

const driversSlice = createSlice({
  name: "drivers",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDriversThunk.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchDriversThunk.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.items = action.payload.items
        state.meta = action.payload.meta
      })
      .addCase(fetchDriversThunk.rejected, (state, action) => {
        state.status = "failed"
        state.error =
          (action.payload as string | undefined) ??
          action.error.message ??
          "Unable to fetch drivers"
      })
  },
})

export default driversSlice.reducer
