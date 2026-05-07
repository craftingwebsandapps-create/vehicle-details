import type { ChangeEvent, ComponentProps } from "react"
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
  const rawInputProps = (fieldConfig.props ?? {}) as Record<string, unknown>
  const cameraAndFile = rawInputProps.cameraAndFile === true

  const inputProps = rawInputProps as Omit<
    ComponentProps<"input">,
    "type" | "onChange" | "disabled"
  >

  const uploadAccept =
    typeof rawInputProps.accept === "string"
      ? rawInputProps.accept
      : "image/*,application/pdf"
  const cameraCapture: ComponentProps<"input">["capture"] =
    rawInputProps.capture === "user" ||
    rawInputProps.capture === "environment" ||
    typeof rawInputProps.capture === "boolean"
      ? rawInputProps.capture
      : "environment"

  return (
    <FormField
      control={form.control}
      name={name as never}
      render={({ field }) => {
        const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
          const file = event.target.files?.[0] ?? null
          field.onChange(file)
        }

        return (
          <FormItem>
            {fieldConfig.label ? (
              <FormLabel>{fieldConfig.label}</FormLabel>
            ) : null}
            {cameraAndFile ? (
              <div className="space-y-2">
                <FormControl>
                  <Input
                    type="file"
                    disabled={disabled}
                    accept="image/*"
                    capture={cameraCapture}
                    onChange={handleFileSelect}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">Use camera</p>

                <FormControl>
                  <Input
                    type="file"
                    disabled={disabled}
                    accept={uploadAccept}
                    onChange={handleFileSelect}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Upload from files
                </p>
              </div>
            ) : (
              <FormControl>
                <Input
                  type="file"
                  disabled={disabled}
                  {...inputProps}
                  onChange={handleFileSelect}
                />
              </FormControl>
            )}
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}
