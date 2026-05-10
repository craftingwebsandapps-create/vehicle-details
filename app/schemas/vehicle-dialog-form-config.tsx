import { z } from "zod"

import { FileUploadField } from "~/components/form/FileUploadField"
import type { VehicleFormValues } from "~/types/vehicle"
import type { FormConfig } from "~/types/form-builder"

const OBJECT_ID_HEX = /^[a-fA-F0-9]{24}$/

const getVehicleDialogSchema = () =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, "Vehicle name is required")
      .max(200, "Vehicle name must be at most 200 characters"),
    type: z
      .string()
      .trim()
      .min(1, "Vehicle type is required")
      .max(100, "Vehicle type must be at most 100 characters"),
    registrationNumber: z
      .string()
      .trim()
      .min(1, "Registration number is required")
      .max(80, "Registration number must be at most 80 characters"),
    document: z
      .union([
        z.string().trim().min(1).max(2048, "Document reference is too long"),
        z.instanceof(File),
      ])
      .refine(
        (v) => v instanceof File || (typeof v === "string" && v.length > 0),
        {
          message: "Document is required",
        }
      ),
    site: z
      .string()
      .trim()
      .regex(OBJECT_ID_HEX, "Select an approved site"),
  })

export const getVehicleDialogFormConfig = (
  _isEditMode: boolean,
  sites: Array<{ _id?: string; id?: string; name: string }>
): FormConfig<VehicleFormValues> => {
  const siteOptions = sites.map((site) => ({
    label: site.name,
    value: site._id || site.id || "",
  }))

  return {
    id: "vehicle-dialog-form",
    schema: getVehicleDialogSchema(),
    submitLabel: _isEditMode ? "Update" : "Create",
    resetLabel: "Reset",
    gridColumns: 12,
    fields: [
      {
        type: "text",
        name: "name",
        label: "Vehicle name",
        placeholder: "Enter vehicle name",
        validation: {
          required: "Vehicle name is required",
          maxLength: 200,
        },
        grid: { colSpan: 12 },
      },
      {
        type: "text",
        name: "type",
        label: "Vehicle type",
        placeholder: "Enter vehicle type",
        validation: {
          required: "Vehicle type is required",
          maxLength: 100,
        },
        grid: { colSpan: 6 },
      },
      {
        type: "text",
        name: "registrationNumber",
        label: "Registration number",
        placeholder: "Enter registration number",
        validation: {
          required: "Registration number is required",
          maxLength: 80,
        },
        grid: { colSpan: 6 },
      },
      {
        type: "select",
        name: "site",
        label: "Site",
        placeholder: "Select site",
        options: siteOptions,
        validation: {
          required: "Site is required",
        },
        grid: { colSpan: 12 },
      },
      {
        type: "text",
        name: "document",
        hidden: true,
        grid: { colSpan: 12 },
        render: ({ form }) => (
          <FileUploadField
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            form={form as any}
            name="document"
            label="Document"
            uploadTitle="Upload vehicle document"
            required={true}
          />
        ),
      },
    ],
  }
}
