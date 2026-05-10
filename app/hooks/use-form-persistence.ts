import { useEffect } from "react"
import type { FieldValues, UseFormReturn } from "react-hook-form"

const safeParse = <T>(value: string): T | null => {
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

export const useFormPersistence = <TFormValues extends FieldValues>(
  form: UseFormReturn<TFormValues, unknown, FieldValues>,
  key: string | undefined
) => {
  useEffect(() => {
    if (!key) {
      return
    }

    const raw = window.localStorage.getItem(key)

    if (!raw) {
      return
    }

    const parsed = safeParse<Partial<TFormValues>>(raw)

    if (!parsed) {
      return
    }

    form.reset({ ...form.getValues(), ...parsed })
  }, [form, key])

  useEffect(() => {
    if (!key) {
      return
    }

    const subscription = form.watch((values) => {
      window.localStorage.setItem(key, JSON.stringify(values))
    })

    return () => subscription.unsubscribe()
  }, [form, key])

  const clearPersistedData = () => {
    if (!key) {
      return
    }

    window.localStorage.removeItem(key)
  }

  return { clearPersistedData }
}
