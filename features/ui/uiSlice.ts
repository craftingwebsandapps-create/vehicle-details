import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export type MobileTabKey = "home" | "search" | "orders" | "profile"

type UiState = {
  activeMobileTab: MobileTabKey
  mobileMenuOpen: boolean
}

const initialState: UiState = {
  activeMobileTab: "home",
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