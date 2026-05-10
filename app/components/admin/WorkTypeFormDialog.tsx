import { useEffect, useState } from "react"

import { toast } from "sonner"

import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Textarea } from "~/components/ui/textarea"
import { createWorkType, updateWorkType } from "~/features/admin/work-types-api"
import type { UpdateWorkTypePayload, WorkTypeRecord } from "~/types/work-type"
import { getApiErrorMeta } from "~/services/api-error"

const NAME_RANGE = { min: 1, max: 200 } as const
const DESC_MAX = 2000
const CODE_RE = /^[A-Za-z0-9_-]{1,64}$/

type WorkTypeFormDialogProps = {
  mode: "create" | "edit"
  open: boolean
  onOpenChange: (open: boolean) => void
  workType?: WorkTypeRecord | null
  onSaved: () => void
}

export function WorkTypeFormDialog({
  mode,
  open,
  onOpenChange,
  workType,
  onSaved,
}: WorkTypeFormDialogProps) {
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [description, setDescription] = useState("")

  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitCode, setSubmitCode] = useState<string | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }
    setSubmitError(null)
    setSubmitCode(undefined)
    if (mode === "edit" && workType) {
      setName(workType.name ?? "")
      setCode(workType.code ?? "")
      setDescription(
        workType.description !== null && workType.description !== undefined
          ? workType.description
          : ""
      )
    } else if (mode === "create") {
      setName("")
      setCode("")
      setDescription("")
    }
  }, [open, mode, workType])

  const validateFields = (): string | null => {
    const nt = name.trim()
    const cc = code.trim()
    if (
      nt.length < NAME_RANGE.min ||
      nt.length > NAME_RANGE.max ||
      !CODE_RE.test(cc)
    ) {
      return "Name must be 1–200 characters. Code must be 1–64 characters (letters, digits, underscore, hyphen only)."
    }
    const dt = description.trim()
    if (dt.length > DESC_MAX) {
      return `Description must be at most ${DESC_MAX} characters.`
    }
    return null
  }

  const handleSubmit = async () => {
    setSubmitError(null)
    setSubmitCode(undefined)

    const err = validateFields()
    if (err) {
      setSubmitError(err)
      return
    }

    const nt = name.trim()
    const cc = code.trim()
    const dt = description.trim()

    setSubmitting(true)
    try {
      if (mode === "create") {
        await createWorkType({
          name: nt,
          code: cc,
          description: dt === "" ? undefined : dt,
        })
        toast.success("Work type created")
      } else if (workType) {
        const patch: UpdateWorkTypePayload = {}
        if (nt !== workType.name) {
          patch.name = nt
        }
        if (cc !== workType.code) {
          patch.code = cc
        }
        const prevDesc = (workType.description ?? "").trim()
        if (dt !== prevDesc) {
          patch.description = dt === "" ? "" : dt
        }
        if (Object.keys(patch).length === 0) {
          toast.info("No changes to save.")
          setSubmitting(false)
          return
        }
        await updateWorkType(workType._id, patch)
        toast.success("Work type updated")
      }
      onSaved()
      onOpenChange(false)
    } catch (e: unknown) {
      const meta = getApiErrorMeta(e)
      setSubmitError(meta.message)
      setSubmitCode(meta.code)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,640px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-border shrink-0 border-b p-6 pb-4">
          <DialogTitle>
            {mode === "create" ? "Create work type" : "Edit work type"}
          </DialogTitle>
          <DialogDescription>
            Reference data at{" "}
            <code className="text-xs">GET/POST /api/work-types</code>. Codes are
            stored uppercase on the server.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="space-y-2">
            <label
              htmlFor="wt-code"
              className="text-sm font-medium text-foreground"
            >
              Code
            </label>
            <Input
              id="wt-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={64}
              autoComplete="off"
              placeholder="e.g. HAULAGE"
            />
            <p className="text-muted-foreground text-xs">
              1–64 characters: letters, digits, underscore, hyphen (stored
              uppercase server-side).
            </p>
          </div>
          <div className="space-y-2">
            <label
              htmlFor="wt-name"
              className="text-sm font-medium text-foreground"
            >
              Name
            </label>
            <Input
              id="wt-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="wt-desc"
              className="text-sm font-medium text-foreground"
            >
              Description{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </label>
            <Textarea
              id="wt-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={DESC_MAX}
              rows={4}
              placeholder="Leave blank to unset"
            />
            <p className="text-muted-foreground text-xs">
              Max {DESC_MAX} characters. Empty clears on save (edit).
            </p>
          </div>

          {submitError ? (
            <div className="text-destructive text-sm">
              <p>{submitError}</p>
              {submitCode ? (
                <p className="text-muted-foreground mt-1 font-mono text-xs">
                  {submitCode}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="border-border bg-muted/50 flex shrink-0 flex-row flex-wrap items-center justify-end gap-3 border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={submitting}
            onClick={() => void handleSubmit()}
          >
            {submitting ? "Saving…" : mode === "create" ? "Create" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
