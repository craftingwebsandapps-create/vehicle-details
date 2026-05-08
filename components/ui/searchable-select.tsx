import { useCallback, useEffect, useRef, useState } from "react"

import { Check, ChevronDown, Loader2 } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover"
import { cn } from "~/lib/utils"

export type SelectOption = { id: string; label: string }

/** Async mode: provide loadOptions — search is server-side with debounce + pagination.
 *  Static mode: provide options — search is client-side. */
type SearchableSelectProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  /** Async server-side search + pagination */
  loadOptions?: (
    search: string,
    page: number
  ) => Promise<{ items: SelectOption[]; hasMore: boolean }>
  /** Static client-side filtering (used when loadOptions is not provided) */
  options?: SelectOption[]
  /** Only used in static mode for client-side pagination */
  pageSize?: number
  /** External loading indicator (only used in static mode trigger) */
  loading?: boolean
}

export function SearchableSelect({
  value,
  onChange,
  placeholder = "Select…",
  label,
  loadOptions,
  options: staticOptions = [],
  pageSize = 10,
  loading: externalLoading = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Async state ──────────────────────────────────────────────────────────
  const [asyncItems, setAsyncItems] = useState<SelectOption[]>([])
  const [asyncPage, setAsyncPage] = useState(1)
  const [asyncHasMore, setAsyncHasMore] = useState(false)
  const [asyncLoading, setAsyncLoading] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState<string | undefined>()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isAsync = !!loadOptions

  const fetchAsync = useCallback(
    async (q: string, pg: number, append = false) => {
      if (!loadOptions) return
      setAsyncLoading(true)
      try {
        const result = await loadOptions(q, pg)
        setAsyncItems((prev) =>
          append ? [...prev, ...result.items] : result.items
        )
        setAsyncHasMore(result.hasMore)
        setAsyncPage(pg)
      } catch {
        // errors handled at call site
      } finally {
        setAsyncLoading(false)
      }
    },
    [loadOptions]
  )

  // Open/close effects
  useEffect(() => {
    if (!isAsync) return
    if (open) {
      void fetchAsync("", 1)
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setSearch("")
      setAsyncItems([])
      setAsyncPage(1)
      setAsyncHasMore(false)
    }
  }, [open, isAsync, fetchAsync])

  // Debounced search for async mode
  useEffect(() => {
    if (!isAsync || !open) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void fetchAsync(search, 1)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search, isAsync, open, fetchAsync])

  // ── Static state ──────────────────────────────────────────────────────────
  const [visibleCount, setVisibleCount] = useState(pageSize)

  useEffect(() => {
    if (!isAsync) setVisibleCount(pageSize)
  }, [search, pageSize, isAsync])

  useEffect(() => {
    if (!isAsync && open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
    if (!open && !isAsync) {
      setSearch("")
      setVisibleCount(pageSize)
    }
  }, [open, pageSize, isAsync])

  // ── Derived display values ─────────────────────────────────────────────────
  const loading = isAsync ? asyncLoading : externalLoading

  const displayItems = isAsync
    ? asyncItems
    : staticOptions
        .filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
        .slice(0, visibleCount)

  const hasMore = isAsync
    ? asyncHasMore
    : visibleCount <
      staticOptions.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase())
      ).length

  const triggerLabel =
    selectedLabel ??
    staticOptions.find((o) => o.id === value)?.label ??
    asyncItems.find((o) => o.id === value)?.label

  const remainingStatic = isAsync
    ? 0
    : staticOptions.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase())
      ).length - visibleCount

  return (
    <div>
      {label && <p className="mb-1 text-xs text-muted-foreground">{label}</p>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm ring-offset-background",
              "focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none",
              !triggerLabel && "text-muted-foreground"
            )}
          >
            <span className="truncate">{triggerLabel ?? placeholder}</span>
            {externalLoading && !isAsync ? (
              <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
            ) : (
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0"
          style={{ width: "var(--radix-popover-trigger-width)" }}
          align="start"
        >
          <div className="border-b px-2 py-2">
            <Input
              ref={inputRef}
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {loading && displayItems.length === 0 && (
              <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading…
              </div>
            )}
            {!loading && displayItems.length === 0 && (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No options found.
              </p>
            )}
            {displayItems.map((option) => (
              <button
                key={option.id}
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent",
                  value === option.id && "bg-accent/60 font-medium"
                )}
                onClick={() => {
                  setSelectedLabel(option.label)
                  onChange(option.id)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    value === option.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </button>
            ))}
            {loading && displayItems.length > 0 && (
              <div className="flex items-center justify-center py-2 text-xs text-muted-foreground">
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Loading…
              </div>
            )}
          </div>
          {hasMore && !loading && (
            <div className="border-t px-2 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  if (isAsync) {
                    void fetchAsync(search, asyncPage + 1, true)
                  } else {
                    setVisibleCount((c) => c + pageSize)
                  }
                }}
              >
                {isAsync
                  ? "Load more"
                  : `Load more (${remainingStatic} remaining)`}
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
