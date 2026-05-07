import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

import { listSites } from "~/features/sites/api"
import type { Site } from "~/features/sites/types"

const PAGE_SIZE = 20

type SitesState = {
  items: Site[]
  currentPage: number
  hasNextPage: boolean
  status: "idle" | "loading" | "succeeded" | "failed"
  loadMoreStatus: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

const initialState: SitesState = {
  items: [],
  currentPage: 0,
  hasNextPage: false,
  status: "idle",
  loadMoreStatus: "idle",
  error: null,
}

export const fetchSitesThunk = createAsyncThunk(
  "sites/fetchFirst",
  async (_, { rejectWithValue }) => {
    try {
      return await listSites({ page: 1, limit: PAGE_SIZE })
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Unable to fetch sites"
      )
    }
  }
)

export const fetchMoreSitesThunk = createAsyncThunk(
  "sites/fetchMore",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { sites: SitesState }
      const nextPage = state.sites.currentPage + 1
      return await listSites({ page: nextPage, limit: PAGE_SIZE })
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Unable to fetch sites"
      )
    }
  }
)

const sitesSlice = createSlice({
  name: "sites",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSitesThunk.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchSitesThunk.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.items = action.payload.items
        state.currentPage = action.payload.meta.page
        state.hasNextPage =
          action.payload.meta.page < action.payload.meta.totalPages
      })
      .addCase(fetchSitesThunk.rejected, (state, action) => {
        state.status = "failed"
        state.error =
          (action.payload as string | undefined) ??
          action.error.message ??
          "Unable to fetch sites"
      })
      .addCase(fetchMoreSitesThunk.pending, (state) => {
        state.loadMoreStatus = "loading"
      })
      .addCase(fetchMoreSitesThunk.fulfilled, (state, action) => {
        state.loadMoreStatus = "succeeded"
        state.items = [...state.items, ...action.payload.items]
        state.currentPage = action.payload.meta.page
        state.hasNextPage =
          action.payload.meta.page < action.payload.meta.totalPages
      })
      .addCase(fetchMoreSitesThunk.rejected, (state, action) => {
        state.loadMoreStatus = "failed"
        state.error =
          (action.payload as string | undefined) ??
          action.error.message ??
          "Unable to fetch more sites"
      })
  },
})

export default sitesSlice.reducer
