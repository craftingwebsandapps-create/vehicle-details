import { z } from "zod"

import type { CreateSiteRequest } from "~/features/sites/types"
import type { FormConfig } from "~/types/form-builder"

export const siteDialogSchema = z.object({
  name: z.string().trim().min(2, "Site name must be at least 2 characters"),
  contactPerson: z
    .string()
    .trim()
    .min(2, "Contact person must be at least 2 characters"),
  mobileNumber: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s+/g, ""))
    .refine((v) => /^\+?[0-9]{8,15}$/.test(v), "Enter a valid mobile number"),
  email: z.string().trim().email("Enter a valid email"),
  location: z.string().trim().min(1, "Location is required"),
})

export const getSiteDialogFormConfig = (
  isEditMode: boolean
): FormConfig<CreateSiteRequest> => ({
  id: "site-dialog-form",
  schema: siteDialogSchema,
  submitLabel: isEditMode ? "Update" : "Create",
  resetLabel: "Reset",
  gridColumns: 12,
  fields: [
    {
      type: "text",
      name: "name",
      label: "Site name",
      placeholder: "Enter site name",
      validation: {
        required: "Site name is required",
        minLength: 2,
      },
      disabled: isEditMode,
      grid: { colSpan: 12 },
    },
    {
      type: "text",
      name: "contactPerson",
      label: "Contact person",
      placeholder: "Enter contact person",
      validation: {
        required: "Contact person is required",
        minLength: 2,
      },
      grid: { colSpan: 12 },
    },
    {
      type: "text",
      name: "mobileNumber",
      label: "Mobile number",
      placeholder: "Enter mobile number",
      validation: {
        required: "Mobile number is required",
        pattern: /^\+?[0-9]{8,15}$/,
      },
      grid: { colSpan: 12 },
    },
    {
      type: "email",
      name: "email",
      label: "Email",
      placeholder: "Enter email",
      validation: {
        required: "Email is required",
        email: true,
      },
      grid: { colSpan: 12 },
    },
    {
      type: "text",
      name: "location",
      label: "Location",
      placeholder: "Enter location",
      validation: {
        required: "Location is required",
      },
      grid: { colSpan: 12 },
    },
  ],
})
