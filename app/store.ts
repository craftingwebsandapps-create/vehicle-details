import { configureStore } from "@reduxjs/toolkit"

import authReducer from "~/features/auth/authSlice"
import vehiclesReducer from "~/features/vehicles/vehiclesSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    vehicles: vehiclesReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
