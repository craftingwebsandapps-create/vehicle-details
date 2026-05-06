import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

import { listSites } from "~/features/sites/api"
import type { Site } from "~/features/sites/types"

type SitesState = {
  items: Site[]
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

const initialState: SitesState = {
  items: [],
  status: "idle",
  error: null,
}

export const fetchSitesThunk = createAsyncThunk(
  "sites/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await listSites({ page: 1, limit: 100 })
      return response.items
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
        state.items = action.payload
      })
      .addCase(fetchSitesThunk.rejected, (state, action) => {
        state.status = "failed"
        state.error =
          (action.payload as string | undefined) ??
          action.error.message ??
          "Unable to fetch sites"
      })
  },
})

export default sitesSlice.reducer
