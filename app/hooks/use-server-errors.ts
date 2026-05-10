import { useEffect } from "react"
import type { FieldValues, Path, UseFormReturn } from "react-hook-form"

export const useServerErrors = <TFormValues extends FieldValues>(
  form: UseFormReturn<TFormValues, unknown, FieldValues>,
  serverErrors: Record<string, string> | undefined
) => {
  useEffect(() => {
    if (!serverErrors) {
      return
    }

    Object.entries(serverErrors).forEach(([path, message]) => {
      form.setError(path as Path<TFormValues>, {
        type: "server",
        message,
      })
    })
  }, [form, serverErrors])
}
