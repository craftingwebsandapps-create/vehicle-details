import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

import { listVehicles } from "~/features/vehicles/api"
import type { Vehicle, VehicleListFilters } from "~/types/vehicle"

const PAGE_SIZE = 20

type VehiclesState = {
  items: Vehicle[]
  currentPage: number
  hasNextPage: boolean
  currentFilters: VehicleListFilters
  status: "idle" | "loading" | "succeeded" | "failed"
  loadMoreStatus: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

const initialState: VehiclesState = {
  items: [],
  currentPage: 0,
  hasNextPage: false,
  currentFilters: {},
  status: "idle",
  loadMoreStatus: "idle",
  error: null,
}

export const fetchVehiclesThunk = createAsyncThunk(
  "vehicles/fetchFirst",
  async (filters: VehicleListFilters | undefined, { rejectWithValue }) => {
    try {
      const appliedFilters = filters ?? {}
      const response = await listVehicles({
        page: 1,
        limit: PAGE_SIZE,
        ...appliedFilters,
      })
      return { response, filters: appliedFilters }
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Unable to fetch vehicles"
      )
    }
  }
)

export const fetchMoreVehiclesThunk = createAsyncThunk(
  "vehicles/fetchMore",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { vehicles: VehiclesState }
      const nextPage = state.vehicles.currentPage + 1
      const response = await listVehicles({
        page: nextPage,
        limit: PAGE_SIZE,
        ...state.vehicles.currentFilters,
      })
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
        state.items = action.payload.response.data.items
        state.currentFilters = action.payload.filters
        state.currentPage = action.payload.response.data.meta.page
        state.hasNextPage =
          action.payload.response.data.meta.page <
          action.payload.response.data.meta.totalPages
      })
      .addCase(fetchVehiclesThunk.rejected, (state, action) => {
        state.status = "failed"
        state.error =
          (action.payload as string | undefined) ??
          action.error.message ??
          "Unable to fetch vehicles"
      })
      .addCase(fetchMoreVehiclesThunk.pending, (state) => {
        state.loadMoreStatus = "loading"
      })
      .addCase(fetchMoreVehiclesThunk.fulfilled, (state, action) => {
        state.loadMoreStatus = "succeeded"
        state.items = [...state.items, ...action.payload.data.items]
        state.currentPage = action.payload.data.meta.page
        state.hasNextPage =
          action.payload.data.meta.page < action.payload.data.meta.totalPages
      })
      .addCase(fetchMoreVehiclesThunk.rejected, (state, action) => {
        state.loadMoreStatus = "failed"
        state.error =
          (action.payload as string | undefined) ??
          action.error.message ??
          "Unable to fetch more vehicles"
      })
  },
})

export default vehiclesSlice.reducer
