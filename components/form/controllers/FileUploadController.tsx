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

export function FileUploadController<TFormValues extends FieldValues>({
  form,
  fieldConfig,
  name,
  disabled,
}: ControllerBaseProps<TFormValues>) {
  return (
    <FormField
      control={form.control}
      name={name as never}
      render={({ field }) => (
        <FormItem>
          {fieldConfig.label ? (
            <FormLabel>{fieldConfig.label}</FormLabel>
          ) : null}
          <FormControl>
            <Input
              type="file"
              disabled={disabled}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null
                field.onChange(file)
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
