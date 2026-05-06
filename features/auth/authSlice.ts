import { createSlice } from "@reduxjs/toolkit"

export type AuthUser = {
  name: string
  email: string
  initials: string
}

const demoUser: AuthUser = {
  name: "Aarav Kumar",
  email: "aarav.kumar@example.com",
  initials: "AK",
}

type AuthState = {
  isAuthenticated: boolean
  user: AuthUser | null
}

const initialState: AuthState = {
  isAuthenticated: true,
  user: demoUser,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    signInDemo(state) {
      state.isAuthenticated = true
      state.user = demoUser
    },
    signOut(state) {
      state.isAuthenticated = false
      state.user = null
    },
  },
})

export const { signInDemo, signOut } = authSlice.actions

export default authSlice.reducer