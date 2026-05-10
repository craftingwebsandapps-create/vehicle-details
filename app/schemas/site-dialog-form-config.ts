import { z } from "zod"

import type { CreateSiteRequest } from "~/features/sites/types"
import type { FormConfig } from "~/types/form-builder"

const STATUS_OPTIONS = [
  { label: "ACTIVE", value: "ACTIVE" },
  { label: "INACTIVE", value: "INACTIVE" },
]

export const siteDialogSchema = z.object({
  name: z.string().trim().min(2, "Site name must be at least 2 characters"),
  contactPerson: z
    .string()
    .trim()
    .min(2, "Contact person must be at least 2 characters"),
  mobileNumber: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Mobile number must be 10 digits"),
  email: z.string().trim().email("Enter a valid email"),
  location: z.string().trim().min(1, "Location is required"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
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
        pattern: /^\d{10}$/,
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
    {
      type: "select",
      name: "status",
      label: "Status",
      placeholder: "Select status",
      options: STATUS_OPTIONS,
      validation: {
        required: "Status is required",
      },
      grid: { colSpan: 12 },
    },
  ],
})
