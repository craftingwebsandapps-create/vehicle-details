import { configureStore } from "@reduxjs/toolkit"

import authReducer from "~/features/auth/authSlice"
import sitesReducer from "~/features/sites/sitesSlice"
import vehiclesReducer from "~/features/vehicles/vehiclesSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    sites: sitesReducer,
    vehicles: vehiclesReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
