import { z } from "zod"

import type { FormConfig, SelectOption } from "~/types/form-builder"

export type AdminUserDialogFormValues = {
  name: string
  email: string
  password: string
  linkMode: "superadmin" | "tenant"
  contractorId: string
}

export function getAdminUserDialogFormConfig(opts: {
  mode: "create" | "edit"
  contractorOptions: SelectOption[]
  contractorDisabled: boolean
}): FormConfig<AdminUserDialogFormValues> {
  const passwordSchema =
    opts.mode === "create"
      ? z.string().trim().min(8, "Password must be at least 8 characters").max(128)
      : z
          .string()
          .trim()
          .refine(
            (v) => v.length === 0 || (v.length >= 8 && v.length <= 128),
            "Password must be 8–128 characters"
          )

  return {
    id: "admin-user-dialog-form",
    submitLabel: opts.mode === "create" ? "Create" : "Save",
    resetLabel: "Reset",
    gridColumns: 12,
    fields: [
      {
        type: "text",
        name: "name",
        label: "Name",
        placeholder: "Full name",
        validation: { required: "Name is required", minLength: 1, maxLength: 200 },
        grid: { colSpan: 12 },
      },
      {
        type: "email",
        name: "email",
        label: "Email",
        placeholder: "name@example.com",
        validation: { required: "Email is required", email: true, maxLength: 320 },
        grid: { colSpan: 12 },
      },
      {
        type: "password",
        name: "password",
        label: opts.mode === "create" ? "Password" : "Password (optional)",
        placeholder: opts.mode === "edit" ? "Leave blank to keep" : undefined,
        validation: {
          customSchema: passwordSchema,
          required: opts.mode === "create" ? "Password is required" : false,
        },
        grid: { colSpan: 12 },
      },
      {
        type: "select",
        name: "linkMode",
        label: "Account type",
        options: [
          { label: "Superadmin (no contractor)", value: "superadmin" },
          { label: "Tenant (linked contractor)", value: "tenant" },
        ],
        validation: { required: "Account type is required" },
        grid: { colSpan: 12 },
      },
      {
        type: "select",
        name: "contractorId",
        label: "Contractor",
        placeholder: "Select contractor…",
        options: opts.contractorOptions,
        disabled: opts.contractorDisabled,
        hidden: { field: "linkMode", operator: "equals", value: "superadmin" },
        validation: {
          requiredWhen: { field: "linkMode", operator: "equals", value: "tenant" },
        },
        grid: { colSpan: 12 },
      },
    ],
  }
}

