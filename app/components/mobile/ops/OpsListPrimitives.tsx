import type { ReactNode } from "react"

import type { LucideIcon } from "lucide-react"
import { Check, Clock, Filter, RefreshCcw, XCircle } from "lucide-react"

import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Skeleton } from "~/components/ui/skeleton"

type SegmentOption<T extends string> = {
  label: string
  value: T
}

type OpsListHeaderProps<T extends string, A extends string = string> = {
  title: string
  totalLabel: string
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  createLabel: string
  onCreate: () => void
  onRefresh: () => void
  segments: SegmentOption<T>[]
  activeSegment: T
  onSegmentChange: (value: T) => void
  approvalSegments?: SegmentOption<A>[]
  activeApprovalSegment?: A
  onApprovalSegmentChange?: (value: A) => void
}

export function OpsListHeader<T extends string, A extends string = string>({
  title,
  totalLabel,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  createLabel,
  onCreate,
  onRefresh,
  segments,
  activeSegment,
  onSegmentChange,
  approvalSegments,
  activeApprovalSegment,
  onApprovalSegmentChange,
}: OpsListHeaderProps<T, A>) {
  return (
    <section className="sticky top-0 z-20 -mx-4 space-y-2 border-b border-border/70 bg-background/95 px-4 pt-2 pb-2 backdrop-blur supports-backdrop-filter:bg-background/90">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{totalLabel}</p>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={onRefresh}
            aria-label={`Refresh ${title.toLowerCase()}`}
          >
            <RefreshCcw className="size-3.5" />
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-8 px-3"
            onClick={onCreate}
          >
            {createLabel}
          </Button>
        </div>
      </div>

      <Input
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={searchPlaceholder}
        className="h-9 rounded-xl"
      />

      {segments.length > 1 ? (
        <div className="flex items-center gap-1">
          {segments.map((segment) => (
            <button
              key={segment.value}
              type="button"
              onClick={() => onSegmentChange(segment.value)}
              className={
                activeSegment === segment.value
                  ? "flex-1 rounded-full bg-foreground py-1.5 text-center text-xs font-medium whitespace-nowrap text-background"
                  : "flex-1 rounded-full border border-border/70 bg-background py-1.5 text-center text-xs font-medium whitespace-nowrap text-muted-foreground"
              }
            >
              {segment.label}
            </button>
          ))}
        </div>
      ) : null}

      {approvalSegments &&
        approvalSegments.length > 0 &&
        onApprovalSegmentChange && (
          <div className="flex items-center gap-1">
            {approvalSegments.map((seg) => (
              <button
                key={seg.value}
                type="button"
                onClick={() => onApprovalSegmentChange(seg.value)}
                className={
                  activeApprovalSegment === seg.value
                    ? "flex-1 rounded-full bg-foreground py-1.5 text-center text-xs font-medium whitespace-nowrap text-background"
                    : "flex-1 rounded-full border border-border/70 bg-background py-1.5 text-center text-xs font-medium whitespace-nowrap text-muted-foreground"
                }
              >
                {seg.label}
              </button>
            ))}
          </div>
        )}
    </section>
  )
}

export function OpsCard({ children }: { children: ReactNode }) {
  return (
    <article className="touch-pan-y rounded-2xl border border-border/60 bg-white p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.07)] dark:bg-background">
      {children}
    </article>
  )
}

export function OpsStatusPill({
  status,
}: {
  status: "ACTIVE" | "INACTIVE" | string
}) {
  const isActive = status === "ACTIVE"

  return (
    <span
      className={
        isActive
          ? "inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
          : "inline-flex items-center gap-1 rounded-full bg-zinc-500/10 px-2 py-0.5 text-[11px] font-medium text-zinc-700"
      }
    >
      <span
        className={
          isActive
            ? "size-1.5 rounded-full bg-emerald-500"
            : "size-1.5 rounded-full bg-zinc-500"
        }
      />
      {status}
    </span>
  )
}

export function OpsApprovalPill({
  status,
  appearance = "dot",
}: {
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | string | undefined
  /** `badge` — solid pill with icon (e.g. vehicle cards). `dot` — compact list pill */
  appearance?: "dot" | "badge"
}) {
  if (!status) return null

  const normalized =
    status === "APPROVED" ||
    status.toLowerCase() === "approved"
      ? "approved"
      : status === "REJECTED" ||
          status.toLowerCase() === "rejected"
        ? "rejected"
        : status === "PENDING_APPROVAL" ||
            status.toLowerCase() === "pending"
          ? "pending"
          : "pending"

  const config =
    normalized === "approved"
      ? {
          label: "Approved",
          dot: "bg-primary",
          pill: "bg-primary/12 text-primary dark:bg-primary/18",
          badgeClass:
            "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/25",
          BadgeIcon: Check,
        }
      : normalized === "rejected"
        ? {
            label: "Rejected",
            dot: "bg-destructive",
            pill: "bg-destructive/12 text-destructive dark:bg-destructive/18",
            badgeClass:
              "bg-destructive text-primary-foreground shadow-sm ring-1 ring-destructive/35",
            BadgeIcon: XCircle,
          }
        : {
            label: "Pending",
            dot: "bg-muted-foreground",
            pill: "bg-muted text-muted-foreground",
            badgeClass:
              "bg-secondary text-secondary-foreground shadow-sm ring-1 ring-border",
            BadgeIcon: Clock,
          }

  if (appearance === "badge") {
    const Icon = config.BadgeIcon
    return (
      <span
        className={`inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[0.64rem] font-medium leading-tight ${config.badgeClass}`}
      >
        <Icon className="size-3 stroke-2" aria-hidden />
        {config.label}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.64rem] font-medium leading-tight ${config.pill}`}
    >
      <span className={`size-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}

type OpsAction = {
  key: string
  label: string
  icon: LucideIcon
  onClick: () => void
}

type OpsActionSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  actions: OpsAction[]
}

export function OpsActionSheet({
  open,
  onOpenChange,
  title,
  actions,
}: OpsActionSheetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="inset-x-0 top-auto bottom-0 max-w-none translate-x-0 translate-y-0 rounded-t-2xl rounded-b-none border-x-0 border-b-0 p-0 sm:max-w-none"
      >
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-sm font-semibold">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-1 px-2 pb-4">
          {actions.map((action) => {
            const Icon = action.icon

            return (
              <button
                key={action.key}
                type="button"
                onClick={() => {
                  action.onClick()
                  onOpenChange(false)
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-medium text-foreground hover:bg-muted"
              >
                <Icon className="size-4 text-muted-foreground" />
                {action.label}
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function OpsFloatingFilterButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      size="icon"
      onClick={onClick}
      className="fixed bottom-24 z-30 size-11 rounded-full shadow-lg"
      style={{ right: "max(1rem, calc((100vw - 30rem) / 2 + 1rem))" }}
      aria-label="Open filters"
    >
      <Filter className="size-4" />
    </Button>
  )
}

export function OpsListSkeleton() {
  return (
    <section className="space-y-2" aria-label="Loading list">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={`ops-skeleton-${index}`}
          className="rounded-2xl border border-border/60 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:bg-background"
        >
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-9 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1.5">
            <Skeleton className="h-6 rounded-lg" />
            <Skeleton className="h-6 rounded-lg" />
            <Skeleton className="h-6 rounded-lg" />
          </div>
        </div>
      ))}
    </section>
  )
}

export function OpsEmptyState({
  title,
  subtitle,
}: {
  title: string
  subtitle: string
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
    </div>
  )
}
