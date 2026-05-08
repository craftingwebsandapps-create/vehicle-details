import { useEffect, useRef, useState } from "react"

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

type SearchableSelectProps = {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  pageSize?: number
  loading?: boolean
  label?: string
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  pageSize = 10,
  loading = false,
  label,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset pagination when search changes
  useEffect(() => {
    setVisibleCount(pageSize)
  }, [search, pageSize])

  // Focus search on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setSearch("")
      setVisibleCount(pageSize)
    }
  }, [open, pageSize])

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  )
  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length
  const selectedLabel = options.find((o) => o.id === value)?.label

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
              !selectedLabel && "text-muted-foreground"
            )}
          >
            <span className="truncate">{selectedLabel ?? placeholder}</span>
            {loading ? (
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
            {loading && visible.length === 0 && (
              <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading…
              </div>
            )}
            {!loading && visible.length === 0 && (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No options found.
              </p>
            )}
            {visible.map((option) => (
              <button
                key={option.id}
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent",
                  value === option.id && "bg-accent/60 font-medium"
                )}
                onClick={() => {
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
          </div>
          {hasMore && (
            <div className="border-t px-2 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => setVisibleCount((c) => c + pageSize)}
              >
                Load more ({filtered.length - visibleCount} remaining)
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
