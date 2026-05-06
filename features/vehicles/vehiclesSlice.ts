import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

import { getAccessToken } from "~/features/auth/auth-storage"
import { apiClient } from "~/services/api-client"
import type { Vehicle, VehicleListResponse, VehicleMeta } from "~/types/vehicle"

type VehiclesState = {
  items: Vehicle[]
  meta: VehicleMeta | null
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

const initialState: VehiclesState = {
  items: [],
  meta: null,
  status: "idle",
  error: null,
}

export const fetchVehiclesThunk = createAsyncThunk(
  "vehicles/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const token = getAccessToken()
      const response = await apiClient.get<VehicleListResponse>(
        "/vehicles?page=1&limit=10",
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      )

      if (!response.success) {
        throw new Error(response.message || "Unable to fetch vehicles")
      }

      return response
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Unable to fetch vehicles"
      )
    }
  }
)

const vehiclesSlice = createSlice({
  name: "vehicles",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVehiclesThunk.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchVehiclesThunk.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.items = action.payload.data.data
        state.meta = action.payload.data.meta
      })
      .addCase(fetchVehiclesThunk.rejected, (state, action) => {
        state.status = "failed"
        state.error =
          (action.payload as string | undefined) ??
          action.error.message ??
          "Unable to fetch vehicles"
      })
  },
})

export default vehiclesSlice.reducer
