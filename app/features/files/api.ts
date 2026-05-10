import { getAccessToken } from "~/features/auth/auth-storage"
import { ApiRequestError } from "~/services/api-error"
import type {
  FileUploadApiErrorBody,
  FileUploadApiSuccess,
} from "~/types/file-upload"
import { API_BASE_URL } from "~/utils/constants"

/**
 * Turn a path such as `/api/files/public/uuid.pdf` into an absolute URL using
 * `API_BASE_URL` as base (same origin as API calls).
 */
export function resolveUploadedFilePublicUrl(pathOrAbsoluteUrl: string): string {
  const raw = pathOrAbsoluteUrl.trim()
  if (/^https?:\/\//i.test(raw)) {
    return raw
  }
  const path = raw.startsWith("/") ? raw : `/${raw}`
  const base = API_BASE_URL.replace(/\/+$/, "")
  return new URL(path, `${base}/`).href
}

function parseUploadErrorMessage(
  status: number,
  code: string | undefined
): string | undefined {
  if (code === "FILE_REQUIRED") {
    return "Please choose a file to upload"
  }
  if (code === "UNSUPPORTED_MEDIA_TYPE") {
    return "Only JPEG, PNG, WebP, or PDF files are allowed"
  }
  if (code === "FILE_TOO_LARGE") {
    return "File is too large (max 5 MB unless configured otherwise on the server)"
  }
  if (status === 401) {
    return "Sign in again to upload files"
  }
  return undefined
}

/**
 * POST /api/files/upload — multipart field `file`; do not set Content-Type (browser sets boundary).
 */
export async function uploadAuthenticatedFile(file: File): Promise<{
  fileId: string
  url: string
}> {
  const token = getAccessToken()
  if (!token) {
    throw new Error("Access token is required")
  }

  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch(`${API_BASE_URL}/files/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  const text = await response.text()
  let parsed: unknown = {}
  try {
    parsed = text.trim() ? JSON.parse(text) : {}
  } catch {
    // ignore
  }

  const body = parsed as Partial<FileUploadApiSuccess> & FileUploadApiErrorBody

  if (!response.ok) {
    const code = body.error?.code
    const fallback =
      body.error?.message ??
      (typeof body.message === "string" ? body.message : undefined) ??
      `Upload failed (${response.status})`
    const message =
      parseUploadErrorMessage(response.status, code) ?? fallback
    throw new ApiRequestError(message, {
      status: response.status,
      code,
    })
  }

  if (!body.success || !body.data?.fileId || !body.data?.url) {
    throw new Error("Invalid upload response from server")
  }

  return {
    fileId: body.data.fileId,
    url: resolveUploadedFilePublicUrl(body.data.url),
  }
}
