import { useEffect, useMemo, useState } from "react"
import type { FieldValues } from "react-hook-form"

import type { BaseFieldConfig, SelectOption } from "~/types/form-builder"
import { getByPath } from "~/utils/form/path"

type DynamicOptionsResult = {
  optionsByField: Record<string, SelectOption[]>
  loadingByField: Record<string, boolean>
  errorByField: Record<string, string | null>
}

export const useDynamicOptions = <TFormValues extends FieldValues>(
  fields: BaseFieldConfig<TFormValues>[],
  values: TFormValues
): DynamicOptionsResult => {
  const [optionsByField, setOptionsByField] = useState<
    Record<string, SelectOption[]>
  >({})
  const [loadingByField, setLoadingByField] = useState<Record<string, boolean>>(
    {}
  )
  const [errorByField, setErrorByField] = useState<
    Record<string, string | null>
  >({})

  const dynamicFields = useMemo(
    () =>
      fields.filter(
        (field) => field.type === "select" || field.type === "multiselect"
      ),
    [fields]
  )

  useEffect(() => {
    dynamicFields.forEach((field) => {
      const fieldName = String(field.name)

      if (field.options) {
        setOptionsByField((prev) => ({
          ...prev,
          [fieldName]: field.options ?? [],
        }))
      }

      if (!field.loadOptions) {
        return
      }

      const dependencies = field.dependsOn ?? []
      const hasMissingDependency = dependencies.some((dependency) => {
        const dependencyValue = getByPath(
          values as Record<string, unknown>,
          dependency
        )
        return (
          dependencyValue === null ||
          dependencyValue === undefined ||
          dependencyValue === ""
        )
      })

      if (hasMissingDependency) {
        setOptionsByField((prev) => ({ ...prev, [fieldName]: [] }))
        return
      }

      const controller = new AbortController()

      setLoadingByField((prev) => ({ ...prev, [fieldName]: true }))
      setErrorByField((prev) => ({ ...prev, [fieldName]: null }))

      void field
        .loadOptions({ values, signal: controller.signal })
        .then((options) => {
          setOptionsByField((prev) => ({ ...prev, [fieldName]: options }))
        })
        .catch((error: unknown) => {
          if (error instanceof Error && error.name === "AbortError") {
            return
          }

          const message =
            error instanceof Error ? error.message : "Unable to load options"
          setErrorByField((prev) => ({ ...prev, [fieldName]: message }))
        })
        .finally(() => {
          setLoadingByField((prev) => ({ ...prev, [fieldName]: false }))
        })

      return () => controller.abort()
    })
  }, [dynamicFields, values])

  return { optionsByField, loadingByField, errorByField }
}
