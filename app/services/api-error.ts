/** Thrown by ApiClient when response.ok is false (includes parsed API codes). */
export class ApiRequestError extends Error {
  readonly status: number
  readonly code?: string

  constructor(
    message: string,
    options: {
      status: number
      code?: string
    }
  ) {
    super(message)
    this.name = "ApiRequestError"
    this.status = options.status
    this.code = options.code
  }
}

export function getApiErrorMeta(error: unknown): {
  message: string
  code?: string
  status?: number
} {
  if (error instanceof ApiRequestError) {
    return {
      message: error.message,
      code: error.code,
      status: error.status,
    }
  }
  if (error instanceof Error) {
    return { message: error.message }
  }
  return { message: "Request failed" }
}
