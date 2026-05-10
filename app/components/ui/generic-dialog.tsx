import type { ReactNode } from "react"

import { Button } from "~/components/ui/button"
import { cn } from "~/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"

export interface GenericDialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean

  /**
   * Callback when dialog open state changes
   */
  onOpenChange: (open: boolean) => void

  /**
   * Dialog title
   */
  title: string

  /**
   * Dialog body content
   */
  children: ReactNode

  /**
   * Footer content (typically buttons)
   */
  footer?: ReactNode

  /**
   * Additional CSS classes for the root wrapper
   */
  className?: string

  /**
   * Additional CSS classes for DialogContent
   */
  contentClassName?: string

  /**
   * Maximum width of the dialog
   * @default md
   */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"

  /**
   * Prevent closing when clicking outside dialog
   * @default false
   */
  preventOutsideClose?: boolean

  /**
   * Description for accessibility
   */
  description?: string

  /**
   * Show divider between header and body
   * @default true
   */
  showHeaderDivider?: boolean

  /**
   * Show divider between body and footer
   * @default true
   */
  showFooterDivider?: boolean

  /**
   * Body container className for additional styling
   */
  bodyClassName?: string
}

const maxWidthClasses: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-full",
}

/**
 * GenericDialog component with fixed header/footer and independently scrollable body
 *
 * Features:
 * - Fixed header and footer
 * - Body scrolls independently
 * - Responsive design
 * - TypeScript support
 * - Accessibility features
 * - Works with React Hook Form
 * - No double scrollbar
 *
 * @example
 * ```tsx
 * <GenericDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Create Vehicle"
 *   description="Add a new vehicle to your fleet"
 *   showCloseButton
 *   maxWidth="lg"
 *   footer={
 *     <>
 *       <Button variant="outline" onClick={() => setIsOpen(false)}>
 *         Cancel
 *       </Button>
 *       <Button onClick={handleSubmit}>Create</Button>
 *     </>
 *   }
 * >
 *   <FormBuilder config={formConfig} onSubmit={handleSubmit} />
 * </GenericDialog>
 * ```
 */
export function GenericDialog({
  open,
  onOpenChange,
  title,
  children,
  footer,
  className,
  contentClassName,
  maxWidth = "md",
  preventOutsideClose = false,
  description,
  showHeaderDivider = true,
  showFooterDivider = true,
  bodyClassName,
}: GenericDialogProps) {
  const maxWidthClass = maxWidthClasses[maxWidth] || maxWidthClasses.md

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && preventOutsideClose) {
      return
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[min(90vh,760px)] flex-col gap-0 overflow-hidden p-0",
          maxWidthClass,
          contentClassName
        )}
        // Prevent close button click from triggering if preventOutsideClose is true
        onPointerDownOutside={(e) => {
          if (preventOutsideClose) {
            e.preventDefault()
          }
        }}
        aria-description={description}
      >
        {/* Fixed Header */}
        <DialogHeader
          className={cn(
            "border-border shrink-0 p-6 pb-4",
            showHeaderDivider ? "border-b" : null
          )}
        >
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </DialogHeader>

        {/* Independently Scrollable Body */}
        <div
          className={cn(
            "min-h-0 flex-1 overscroll-contain overflow-x-hidden overflow-y-auto px-6 py-4 touch-pan-y",
            bodyClassName
          )}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {children}
        </div>

        {/* Fixed Footer */}
        {footer ? (
          <div
            className={cn(
              "flex shrink-0 flex-row flex-wrap items-center justify-end gap-3",
              showFooterDivider
                ? "border-border bg-muted/50 border-t px-6 py-4"
                : "pt-0"
            )}
          >
            {footer}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

/**
 * Helper component for footer actions
 *
 * @example
 * ```tsx
 * <GenericDialogFooter>
 *   <Button variant="outline">Cancel</Button>
 *   <Button>Submit</Button>
 * </GenericDialogFooter>
 * ```
 */
export function GenericDialogFooter({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-row flex-wrap items-center justify-end gap-3",
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * Helper component for dialog body content with consistent spacing
 *
 * @example
 * ```tsx
 * <GenericDialogBody>
 *   <p>Dialog content here</p>
 * </GenericDialogBody>
 * ```
 */
export function GenericDialogBody({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`space-y-4 px-1 py-0 ${className || ""}`}>{children}</div>
  )
}
