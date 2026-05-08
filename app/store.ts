import { configureStore } from "@reduxjs/toolkit"

import assignmentsReducer from "~/features/assignments/assignmentsSlice"
import authReducer from "~/features/auth/authSlice"
import dashboardReducer from "~/features/dashboard/dashboardSlice"
import driversReducer from "~/features/drivers/driversSlice"
import sitesReducer from "~/features/sites/sitesSlice"
import vehiclesReducer from "~/features/vehicles/vehiclesSlice"

export const store = configureStore({
  reducer: {
    assignments: assignmentsReducer,
    auth: authReducer,
    dashboard: dashboardReducer,
    drivers: driversReducer,
    sites: sitesReducer,
    vehicles: vehiclesReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
