import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash2 } from "lucide-react"
import { useMemo } from "react"
import {
  useFieldArray,
  useForm,
  useWatch,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form"

import { useDynamicOptions } from "~/hooks/use-dynamic-options"
import { useFormPersistence } from "~/hooks/use-form-persistence"
import { useServerErrors } from "~/hooks/use-server-errors"

import { FieldRenderer } from "~/components/form/FieldRenderer"
import { Button } from "~/components/ui/button"
import { Form } from "~/components/ui/form"

import type {
  ArraySectionConfig,
  BaseFieldConfig,
  FormBuilderProps,
} from "~/types/form-builder"
import { buildDefaultValues } from "~/utils/form/default-values"
import { createDynamicSchema } from "~/utils/form/schema"

const GRID_CLASS_BY_SPAN: Record<number, string> = {
  1: "md:col-span-1",
  2: "md:col-span-2",
  3: "md:col-span-3",
  4: "md:col-span-4",
  5: "md:col-span-5",
  6: "md:col-span-6",
  7: "md:col-span-7",
  8: "md:col-span-8",
  9: "md:col-span-9",
  10: "md:col-span-10",
  11: "md:col-span-11",
  12: "md:col-span-12",
}

const toGridClass = (colSpan: number | undefined) => {
  if (!colSpan || colSpan <= 0 || colSpan >= 12) {
    return "md:col-span-12"
  }

  return GRID_CLASS_BY_SPAN[colSpan] ?? "md:col-span-12"
}

type ArraySectionBlockProps = {
  section: ArraySectionConfig<FieldValues>
  form: UseFormReturn<FieldValues, unknown, FieldValues>
  formValues: FieldValues
  role?: string
}

function ArraySectionBlock({
  section,
  form,
  formValues,
  role,
}: ArraySectionBlockProps) {
  const fieldArray = useFieldArray({
    control: form.control,
    name: String(section.name) as never,
  })

  return (
    <section
      key={String(section.name)}
      className="space-y-3 rounded-lg border p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {section.label}
          </h3>
          {section.description ? (
            <p className="text-xs text-muted-foreground">
              {section.description}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            fieldArray.append((section.defaultItem ?? {}) as never)
          }
        >
          <Plus className="size-4" />
          {section.addButtonLabel ?? "Add"}
        </Button>
      </div>

      <div className="space-y-3">
        {fieldArray.fields.map((item, index) => (
          <article key={item.id} className="rounded-md border p-3">
            <div className="mb-3 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fieldArray.remove(index)}
              >
                <Trash2 className="size-4" />
                {section.removeButtonLabel ?? "Remove"}
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
              {section.fields.map((fieldConfig) => {
                const nestedName = `${section.name}.${index}.${fieldConfig.name}`

                return (
                  <div
                    key={`${item.id}-${String(fieldConfig.name)}`}
                    className={toGridClass(fieldConfig.grid?.colSpan)}
                  >
                    <FieldRenderer
                      form={form}
                      fieldConfig={fieldConfig}
                      values={formValues}
                      role={role}
                      nameOverride={nestedName}
                    />
                  </div>
                )
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export function FormBuilder<TFormValues extends FieldValues>({
  config,
  onSubmit,
  defaultValues,
  className,
  isSubmitting,
  onReset,
  role,
  persistenceKey,
  serverErrors,
  hideButtons = false,
}: FormBuilderProps<TFormValues>) {
  const schema = useMemo(
    () => config.schema ?? createDynamicSchema(config),
    [config]
  )
  const resolvedDefaults = useMemo(
    () => buildDefaultValues(config, defaultValues),
    [config, defaultValues]
  )

  const form = useForm<FieldValues>({
    resolver: zodResolver(schema),
    defaultValues: resolvedDefaults,
    mode: "onSubmit",
  })

  const formValues = useWatch({ control: form.control }) as FieldValues

  useFormPersistence(form, persistenceKey)
  useServerErrors(form, serverErrors)

  const { optionsByField, loadingByField, errorByField } = useDynamicOptions(
    config.fields as unknown as BaseFieldConfig<FieldValues>[],
    formValues
  )

  return (
    <Form {...form}>
      <form
        id={config.id}
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(values as TFormValues)
        })}
        className={className ?? "space-y-6"}
      >
        {config.title ? (
          <header className="space-y-1">
            <h2 className="font-heading text-2xl font-semibold text-foreground">
              {config.title}
            </h2>
            {config.description ? (
              <p className="text-sm text-muted-foreground">
                {config.description}
              </p>
            ) : null}
          </header>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          {config.fields.map((fieldConfig) => {
            if (fieldConfig.render) {
              return (
                <div
                  key={String(fieldConfig.name)}
                  className={toGridClass(fieldConfig.grid?.colSpan)}
                >
                  {fieldConfig.render({
                    field: fieldConfig,
                    values: formValues as TFormValues,
                    form: form as unknown as UseFormReturn<TFormValues>,
                  })}
                </div>
              )
            }

            return (
              <div
                key={String(fieldConfig.name)}
                className={toGridClass(fieldConfig.grid?.colSpan)}
              >
                <FieldRenderer
                  form={form}
                  fieldConfig={
                    fieldConfig as unknown as BaseFieldConfig<FieldValues>
                  }
                  values={formValues}
                  role={role}
                  options={
                    optionsByField[String(fieldConfig.name)] ??
                    fieldConfig.options
                  }
                  optionsLoading={loadingByField[String(fieldConfig.name)]}
                  optionsError={errorByField[String(fieldConfig.name)]}
                />
              </div>
            )
          })}
        </div>

        {config.arrays?.map((section) => (
          <ArraySectionBlock
            key={String(section.name)}
            section={section as ArraySectionConfig<FieldValues>}
            form={form}
            formValues={formValues}
            role={role}
          />
        ))}

        {!hideButtons ? (
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset(resolvedDefaults)
                onReset?.()
              }}
            >
              {config.resetLabel ?? "Reset"}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Submitting..."
                : (config.submitLabel ?? "Submit")}
            </Button>
          </div>
        ) : null}
      </form>
    </Form>
  )
}
