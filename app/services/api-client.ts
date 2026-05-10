import { API_BASE_URL } from "~/utils/constants"
import {
  clearAccessToken,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "~/features/auth/auth-storage"
import type { RefreshTokenApiResponse } from "~/features/auth/types"
import { ApiRequestError } from "~/services/api-error"

type RequestOptions = RequestInit & {
  timeoutMs?: number
  skipAuthRefresh?: boolean
}

class ApiClient {
  constructor(private readonly baseUrl: string) {}

  private refreshPromise: Promise<string | null> | null = null

  private async parseSuccessBody<T>(response: Response): Promise<T> {
    if (response.status === 204) {
      return undefined as T
    }
    const text = await response.text()
    if (!text.trim()) {
      return undefined as T
    }
    return JSON.parse(text) as T
  }

  private async parseErrorBody(response: Response): Promise<never> {
    const text = await response.text()
    let message = `Request failed with status ${response.status}`
    let code: string | undefined
    try {
      const parsed = JSON.parse(text) as {
        success?: boolean
        error?: { message?: string; code?: string }
        message?: string
      }
      code = parsed?.error?.code
      if (parsed?.error?.message) {
        message = parsed.error.message
      } else if (typeof parsed?.message === "string") {
        message = parsed.message
      }
    } catch {
      // ignore
    }
    throw new ApiRequestError(message, {
      status: response.status,
      code,
    })
  }

  private handleSessionExpired() {
    clearAccessToken()

    if (typeof window === "undefined") {
      return
    }

    const path = window.location.pathname
    const login = path.startsWith("/admin") ? "/admin/login" : "/mobile/login"

    if (path !== login) {
      window.location.replace(login)
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

        void Promise.all([
          import("~/store"),
          import("~/features/auth/authSlice"),
        ]).then(([{ store }, authMod]) => {
          store.dispatch(authMod.syncSessionFromStorage())
        })

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
          const retryHeaders = new Headers(headers ?? undefined)
          retryHeaders.set("Authorization", `Bearer ${nextAccessToken}`)

          const retryResponse = await fetch(`${this.baseUrl}${path}`, {
            ...restOptions,
            signal: controller.signal,
            headers: {
              "Content-Type": "application/json",
              ...Object.fromEntries(retryHeaders.entries()),
            },
          })

          if (!retryResponse.ok) {
            await this.parseErrorBody(retryResponse)
          }

          return await this.parseSuccessBody<T>(retryResponse)
        }
      }

      if (!response.ok) {
        await this.parseErrorBody(response)
      }

      return await this.parseSuccessBody<T>(response)
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

  postWithAuth<T>(
    path: string,
    body: unknown,
    accessToken?: string,
    options?: RequestOptions
  ) {
    return this.post<T>(path, body, {
      ...options,
      headers: {
        ...(options?.headers ?? {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    })
  }

  put<T>(path: string, body: unknown, options?: RequestOptions) {
    return this.request<T>(path, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    })
  }

  putWithAuth<T>(
    path: string,
    body: unknown,
    accessToken?: string,
    options?: RequestOptions
  ) {
    return this.put<T>(path, body, {
      ...options,
      headers: {
        ...(options?.headers ?? {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    })
  }

  patch<T>(path: string, body: unknown, options?: RequestOptions) {
    return this.request<T>(path, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
    })
  }

  patchWithAuth<T>(
    path: string,
    body: unknown,
    accessToken?: string,
    options?: RequestOptions
  ) {
    return this.patch<T>(path, body, {
      ...options,
      headers: {
        ...(options?.headers ?? {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    })
  }

  delete<T = void>(path: string, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: "DELETE" })
  }

  deleteWithAuth<T = void>(
    path: string,
    accessToken?: string,
    options?: RequestOptions
  ) {
    return this.delete<T>(path, {
      ...options,
      headers: {
        ...(options?.headers ?? {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
