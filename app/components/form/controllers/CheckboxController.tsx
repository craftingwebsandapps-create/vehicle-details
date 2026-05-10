import type { FieldValues } from "react-hook-form"

import { Checkbox } from "~/components/ui/checkbox"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form"

import type { ControllerBaseProps } from "~/components/form/controllers/controller-types"

export function CheckboxController<TFormValues extends FieldValues>({
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
          <FormControl>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={Boolean(field.value)}
                disabled={disabled}
                onCheckedChange={field.onChange}
              />
              {fieldConfig.label}
            </label>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
