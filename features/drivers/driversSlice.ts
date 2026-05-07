import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

import { getAccessToken } from "~/features/auth/auth-storage"
import { apiClient } from "~/services/api-client"
import type {
  Driver,
  DriverApiEntity,
  DriverListResponse,
  DriverMeta,
} from "~/types/driver"

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

const normalizeEntityRef = <T extends { _id: string; name: string }>(
  value: string | T | undefined
) => {
  if (!value || typeof value === "string") {
    return undefined
  }

  return {
    id: value._id,
    name: value.name,
    raw: value,
  }
}

const toDriver = (entity: DriverApiEntity): Driver => ({
  id: entity.id ?? entity._id ?? "",
  name: entity.name,
  licenceNumber: entity.licenceNumber,
  mobileNumber: entity.mobileNumber,
  status: entity.status,
  licenceUrl: entity.licenceUrl,
  contractor: (() => {
    const contractorRef = normalizeEntityRef(entity.contractor)

    if (!contractorRef) {
      return undefined
    }

    return {
      id: contractorRef.id,
      name: contractorRef.name,
    }
  })(),
  site: (() => {
    const siteRef = normalizeEntityRef(entity.site)

    if (!siteRef) {
      return undefined
    }

    return {
      id: siteRef.id,
      name: siteRef.name,
      location: (siteRef.raw as { location?: string }).location,
    }
  })(),
  vehicle: (() => {
    const vehicleRef = normalizeEntityRef(entity.vehicle)

    if (!vehicleRef) {
      return undefined
    }

    return {
      id: vehicleRef.id,
      name: vehicleRef.name,
      registrationNumber: (vehicleRef.raw as { registrationNumber?: string })
        .registrationNumber,
    }
  })(),
  createdAt: entity.createdAt,
  updatedAt: entity.updatedAt,
})

export const fetchDriversThunk = createAsyncThunk(
  "drivers/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const token = getAccessToken()
      const response = await apiClient.getWithAuth<DriverListResponse>(
        "/drivers?page=1&limit=10",
        token ?? undefined
      )

      if (!response.success) {
        throw new Error(response.message || "Unable to fetch drivers")
      }

      return {
        items: response.data.data.map(toDriver),
        meta: response.data.meta,
      }
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
