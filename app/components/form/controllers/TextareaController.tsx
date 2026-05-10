import type { FieldValues } from "react-hook-form"

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form"
import { Textarea } from "~/components/ui/textarea"

import type { ControllerBaseProps } from "~/components/form/controllers/controller-types"

export function TextareaController<TFormValues extends FieldValues>({
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
            <Textarea
              placeholder={fieldConfig.placeholder}
              disabled={disabled}
              value={(field.value as string | undefined) ?? ""}
              onBlur={field.onBlur}
              onChange={(event) => field.onChange(event.target.value)}
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
