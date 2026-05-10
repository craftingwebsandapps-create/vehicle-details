import { z } from "zod"

import { FileUploadField } from "~/components/form/FileUploadField"
import type { DriverFormValues } from "~/types/driver"
import type { FormConfig } from "~/types/form-builder"

const STATUS_OPTIONS = [
  { label: "ACTIVE", value: "ACTIVE" },
  { label: "INACTIVE", value: "INACTIVE" },
]

const getDriverDialogSchema = (isEditMode: boolean) =>
  z.object({
    name: z.string().trim().min(2, "Driver name must be at least 2 characters"),
    licenceNumber: z
      .string()
      .trim()
      .min(3, "Licence number must be at least 3 characters"),
    licenceUrl: z
      .union([z.string().trim().min(1), z.instanceof(File)])
      .refine(
        (v) => v instanceof File || (typeof v === "string" && v.length > 0),
        {
          message: "Licence file is required",
        }
      ),
    mobileNumber: z
      .string()
      .trim()
      .regex(/^\d{10}$/, "Mobile number must be 10 digits"),
    contractor: z.string().trim().optional().default(""),
    status: z.enum(["ACTIVE", "INACTIVE"]),
  })

export const getDriverDialogFormConfig = (
  isEditMode: boolean
): FormConfig<DriverFormValues> => ({
  id: "driver-dialog-form",
  schema: getDriverDialogSchema(isEditMode),
  submitLabel: isEditMode ? "Update" : "Create",
  resetLabel: "Reset",
  gridColumns: 12,
  fields: [
    {
      type: "text",
      name: "name",
      label: "Driver name",
      placeholder: "Enter driver name",
      validation: {
        required: "Driver name is required",
        minLength: 2,
      },
      grid: { colSpan: 12 },
    },
    {
      type: "text",
      name: "licenceNumber",
      label: "Licence number",
      placeholder: "Enter licence number",
      validation: {
        required: "Licence number is required",
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
      type: "hidden",
      name: "contractor",
      defaultValue: "",
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
    {
      type: "text",
      name: "licenceUrl",
      hidden: true,
      grid: { colSpan: 12 },
      render: ({ form }) => (
        <FileUploadField
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          form={form as any}
          name="licenceUrl"
          label="Licence file"
          uploadTitle="Upload licence file"
          required={true}
        />
      ),
    },
  ],
})
