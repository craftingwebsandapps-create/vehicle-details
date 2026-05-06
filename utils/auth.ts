export const isMobileAuthenticated = () => {
  return !!localStorage.getItem("accessToken")
}
