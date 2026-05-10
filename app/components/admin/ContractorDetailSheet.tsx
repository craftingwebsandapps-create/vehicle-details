import { format } from "date-fns"
import { useEffect, useState } from "react"

import { Button } from "~/components/ui/button"
import { Separator } from "~/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet"
import { Skeleton } from "~/components/ui/skeleton"
import { getContractor } from "~/features/admin/contractors-admin-api"
import type { Contractor, ContractorWorkTypeRef } from "~/types/vehicle"
import { getApiErrorMeta } from "~/services/api-error"

type ContractorDetailSheetProps = {
  contractorId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (contractor: Contractor) => void
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
          key={wt._id ?? `${wt.code}-${i}`}
          className="bg-muted text-foreground rounded-full px-3 py-1 text-xs font-medium"
        >
          {dash(wt.name)}{" "}
          <span className="text-muted-foreground">({dash(wt.code)})</span>
        </li>
      ))}
    </ul>
  )
}

export function ContractorDetailSheet({
  contractorId,
  open,
  onOpenChange,
  onEdit,
}: ContractorDetailSheetProps) {
  const [contractor, setContractor] = useState<Contractor | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [code, setCode] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!open || !contractorId) {
      setContractor(null)
      setError(null)
      setCode(undefined)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    setCode(undefined)

    void getContractor(contractorId)
      .then((row) => {
        if (!cancelled) {
          setContractor(row)
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          const meta = getApiErrorMeta(e)
          setError(meta.message)
          setCode(meta.code)
          setContractor(null)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [open, contractorId])

  const workTypes = contractor?.workTypeIds ?? []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-heading">
            {loading ? "Loading…" : dash(contractor?.name)}
          </SheetTitle>
          <SheetDescription className="break-all">
            {contractorId ? (
              <code className="text-xs">{contractorId}</code>
            ) : null}
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1 py-2">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : error ? (
            <div className="text-destructive text-sm">
              <p>{error}</p>
              {code ? (
                <p className="text-muted-foreground mt-1 font-mono text-xs">
                  {code}
                </p>
              ) : null}
            </div>
          ) : contractor ? (
            <>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground text-xs font-medium">
                    Contact person
                  </dt>
                  <dd className="font-medium">{dash(contractor.contactPerson)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs font-medium">
                    Mobile
                  </dt>
                  <dd>{dash(contractor.mobileNumber)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs font-medium">
                    Email
                  </dt>
                  <dd className="break-all">{dash(contractor.email)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs font-medium">
                    Status
                  </dt>
                  <dd>{dash(contractor.status)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs font-medium">
                    Created
                  </dt>
                  <dd>{formatWhen(contractor.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs font-medium">
                    Updated
                  </dt>
                  <dd>{formatWhen(contractor.updatedAt)}</dd>
                </div>
              </dl>
              <Separator />
              <div>
                <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                  Work types
                </h3>
                <WorkTypeChips items={workTypes} />
              </div>
            </>
          ) : null}
        </div>

        <SheetFooter className="border-border flex-row flex-wrap justify-end gap-3 border-t pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          {contractor && onEdit ? (
            <Button type="button" size="sm" onClick={() => onEdit(contractor)}>
              Edit
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
