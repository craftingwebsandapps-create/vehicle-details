import { z } from "zod"

import { FileUploadField } from "~/components/form/FileUploadField"
import type { VehicleFormValues } from "~/types/vehicle"
import type { FormConfig } from "~/types/form-builder"

const STATUS_OPTIONS = [
  { label: "ACTIVE", value: "ACTIVE" },
  { label: "INACTIVE", value: "INACTIVE" },
]

const getVehicleDialogSchema = (isEditMode: boolean) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(2, "Vehicle name must be at least 2 characters"),
    type: z.string().trim().min(1, "Vehicle type is required"),
    registrationNumber: z
      .string()
      .trim()
      .min(2, "Registration number must be at least 2 characters"),
    document: z
      .union([z.string().trim().min(1), z.instanceof(File)])
      .refine(
        (v) => v instanceof File || (typeof v === "string" && v.length > 0),
        {
          message: "Document is required",
        }
      ),
    status: z.enum(["ACTIVE", "INACTIVE"]),
    site: z.string().trim().min(1, "Site is required"),
  })

export const getVehicleDialogFormConfig = (
  isEditMode: boolean,
  sites: Array<{ _id?: string; id?: string; name: string }>
): FormConfig<VehicleFormValues> => {
  const siteOptions = sites.map((site) => ({
    label: site.name,
    value: site._id || site.id || "",
  }))

  return {
    id: "vehicle-dialog-form",
    schema: getVehicleDialogSchema(isEditMode),
    submitLabel: isEditMode ? "Update" : "Create",
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
          minLength: 2,
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
          minLength: 2,
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
