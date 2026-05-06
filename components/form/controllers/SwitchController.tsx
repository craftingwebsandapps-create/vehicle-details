import type { FieldValues } from "react-hook-form"

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form"
import { Switch } from "~/components/ui/switch"

import type { ControllerBaseProps } from "~/components/form/controllers/controller-types"

export function SwitchController<TFormValues extends FieldValues>({
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
        <FormItem className="flex items-center justify-between rounded-lg border border-input p-3">
          <FormLabel>{fieldConfig.label}</FormLabel>
          <FormControl>
            <Switch
              checked={Boolean(field.value)}
              disabled={disabled}
              onCheckedChange={field.onChange}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
