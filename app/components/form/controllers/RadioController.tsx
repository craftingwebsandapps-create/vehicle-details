import type { FieldValues } from "react-hook-form"

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form"
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group"

import type { ControllerBaseProps } from "~/components/form/controllers/controller-types"

export function RadioController<TFormValues extends FieldValues>({
  form,
  fieldConfig,
  name,
  disabled,
  options = [],
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
            <RadioGroup
              value={(field.value as string | undefined) ?? ""}
              onValueChange={field.onChange}
              className="gap-2"
            >
              {options.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 text-sm"
                >
                  <RadioGroupItem
                    value={option.value}
                    disabled={disabled || option.disabled}
                  />
                  {option.label}
                </label>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
