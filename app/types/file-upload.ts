/** POST /api/files/upload — 201 success body */
export type FileUploadApiSuccess = {
  success: true
  data: {
    fileId: string
    /** Path on API host (e.g. `/api/files/public/...`) or absolute URL */
    url: string
  }
}

export type FileUploadApiErrorBody = {
  success?: false
  error?: { message?: string; code?: string }
  message?: string
}
