import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export type MobileTabKey =
  | "dashboard"
  | "sites"
  | "vehicles"
  | "drivers"
  | "assignments"

type UiState = {
  activeMobileTab: MobileTabKey
  mobileMenuOpen: boolean
}

const initialState: UiState = {
  activeMobileTab: "dashboard",
  mobileMenuOpen: false,
}

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setActiveMobileTab(state, action: PayloadAction<MobileTabKey>) {
      state.activeMobileTab = action.payload
    },
    setMobileMenuOpen(state, action: PayloadAction<boolean>) {
      state.mobileMenuOpen = action.payload
    },
  },
})

export const { setActiveMobileTab, setMobileMenuOpen } = uiSlice.actions

export default uiSlice.reducer
