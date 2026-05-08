import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

import { listAssignments } from "~/features/assignments/api"
import type { Assignment } from "~/types/assignment"

const PAGE_SIZE = 20

type AssignmentsState = {
  items: Assignment[]
  currentPage: number
  hasNextPage: boolean
  status: "idle" | "loading" | "succeeded" | "failed"
  loadMoreStatus: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

const initialState: AssignmentsState = {
  items: [],
  currentPage: 0,
  hasNextPage: false,
  status: "idle",
  loadMoreStatus: "idle",
  error: null,
}

export const fetchAssignmentsThunk = createAsyncThunk(
  "assignments/fetchFirst",
  async (_, { rejectWithValue }) => {
    try {
      return await listAssignments({ page: 1, limit: PAGE_SIZE })
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Unable to fetch assignments"
      )
    }
  }
)

export const fetchMoreAssignmentsThunk = createAsyncThunk(
  "assignments/fetchMore",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { assignments: AssignmentsState }
      const nextPage = state.assignments.currentPage + 1
      return await listAssignments({ page: nextPage, limit: PAGE_SIZE })
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Unable to fetch more assignments"
      )
    }
  }
)

const assignmentsSlice = createSlice({
  name: "assignments",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssignmentsThunk.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchAssignmentsThunk.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.items = action.payload.items
        state.currentPage = action.payload.meta.page
        state.hasNextPage =
          action.payload.meta.page < action.payload.meta.totalPages
      })
      .addCase(fetchAssignmentsThunk.rejected, (state, action) => {
        state.status = "failed"
        state.error =
          (action.payload as string | undefined) ??
          action.error.message ??
          "Unable to fetch assignments"
      })
      .addCase(fetchMoreAssignmentsThunk.pending, (state) => {
        state.loadMoreStatus = "loading"
      })
      .addCase(fetchMoreAssignmentsThunk.fulfilled, (state, action) => {
        state.loadMoreStatus = "succeeded"
        state.items = [...state.items, ...action.payload.items]
        state.currentPage = action.payload.meta.page
        state.hasNextPage =
          action.payload.meta.page < action.payload.meta.totalPages
      })
      .addCase(fetchMoreAssignmentsThunk.rejected, (state, action) => {
        state.loadMoreStatus = "failed"
        state.error =
          (action.payload as string | undefined) ??
          action.error.message ??
          "Unable to fetch more assignments"
      })
  },
})

export default assignmentsSlice.reducer
