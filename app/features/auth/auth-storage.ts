const ACCESS_TOKEN_KEY = "accessToken"
const REFRESH_TOKEN_KEY = "refreshToken"

let migratedLocalStorageTokens = false

/** Move tokens from localStorage (legacy) into sessionStorage once per tab. */
function migrateTokensFromLocalStorageIfNeeded() {
  if (migratedLocalStorageTokens || typeof window === "undefined") {
    return
  }
  migratedLocalStorageTokens = true
  try {
    const lsAccess = localStorage.getItem(ACCESS_TOKEN_KEY)
    const lsRefresh = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (lsAccess && !sessionStorage.getItem(ACCESS_TOKEN_KEY)) {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, lsAccess)
      localStorage.removeItem(ACCESS_TOKEN_KEY)
    }
    if (lsRefresh && !sessionStorage.getItem(REFRESH_TOKEN_KEY)) {
      sessionStorage.setItem(REFRESH_TOKEN_KEY, lsRefresh)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
    }
  } catch {
    // ignore (e.g. disabled storage)
  }
}

export const getAccessToken = () => {
  migrateTokensFromLocalStorageIfNeeded()
  if (typeof window === "undefined") {
    return null
  }
  return sessionStorage.getItem(ACCESS_TOKEN_KEY)
}

export const setAccessToken = (token: string) => {
  if (typeof window === "undefined") {
    return
  }
  sessionStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export const getRefreshToken = () => {
  migrateTokensFromLocalStorageIfNeeded()
  if (typeof window === "undefined") {
    return null
  }
  return sessionStorage.getItem(REFRESH_TOKEN_KEY)
}

export const setRefreshToken = (token: string) => {
  if (typeof window === "undefined") {
    return
  }
  sessionStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export const clearAccessToken = () => {
  if (typeof window === "undefined") {
    return
  }
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  } catch {
    // ignore
  }
}
