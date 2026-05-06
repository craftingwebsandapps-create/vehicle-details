import type { FieldValues } from "react-hook-form"

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form"
import { Checkbox } from "~/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"

import type { ControllerBaseProps } from "~/components/form/controllers/controller-types"

export function SelectController<TFormValues extends FieldValues>({
  form,
  fieldConfig,
  name,
  disabled,
  options = [],
  optionsLoading,
  optionsError,
}: ControllerBaseProps<TFormValues>) {
  const isMulti = fieldConfig.type === "multiselect"

  return (
    <FormField
      control={form.control}
      name={name as never}
      render={({ field }) => {
        const selectedValues = Array.isArray(field.value)
          ? (field.value as string[])
          : []

        return (
          <FormItem>
            {fieldConfig.label ? (
              <FormLabel>{fieldConfig.label}</FormLabel>
            ) : null}
            <FormControl>
              {isMulti ? (
                <div className="space-y-2 rounded-lg border border-input p-3">
                  {optionsLoading ? (
                    <p className="text-xs text-muted-foreground">
                      Loading options...
                    </p>
                  ) : null}
                  {optionsError ? (
                    <p className="text-xs text-destructive">{optionsError}</p>
                  ) : null}
                  {options.map((option) => {
                    const checked = selectedValues.includes(option.value)

                    return (
                      <label
                        key={option.value}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Checkbox
                          checked={checked}
                          disabled={disabled || option.disabled}
                          onCheckedChange={(nextChecked) => {
                            if (nextChecked) {
                              field.onChange([...selectedValues, option.value])
                              return
                            }

                            field.onChange(
                              selectedValues.filter(
                                (value) => value !== option.value
                              )
                            )
                          }}
                        />
                        {option.label}
                      </label>
                    )
                  })}
                </div>
              ) : (
                <Select
                  value={(field.value as string | undefined) ?? ""}
                  onValueChange={field.onChange}
                  disabled={disabled}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={fieldConfig.placeholder ?? "Select"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}
