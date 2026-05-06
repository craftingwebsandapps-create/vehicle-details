import { BadgeInfo } from "lucide-react"
import type { FieldValues } from "react-hook-form"

import type { FormConfig, SelectOption } from "~/types/form-builder"

type SiteFormValues = FieldValues & {
  siteName: string
  email: string
  password: string
  employees: number
  description: string
  state: string
  district: string
  services: string[]
  isActive: boolean
  agreementAccepted: boolean
  ownershipType: string
  launchDate: Date | null
  logo: File | null
  metadata: {
    address: {
      line1: string
      pincode: string
    }
  }
  managers: Array<{
    name: string
    email: string
    phone: string
  }>
}

const STATE_OPTIONS: SelectOption[] = [
  { label: "Andhra Pradesh", value: "AP" },
  { label: "Telangana", value: "TS" },
]

const DISTRICT_OPTIONS: Record<string, SelectOption[]> = {
  AP: [
    { label: "Guntur", value: "guntur" },
    { label: "Krishna", value: "krishna" },
  ],
  TS: [
    { label: "Hyderabad", value: "hyderabad" },
    { label: "Warangal", value: "warangal" },
  ],
}

const loadDistrictOptions = async ({
  values,
}: {
  values: FieldValues
}): Promise<SelectOption[]> => {
  const state = values.state as string | undefined

  await new Promise((resolve) => setTimeout(resolve, 400))

  if (!state) {
    return []
  }

  return DISTRICT_OPTIONS[state] ?? []
}

export const siteFormConfig: FormConfig<SiteFormValues> = {
  id: "enterprise-site-form",
  title: "Enterprise Site Setup",
  description:
    "Config-driven form system demo with dynamic validation, dependencies, async options, and repeatable sections.",
  gridColumns: 12,
  submitLabel: "Create Site",
  resetLabel: "Clear",
  fields: [
    {
      type: "text",
      name: "siteName",
      label: "Site Name",
      placeholder: "Enter site name",
      defaultValue: "",
      validation: {
        required: true,
        minLength: 3,
      },
      grid: { colSpan: 6 },
    },
    {
      type: "email",
      name: "email",
      label: "Primary Email",
      placeholder: "ops@company.com",
      defaultValue: "",
      validation: {
        required: true,
        email: true,
      },
      grid: { colSpan: 6 },
    },
    {
      type: "password",
      name: "password",
      label: "Portal Password",
      placeholder: "Enter secure password",
      defaultValue: "",
      validation: {
        required: true,
        minLength: 8,
      },
      grid: { colSpan: 4 },
    },
    {
      type: "number",
      name: "employees",
      label: "Employee Capacity",
      placeholder: "0",
      defaultValue: 10,
      validation: {
        required: true,
        min: 1,
        max: 10000,
        integer: true,
      },
      grid: { colSpan: 4 },
    },
    {
      type: "date",
      name: "launchDate",
      label: "Launch Date",
      defaultValue: null,
      validation: {
        required: true,
      },
      grid: { colSpan: 4 },
    },
    {
      type: "select",
      name: "state",
      label: "State",
      placeholder: "Select state",
      defaultValue: "",
      options: STATE_OPTIONS,
      validation: {
        required: true,
      },
      grid: { colSpan: 6 },
    },
    {
      type: "select",
      name: "district",
      label: "District",
      placeholder: "Select district",
      defaultValue: "",
      dependsOn: ["state"],
      loadOptions: loadDistrictOptions,
      validation: {
        required: true,
      },
      grid: { colSpan: 6 },
    },
    {
      type: "multiselect",
      name: "services",
      label: "Services",
      defaultValue: [],
      options: [
        { label: "Dispatch", value: "dispatch" },
        { label: "Maintenance", value: "maintenance" },
        { label: "Night Shift", value: "night_shift" },
      ],
      validation: {
        minItems: 1,
      },
      grid: { colSpan: 6 },
    },
    {
      type: "radio",
      name: "ownershipType",
      label: "Ownership Type",
      defaultValue: "private",
      options: [
        { label: "Private", value: "private" },
        { label: "Public", value: "public" },
      ],
      validation: {
        required: true,
      },
      grid: { colSpan: 6 },
    },
    {
      type: "switch",
      name: "isActive",
      label: "Enable Site",
      defaultValue: true,
      grid: { colSpan: 4 },
    },
    {
      type: "checkbox",
      name: "agreementAccepted",
      label: "I accept legal compliance terms",
      defaultValue: false,
      validation: {
        required: true,
      },
      grid: { colSpan: 8 },
    },
    {
      type: "textarea",
      name: "description",
      label: "Operational Notes",
      placeholder: "Write notes...",
      defaultValue: "",
      validation: {
        requiredWhen: {
          field: "isActive",
          operator: "equals",
          value: true,
        },
      },
      grid: { colSpan: 12 },
    },
    {
      type: "file",
      name: "logo",
      label: "Site Logo",
      defaultValue: null,
      grid: { colSpan: 6 },
    },
    {
      type: "text",
      name: "metadata.address.line1",
      label: "Address Line 1",
      defaultValue: "",
      validation: {
        required: true,
      },
      grid: { colSpan: 8 },
    },
    {
      type: "text",
      name: "metadata.address.pincode",
      label: "Pincode",
      defaultValue: "",
      validation: {
        required: true,
        minLength: 6,
        maxLength: 6,
        pattern: /^\d+$/,
      },
      grid: { colSpan: 4 },
    },
    {
      type: "hidden",
      name: "meta.createdBy",
      defaultValue: "ops-admin",
    },
    {
      type: "text",
      name: "helper.renderedBlock",
      render: () => (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
          <p className="flex items-center gap-2 font-medium text-foreground">
            <BadgeInfo className="size-4" />
            Config-based custom component render block
          </p>
          <p className="mt-1">
            This block is rendered using field.render without hardcoding into
            the form builder.
          </p>
        </div>
      ),
      hidden: true,
      grid: { colSpan: 12 },
    },
  ],
  arrays: [
    {
      name: "managers",
      label: "Site Managers",
      description: "Add one or more manager contacts",
      addButtonLabel: "Add Manager",
      removeButtonLabel: "Remove Manager",
      minItems: 1,
      defaultItem: {
        name: "",
        email: "",
        phone: "",
      },
      fields: [
        {
          type: "text",
          name: "name",
          label: "Manager Name",
          defaultValue: "",
          validation: {
            required: true,
          },
          grid: { colSpan: 4 },
        },
        {
          type: "email",
          name: "email",
          label: "Manager Email",
          defaultValue: "",
          validation: {
            required: true,
            email: true,
          },
          grid: { colSpan: 4 },
        },
        {
          type: "text",
          name: "phone",
          label: "Manager Phone",
          defaultValue: "",
          validation: {
            required: true,
            minLength: 10,
          },
          grid: { colSpan: 4 },
        },
      ],
    },
  ],
}

export type { SiteFormValues }
