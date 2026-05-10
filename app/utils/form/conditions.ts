import type { ConditionalRule, FieldPermissions } from "~/types/form-builder"

import { getByPath } from "~/utils/form/path"

export const evaluateRule = (
  rule: ConditionalRule,
  values: Record<string, unknown>
): boolean => {
  const fieldValue = getByPath(values, rule.field)

  switch (rule.operator) {
    case "equals":
      return fieldValue === rule.value
    case "notEquals":
      return fieldValue !== rule.value
    case "in":
      return Array.isArray(rule.value) && rule.value.includes(fieldValue)
    case "notIn":
      return Array.isArray(rule.value) && !rule.value.includes(fieldValue)
    case "truthy":
      return Boolean(fieldValue)
    case "falsy":
      return !fieldValue
    default:
      return false
  }
}

export const checkPermission = (
  permissions: FieldPermissions | undefined,
  role: string | undefined
): boolean => {
  if (!permissions?.roles?.length) {
    return true
  }

  if (!role) {
    return false
  }

  return permissions.roles.includes(role)
}
