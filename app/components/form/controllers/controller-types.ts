import type { FieldValues, UseFormReturn } from "react-hook-form"

import type { BaseFieldConfig, SelectOption } from "~/types/form-builder"

export type ControllerBaseProps<TFormValues extends FieldValues> = {
  form: UseFormReturn<FieldValues>
  fieldConfig: BaseFieldConfig<TFormValues>
  name: string
  disabled?: boolean
  options?: SelectOption[]
  optionsLoading?: boolean
  optionsError?: string | null
}
