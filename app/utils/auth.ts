export const isMobileAuthenticated = () => {
  return !!localStorage.getItem("accessToken")
}

export const isAdminAuthenticated = () => {
  return !!localStorage.getItem("accessToken")
}
