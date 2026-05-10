import { format } from "date-fns"
import type { ReactNode } from "react"

import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Separator } from "~/components/ui/separator"
import type { Contractor, ContractorWorkTypeRef } from "~/types/vehicle"

type ContractorDetailDialogProps = {
  contractor: Contractor | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function dash(value: string | undefined | null) {
  const v = value?.trim()
  return v && v.length > 0 ? v : "—"
}

function formatWhen(iso: string | undefined | null) {
  if (!iso) return "—"
  try {
    return format(new Date(iso), "PPpp")
  } catch {
    return iso
  }
}

function DetailRows({
  rows,
}: {
  rows: Array<{ label: string; value: ReactNode }>
}) {
  return (
    <dl className="space-y-0">
      {rows.map(({ label, value }) => (
        <div
          key={label}
          className="grid grid-cols-1 gap-1 py-2 sm:grid-cols-[minmax(0,140px)_1fr] sm:gap-4 sm:py-1.5"
        >
          <dt className="text-muted-foreground text-xs font-medium sm:text-sm">
            {label}
          </dt>
          <dd className="text-sm break-words">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function WorkTypeChips({ items }: { items: ContractorWorkTypeRef[] }) {
  if (items.length === 0) {
    return (
      <span className="text-muted-foreground text-sm">No work types</span>
    )
  }
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((wt, i) => (
        <li
          key={`${wt.code}-${i}`}
          className="bg-muted text-foreground rounded-full px-3 py-1 text-xs font-medium"
        >
          {dash(wt.name)}{" "}
          <span className="text-muted-foreground">({dash(wt.code)})</span>
        </li>
      ))}
    </ul>
  )
}

export function ContractorDetailDialog({
  contractor,
  open,
  onOpenChange,
}: ContractorDetailDialogProps) {
  if (!contractor) return null

  const workTypes = contractor.workTypeIds ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-border border-b p-6 pb-4">
          <DialogTitle className="pr-8 font-heading text-lg leading-snug">
            {dash(contractor.name)}
          </DialogTitle>
          <DialogDescription className="pt-1">
            {dash(contractor.email)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <section className="space-y-1">
            <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
              Contractor
            </h3>
            <DetailRows
              rows={[
                {
                  label: "ID",
                  value: <code className="text-xs">{contractor._id}</code>,
                },
                {
                  label: "Contact person",
                  value: dash(contractor.contactPerson),
                },
                { label: "Mobile", value: dash(contractor.mobileNumber) },
                { label: "Email", value: dash(contractor.email) },
                { label: "Status", value: dash(contractor.status) },
                {
                  label: "Created",
                  value: formatWhen(contractor.createdAt),
                },
                {
                  label: "Updated",
                  value: formatWhen(contractor.updatedAt),
                },
              ]}
            />
          </section>

          <Separator className="my-4" />

          <section>
            <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
              Work types
            </h3>
            <WorkTypeChips items={workTypes} />
          </section>
        </div>

        <DialogFooter className="mx-0 mb-0 gap-0 border-border bg-muted/30 border-t px-4 py-2.5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto shrink-0 px-2 py-1 text-muted-foreground hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
