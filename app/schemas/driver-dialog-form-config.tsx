import { z } from "zod"

import { FileUploadField } from "~/components/form/FileUploadField"
import type { DriverFormValues } from "~/types/driver"
import type { FormConfig } from "~/types/form-builder"

const getDriverDialogSchema = () =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, "Driver name is required")
      .max(200, "Driver name must be at most 200 characters"),
    licenceNumber: z
      .string()
      .trim()
      .min(1, "Licence number is required")
      .max(80, "Licence number must be at most 80 characters"),
    licenceUrl: z
      .union([
        z
          .string()
          .trim()
          .min(1)
          .max(2048, "Licence URL is too long")
          .url("Enter a valid licence URL"),
        z.instanceof(File),
      ])
      .refine(
        (v) => v instanceof File || (typeof v === "string" && v.length > 0),
        {
          message: "Licence file is required",
        }
      ),
    mobileNumber: z
      .string()
      .trim()
      .transform((v) => v.replace(/\s+/g, ""))
      .refine((v) => /^\+?[0-9]{8,15}$/.test(v), "Enter a valid mobile number"),
    contractor: z.string().trim().optional(),
  })

export const getDriverDialogFormConfig = (
  _isEditMode: boolean
): FormConfig<DriverFormValues> => ({
  id: "driver-dialog-form",
  schema: getDriverDialogSchema(),
  submitLabel: _isEditMode ? "Update" : "Create",
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
        maxLength: 200,
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
        maxLength: 80,
      },
      grid: { colSpan: 12 },
    },
    {
      type: "text",
      name: "mobileNumber",
      label: "Mobile number",
      placeholder: "e.g. +447911123456",
      validation: {
        required: "Mobile number is required",
        pattern: /^\+?[0-9\s]{8,22}$/,
      },
      grid: { colSpan: 12 },
    },
    {
      type: "hidden",
      name: "contractor",
      defaultValue: "",
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
