import * as React from "react"

import { Eye, EyeOff } from "lucide-react"

import { Input } from "~/components/ui/input"
import { cn } from "~/lib/utils"

export type PasswordFieldProps = Omit<
  React.ComponentProps<typeof Input>,
  "type"
> & {
  /** Same as `<label htmlFor={id}>` for the password field. */
  id: string
}

const toggleBtnClass =
  "inline-flex size-7 shrink-0 items-center justify-center rounded-[min(var(--radius-md),12px)] border border-transparent bg-transparent text-muted-foreground outline-none select-none hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"

/**
 * Password input with a show / hide visibility toggle (does not replace strength validation).
 */
export const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField({ className, disabled, id, ...props }, ref) {
    const [visible, setVisible] = React.useState(false)

    return (
      <div className="relative">
        <Input
          ref={ref}
          id={id}
          type={visible ? "text" : "password"}
          disabled={disabled}
          className={cn("pr-9", className)}
          {...props}
        />
        <button
          type="button"
          disabled={disabled}
          className={cn(
            toggleBtnClass,
            "absolute top-1/2 right-1 -translate-y-1/2",
            "[transition:none] motion-reduce:transition-none [&_svg]:[transition:none]"
          )}
          style={{ transition: "none" }}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-controls={id}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
        >
          <span className="relative inline-flex size-4 items-center justify-center">
            <Eye
              className={cn(
                "absolute size-4 shrink-0 [transition:none]",
                visible && "hidden"
              )}
              aria-hidden
            />
            <EyeOff
              className={cn(
                "absolute size-4 shrink-0 [transition:none]",
                !visible && "hidden"
              )}
              aria-hidden
            />
          </span>
        </button>
      </div>
    )
  }
)
