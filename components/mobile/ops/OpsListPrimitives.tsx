import type { ReactNode } from "react"

import type { LucideIcon } from "lucide-react"
import { Filter, RefreshCcw } from "lucide-react"

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

type OpsListHeaderProps<T extends string> = {
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
}

export function OpsListHeader<T extends string>({
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
}: OpsListHeaderProps<T>) {
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

      <div className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {segments.map((segment) => (
          <button
            key={segment.value}
            type="button"
            onClick={() => onSegmentChange(segment.value)}
            className={
              activeSegment === segment.value
                ? "rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background"
                : "rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground"
            }
          >
            {segment.label}
          </button>
        ))}
      </div>
    </section>
  )
}

export function OpsCard({ children }: { children: ReactNode }) {
  return (
    <article className="touch-pan-y rounded-2xl border border-border/60 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.07)] dark:bg-background">
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
        className="top-auto right-0 bottom-0 left-0 max-w-none translate-x-0 translate-y-0 rounded-t-2xl rounded-b-none border-x-0 border-b-0 p-0"
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
      className="fixed right-4 bottom-24 z-30 size-11 rounded-full shadow-lg"
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
