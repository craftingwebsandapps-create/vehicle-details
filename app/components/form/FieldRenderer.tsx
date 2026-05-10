import type { FieldValues, UseFormReturn } from "react-hook-form"

import { CheckboxController } from "~/components/form/controllers/CheckboxController"
import { DatePickerController } from "~/components/form/controllers/DatePickerController"
import { FileUploadController } from "~/components/form/controllers/FileUploadController"
import { InputController } from "~/components/form/controllers/InputController"
import { RadioController } from "~/components/form/controllers/RadioController"
import { SelectController } from "~/components/form/controllers/SelectController"
import { SwitchController } from "~/components/form/controllers/SwitchController"
import { TextareaController } from "~/components/form/controllers/TextareaController"
import type { BaseFieldConfig, SelectOption } from "~/types/form-builder"
import { checkPermission, evaluateRule } from "~/utils/form/conditions"

export type FieldRendererProps<TFormValues extends FieldValues> = {
  form: UseFormReturn<FieldValues>
  fieldConfig: BaseFieldConfig<TFormValues>
  values: TFormValues
  role?: string
  options?: SelectOption[]
  optionsLoading?: boolean
  optionsError?: string | null
  nameOverride?: string
}

export function FieldRenderer<TFormValues extends FieldValues>({
  form,
  fieldConfig,
  values,
  role,
  options,
  optionsLoading,
  optionsError,
  nameOverride,
}: FieldRendererProps<TFormValues>) {
  if (!checkPermission(fieldConfig.permissions, role)) {
    return null
  }

  const shouldHide =
    typeof fieldConfig.hidden === "boolean"
      ? fieldConfig.hidden
      : fieldConfig.hidden
        ? evaluateRule(
            fieldConfig.hidden,
            values as unknown as Record<string, unknown>
          )
        : false

  if (shouldHide) {
    return null
  }

  const isDisabled =
    typeof fieldConfig.disabled === "boolean"
      ? fieldConfig.disabled
      : fieldConfig.disabled
        ? evaluateRule(
            fieldConfig.disabled,
            values as unknown as Record<string, unknown>
          )
        : false

  const name = nameOverride ?? String(fieldConfig.name)

  switch (fieldConfig.type) {
    case "text":
    case "email":
    case "password":
    case "number":
    case "hidden":
      return (
        <InputController
          form={form}
          fieldConfig={fieldConfig}
          name={name}
          disabled={isDisabled}
        />
      )
    case "textarea":
      return (
        <TextareaController
          form={form}
          fieldConfig={fieldConfig}
          name={name}
          disabled={isDisabled}
        />
      )
    case "select":
    case "multiselect":
      return (
        <SelectController
          form={form}
          fieldConfig={fieldConfig}
          name={name}
          disabled={isDisabled}
          options={options}
          optionsLoading={optionsLoading}
          optionsError={optionsError}
        />
      )
    case "checkbox":
      return (
        <CheckboxController
          form={form}
          fieldConfig={fieldConfig}
          name={name}
          disabled={isDisabled}
        />
      )
    case "switch":
      return (
        <SwitchController
          form={form}
          fieldConfig={fieldConfig}
          name={name}
          disabled={isDisabled}
        />
      )
    case "radio":
      return (
        <RadioController
          form={form}
          fieldConfig={fieldConfig}
          name={name}
          disabled={isDisabled}
          options={options}
        />
      )
    case "date":
      return (
        <DatePickerController
          form={form}
          fieldConfig={fieldConfig}
          name={name}
          disabled={isDisabled}
        />
      )
    case "file":
      return (
        <FileUploadController
          form={form}
          fieldConfig={fieldConfig}
          name={name}
          disabled={isDisabled}
        />
      )
    default:
      return null
  }
}
