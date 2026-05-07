import type { ReactNode } from "react"
import type { FieldValues, Path, UseFormReturn } from "react-hook-form"
import type { ZodType, ZodTypeAny } from "zod"

export type FormFieldType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "textarea"
  | "select"
  | "multiselect"
  | "checkbox"
  | "switch"
  | "radio"
  | "date"
  | "file"
  | "hidden"

export type ConditionalOperator =
  | "equals"
  | "notEquals"
  | "in"
  | "notIn"
  | "truthy"
  | "falsy"

export type ConditionalRule = {
  field: string
  operator: ConditionalOperator
  value?: unknown
}

export type SelectOption = {
  label: string
  value: string
  disabled?: boolean
  parentValue?: string
}

export type FieldValidationConfig = {
  required?: boolean | string
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  email?: boolean
  integer?: boolean
  minItems?: number
  maxItems?: number
  customSchema?: ZodType
  requiredWhen?: ConditionalRule
}

export type FieldPermissions = {
  roles?: string[]
}

export type GridConfig = {
  colSpan?: number
  className?: string
}

export type OptionLoaderContext<TFormValues extends FieldValues = FieldValues> =
  {
    values: TFormValues
    signal?: AbortSignal
  }

export type BaseFieldConfig<TFormValues extends FieldValues = FieldValues> = {
  type: FormFieldType
  name: Path<TFormValues> | string
  label?: string
  placeholder?: string
  description?: string
  defaultValue?: unknown
  validation?: FieldValidationConfig
  options?: SelectOption[]
  loadOptions?: (
    ctx: OptionLoaderContext<TFormValues>
  ) => Promise<SelectOption[]>
  dependsOn?: string[]
  hidden?: boolean | ConditionalRule
  disabled?: boolean | ConditionalRule
  required?: boolean
  grid?: GridConfig
  permissions?: FieldPermissions
  props?: Record<string, unknown>
  render?: (ctx: CustomRenderContext<TFormValues>) => ReactNode
}

export type ArraySectionConfig<TFormValues extends FieldValues = FieldValues> =
  {
    name: Path<TFormValues> | string
    label: string
    description?: string
    minItems?: number
    maxItems?: number
    addButtonLabel?: string
    removeButtonLabel?: string
    defaultItem?: Record<string, unknown>
    fields: BaseFieldConfig<TFormValues>[]
    grid?: GridConfig
  }

export type FormConfig<TFormValues extends FieldValues = FieldValues> = {
  id: string
  title?: string
  description?: string
  schema?: ZodTypeAny
  gridColumns?: number
  fields: BaseFieldConfig<TFormValues>[]
  arrays?: ArraySectionConfig<TFormValues>[]
  submitLabel?: string
  resetLabel?: string
}

export type CustomRenderContext<TFormValues extends FieldValues = FieldValues> =
  {
    field: BaseFieldConfig<TFormValues>
    values: TFormValues
    form: UseFormReturn<TFormValues>
  }

export type FormBuilderProps<TFormValues extends FieldValues = FieldValues> = {
  config: FormConfig<TFormValues>
  onSubmit: (values: TFormValues) => Promise<void> | void
  defaultValues?: Partial<TFormValues>
  className?: string
  isSubmitting?: boolean
  onReset?: () => void
  role?: string
  persistenceKey?: string
  serverErrors?: Record<string, string>
  /**
   * Hide the built-in submit/reset buttons (useful when using GenericDialog footer)
   * @default false
   */
  hideButtons?: boolean
}
