import { API_BASE_URL } from "~/utils/constants"

type RequestOptions = RequestInit & {
  timeoutMs?: number
}

class ApiClient {
  constructor(private readonly baseUrl: string) {}

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { timeoutMs = 15_000, headers, ...restOptions } = options
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

  post<T>(path: string, body: unknown, options?: RequestOptions) {
    return this.request<T>(path, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
