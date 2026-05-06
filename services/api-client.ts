import { API_BASE_URL } from "~/utils/constants"
import {
  clearAccessToken,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "~/features/auth/auth-storage"
import type { RefreshTokenApiResponse } from "~/features/auth/types"

type RequestOptions = RequestInit & {
  timeoutMs?: number
  skipAuthRefresh?: boolean
}

class ApiClient {
  constructor(private readonly baseUrl: string) {}

  private refreshPromise: Promise<string | null> | null = null

  private handleSessionExpired() {
    clearAccessToken()

    if (typeof window === "undefined") {
      return
    }

    if (window.location.pathname !== "/mobile/login") {
      window.location.replace("/mobile/login")
    }
  }

  private async refreshAuthToken() {
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = (async () => {
      const refreshToken = getRefreshToken()

      if (!refreshToken) {
        this.handleSessionExpired()
        return null
      }

      try {
        const response = await this.request<RefreshTokenApiResponse>(
          "/auth/refresh",
          {
            method: "POST",
            skipAuthRefresh: true,
            body: JSON.stringify({ refreshToken }),
          }
        )

        if (!response.success || !response.data?.accessToken) {
          this.handleSessionExpired()
          return null
        }

        setAccessToken(response.data.accessToken)
        if (response.data.refreshToken) {
          setRefreshToken(response.data.refreshToken)
        }

        return response.data.accessToken
      } catch {
        this.handleSessionExpired()
        return null
      }
    })()

    try {
      return await this.refreshPromise
    } finally {
      this.refreshPromise = null
    }
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const {
      timeoutMs = 15_000,
      headers,
      skipAuthRefresh = false,
      ...restOptions
    } = options
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...restOptions,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      })

      if (response.status === 401 && !skipAuthRefresh) {
        const nextAccessToken = await this.refreshAuthToken()

        if (nextAccessToken) {
          const retryHeaders = new Headers(headers)

          if (!retryHeaders.has("Authorization")) {
            retryHeaders.set("Authorization", `Bearer ${nextAccessToken}`)
          }

          const retryResponse = await fetch(`${this.baseUrl}${path}`, {
            ...restOptions,
            signal: controller.signal,
            headers: {
              "Content-Type": "application/json",
              ...Object.fromEntries(retryHeaders.entries()),
            },
          })

          if (!retryResponse.ok) {
            throw new Error(
              `Request failed with status ${retryResponse.status}`
            )
          }

          return (await retryResponse.json()) as T
        }
      }

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      return (await response.json()) as T
    } finally {
      window.clearTimeout(timeout)
    }
  }

  get<T>(path: string, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: "GET" })
  }

  getWithAuth<T>(path: string, accessToken?: string, options?: RequestOptions) {
    return this.get<T>(path, {
      ...options,
      headers: {
        ...(options?.headers ?? {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    })
  }

  post<T>(path: string, body: unknown, options?: RequestOptions) {
    return this.request<T>(path, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
