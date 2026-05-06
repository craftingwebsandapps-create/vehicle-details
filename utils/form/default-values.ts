import type { FieldValues } from "react-hook-form"

import type { FormConfig } from "~/types/form-builder"
import { setByPath } from "~/utils/form/path"

export const buildDefaultValues = <TFormValues extends FieldValues>(
  config: FormConfig<TFormValues>,
  existingDefaults: Partial<TFormValues> = {}
): TFormValues => {
  let defaults = existingDefaults as Record<string, unknown>

  config.fields.forEach((field) => {
    if (field.defaultValue === undefined) {
      return
    }

    defaults = setByPath(defaults, String(field.name), field.defaultValue)
  })

  config.arrays?.forEach((section) => {
    if (!section.defaultItem) {
      return
    }

    defaults = setByPath(defaults, String(section.name), [section.defaultItem])
  })

  return defaults as TFormValues
}
