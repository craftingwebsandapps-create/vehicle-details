/** Standard JSON bodies from vi-backend REST endpoints */

export type ApiSuccessBody<T> = {
  success: true
  data: T
}

export type ApiErrorBody = {
  success: false
  error: {
    message: string
    code?: string
  }
}

export type ApiEnvelope<T> = ApiSuccessBody<T> | ApiErrorBody

export function isApiSuccess<T>(
  body: ApiEnvelope<T>
): body is ApiSuccessBody<T> {
  return body.success === true
}
