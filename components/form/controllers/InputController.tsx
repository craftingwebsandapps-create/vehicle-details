import type { FieldValues } from "react-hook-form"

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form"
import { Input } from "~/components/ui/input"

import type { ControllerBaseProps } from "~/components/form/controllers/controller-types"

export function InputController<TFormValues extends FieldValues>({
  form,
  fieldConfig,
  name,
  disabled,
}: ControllerBaseProps<TFormValues>) {
  const inputType = fieldConfig.type === "hidden" ? "hidden" : fieldConfig.type

  return (
    <FormField
      control={form.control}
      name={name as never}
      render={({ field }) => (
        <FormItem className={inputType === "hidden" ? "hidden" : undefined}>
          {fieldConfig.label ? (
            <FormLabel>{fieldConfig.label}</FormLabel>
          ) : null}
          <FormControl>
            <Input
              type={inputType}
              placeholder={fieldConfig.placeholder}
              disabled={disabled}
              value={
                typeof field.value === "number"
                  ? String(field.value)
                  : ((field.value as string | undefined) ?? "")
              }
              onBlur={field.onBlur}
              onChange={(event) => {
                if (fieldConfig.type === "number") {
                  const nextValue = event.target.value
                  field.onChange(
                    nextValue === "" ? undefined : Number(nextValue)
                  )
                  return
                }

                field.onChange(event.target.value)
              }}
              name={field.name}
              ref={field.ref}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
