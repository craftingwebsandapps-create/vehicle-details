import { z } from "zod"
import type { FieldValues } from "react-hook-form"

import type {
  ArraySectionConfig,
  BaseFieldConfig,
  ConditionalRule,
  FormConfig,
} from "~/types/form-builder"
import { evaluateRule } from "~/utils/form/conditions"

interface ShapeTree {
  [key: string]: z.ZodTypeAny | ShapeTree
}

const isZodSchema = (
  value: z.ZodTypeAny | ShapeTree
): value is z.ZodTypeAny => {
  return "safeParse" in value
}

const insertSchemaByPath = (
  shape: ShapeTree,
  path: string,
  schema: z.ZodTypeAny
) => {
  const segments = path.split(".")
  let cursor = shape

  segments.forEach((segment, index) => {
    const isLast = index === segments.length - 1

    if (isLast) {
      cursor[segment] = schema
      return
    }

    const next = cursor[segment]

    if (!next || isZodSchema(next)) {
      cursor[segment] = {}
    }

    cursor = cursor[segment] as ShapeTree
  })
}

const shapeTreeToObject = (shape: ShapeTree): z.ZodObject<z.ZodRawShape> => {
  const builtShape: z.ZodRawShape = {}

  Object.entries(shape).forEach(([key, value]) => {
    if (isZodSchema(value)) {
      builtShape[key] = value
      return
    }

    builtShape[key] = shapeTreeToObject(value)
  })

  return z.object(builtShape)
}

const applyStringRules = (
  schema: z.ZodString,
  field: BaseFieldConfig<FieldValues>
) => {
  let current = schema
  const validation = field.validation

  if (validation?.email || field.type === "email") {
    current = current.email("Enter a valid email")
  }

  if (validation?.minLength !== undefined) {
    current = current.min(
      validation.minLength,
      `Minimum ${validation.minLength} characters required`
    )
  }

  if (validation?.maxLength !== undefined) {
    current = current.max(
      validation.maxLength,
      `Maximum ${validation.maxLength} characters allowed`
    )
  }

  if (validation?.pattern) {
    current = current.regex(validation.pattern, "Invalid format")
  }

  return current
}

const buildFieldSchema = (
  field: BaseFieldConfig<FieldValues>
): z.ZodTypeAny => {
  const validation = field.validation

  if (validation?.customSchema) {
    return validation.customSchema
  }

  switch (field.type) {
    case "number": {
      let schema = z.coerce.number({ invalid_type_error: "Must be a number" })

      if (validation?.integer) {
        schema = schema.int("Must be an integer")
      }

      if (validation?.min !== undefined) {
        schema = schema.min(
          validation.min,
          `Minimum value is ${validation.min}`
        )
      }

      if (validation?.max !== undefined) {
        schema = schema.max(
          validation.max,
          `Maximum value is ${validation.max}`
        )
      }

      return schema
    }
    case "checkbox":
    case "switch":
      return z.boolean()
    case "date":
      return z.coerce.date({ invalid_type_error: "Invalid date" })
    case "file":
      return z.instanceof(File).or(z.null())
    case "multiselect": {
      let schema = z.array(z.string())

      if (validation?.minItems !== undefined) {
        schema = schema.min(
          validation.minItems,
          `Select at least ${validation.minItems} options`
        )
      }

      if (validation?.maxItems !== undefined) {
        schema = schema.max(
          validation.maxItems,
          `Select up to ${validation.maxItems} options`
        )
      }

      return schema
    }
    default:
      return applyStringRules(z.string().trim(), field)
  }
}

const toRequired = (
  schema: z.ZodTypeAny,
  field: BaseFieldConfig<FieldValues>
): z.ZodTypeAny => {
  const message =
    typeof field.validation?.required === "string"
      ? field.validation.required
      : `${field.label ?? field.name} is required`

  if (field.type === "checkbox" || field.type === "switch") {
    if (field.validation?.required || field.required) {
      return z.boolean().refine((value) => value, message)
    }

    return schema.optional()
  }

  if (field.type === "multiselect") {
    if (field.validation?.required || field.required) {
      return (schema as z.ZodArray<z.ZodString>).min(1, message)
    }

    return schema.optional()
  }

  if (field.validation?.required || field.required) {
    return schema.refine(
      (value) => {
        if (value === null || value === undefined) {
          return false
        }

        if (typeof value === "string") {
          return value.trim().length > 0
        }

        return true
      },
      { message }
    )
  }

  return schema.optional()
}

const getPathValue = (
  values: Record<string, unknown>,
  path: string
): unknown => {
  return path.split(".").reduce<unknown>((acc, segment) => {
    if (!acc || typeof acc !== "object") {
      return undefined
    }

    return (acc as Record<string, unknown>)[segment]
  }, values)
}

const addConditionalIssue = (
  values: Record<string, unknown>,
  rule: ConditionalRule,
  field: BaseFieldConfig<FieldValues>,
  ctx: z.RefinementCtx
) => {
  if (!evaluateRule(rule, values)) {
    return
  }

  const currentValue = getPathValue(values, String(field.name))
  const isEmpty =
    currentValue === null ||
    currentValue === undefined ||
    (typeof currentValue === "string" && currentValue.trim().length === 0) ||
    (Array.isArray(currentValue) && currentValue.length === 0)

  if (!isEmpty) {
    return
  }

  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: `${field.label ?? field.name} is required`,
    path: String(field.name).split("."),
  })
}

const buildArraySchema = (section: ArraySectionConfig<FieldValues>) => {
  const itemShape: ShapeTree = {}

  section.fields.forEach((field) => {
    const childSchema = toRequired(buildFieldSchema(field), field)
    insertSchemaByPath(itemShape, String(field.name), childSchema)
  })

  let schema = z.array(shapeTreeToObject(itemShape))

  if (section.minItems !== undefined) {
    schema = schema.min(
      section.minItems,
      `Add at least ${section.minItems} items`
    )
  }

  if (section.maxItems !== undefined) {
    schema = schema.max(
      section.maxItems,
      `Maximum ${section.maxItems} items allowed`
    )
  }

  return schema
}

export const createDynamicSchema = <TFormValues extends FieldValues>(
  config: FormConfig<TFormValues>
) => {
  const shape: ShapeTree = {}

  config.fields.forEach((field) => {
    const resolvedField = field as unknown as BaseFieldConfig<FieldValues>
    const schema = toRequired(buildFieldSchema(resolvedField), resolvedField)
    insertSchemaByPath(shape, String(field.name), schema)
  })

  config.arrays?.forEach((section) => {
    insertSchemaByPath(
      shape,
      String(section.name),
      buildArraySchema(section as unknown as ArraySectionConfig<FieldValues>)
    )
  })

  const baseSchema = shapeTreeToObject(shape)

  return baseSchema.superRefine((values, ctx) => {
    config.fields.forEach((field) => {
      const requiredWhen = field.validation?.requiredWhen

      if (!requiredWhen) {
        return
      }

      addConditionalIssue(
        values as Record<string, unknown>,
        requiredWhen,
        field as unknown as BaseFieldConfig<FieldValues>,
        ctx
      )
    })
  })
}
