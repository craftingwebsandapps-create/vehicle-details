import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

import { listDrivers } from "~/features/drivers/api"
import type { Driver, ListDriversParams } from "~/types/driver"

const PAGE_SIZE = 20

type DriversState = {
  items: Driver[]
  currentPage: number
  hasNextPage: boolean
  currentFilters: Omit<ListDriversParams, "page" | "limit">
  status: "idle" | "loading" | "succeeded" | "failed"
  loadMoreStatus: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

const initialState: DriversState = {
  items: [],
  currentPage: 0,
  hasNextPage: false,
  currentFilters: {},
  status: "idle",
  loadMoreStatus: "idle",
  error: null,
}

export const fetchDriversThunk = createAsyncThunk(
  "drivers/fetchFirst",
  async (
    filters: Omit<ListDriversParams, "page" | "limit"> | undefined,
    { rejectWithValue }
  ) => {
    try {
      const appliedFilters = filters ?? {}
      const response = await listDrivers({
        page: 1,
        limit: PAGE_SIZE,
        ...appliedFilters,
      })
      return {
        ...response,
        filters: appliedFilters,
      }
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Unable to fetch drivers"
      )
    }
  }
)

export const fetchMoreDriversThunk = createAsyncThunk(
  "drivers/fetchMore",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { drivers: DriversState }
      const nextPage = state.drivers.currentPage + 1
      return await listDrivers({
        page: nextPage,
        limit: PAGE_SIZE,
        ...state.drivers.currentFilters,
      })
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
        state.currentFilters = action.payload.filters
        state.currentPage = action.payload.meta.page
        state.hasNextPage =
          action.payload.meta.page < action.payload.meta.totalPages
      })
      .addCase(fetchDriversThunk.rejected, (state, action) => {
        state.status = "failed"
        state.error =
          (action.payload as string | undefined) ??
          action.error.message ??
          "Unable to fetch drivers"
      })
      .addCase(fetchMoreDriversThunk.pending, (state) => {
        state.loadMoreStatus = "loading"
      })
      .addCase(fetchMoreDriversThunk.fulfilled, (state, action) => {
        state.loadMoreStatus = "succeeded"
        state.items = [...state.items, ...action.payload.items]
        state.currentPage = action.payload.meta.page
        state.hasNextPage =
          action.payload.meta.page < action.payload.meta.totalPages
      })
      .addCase(fetchMoreDriversThunk.rejected, (state, action) => {
        state.loadMoreStatus = "failed"
        state.error =
          (action.payload as string | undefined) ??
          action.error.message ??
          "Unable to fetch more drivers"
      })
  },
})

export default driversSlice.reducer
