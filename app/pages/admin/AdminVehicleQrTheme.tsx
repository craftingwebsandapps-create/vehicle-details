import { useCallback, useEffect, useId, useState } from "react"

import { format } from "date-fns"
import { QrCode, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"
import { Button } from "~/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Skeleton } from "~/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import {
  getAdminVehicleQrTheme,
  updateAdminVehicleQrTheme,
} from "~/features/admin/api"
import { useAppSelector } from "~/hooks"
import { getApiErrorMeta } from "~/services/api-error"
import {
  DEFAULT_VEHICLE_QR_THEME,
  mergeVehicleQrTheme,
  type VehicleQrTheme,
} from "~/types/admin-vehicle-qr-theme"

const FONT_WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const

function validateVehicleQrTheme(t: VehicleQrTheme): string[] {
  const errs: string[] = []

  const line = (v: string, name: string) => {
    const s = v.trim()
    if (s.length < 1 || s.length > 80) {
      errs.push(`${name} must be between 1 and 80 characters.`)
    }
  }
  line(t.tagLine1, "Tag line 1")
  line(t.tagLine2, "Tag line 2")

  const hex = (v: string, name: string) => {
    if (!/^#[0-9A-Fa-f]{6}$/.test(v.trim())) {
      errs.push(`${name} must be a #RRGGBB hex color.`)
    }
  }
  hex(t.qrSectionBg, "QR section background")
  hex(t.midSectionBg, "Middle section background")
  hex(t.footerSectionBg, "Footer section background")
  hex(t.tagColor, "Tag text color")
  hex(t.regColor, "Registration text color")
  hex(t.pageBg, "Page background")

  const wi = (
    n: number,
    name: string,
    min: number,
    max: number,
    step?: number
  ) => {
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
      errs.push(`${name} must be an integer.`)
      return
    }
    if (n < min || n > max) {
      errs.push(`${name} must be between ${min} and ${max}.`)
    }
    if (step !== undefined && n % step !== 0) {
      errs.push(`${name} must be a multiple of ${step}.`)
    }
  }

  wi(t.tagFontWeight, "Tag font weight", 100, 900, 100)
  wi(t.regFontWeight, "Registration font weight", 100, 900, 100)
  wi(t.tagFontMaxPx, "Tag font max (px)", 24, 960)
  wi(t.regFontMaxPx, "Registration font max (px)", 24, 960)
  wi(t.tagStripHeightPx, "Tag strip height (px)", 120, 280)
  wi(t.tagVerticalPaddingPx, "Tag vertical padding (px)", 4, 48)

  if (!Number.isFinite(t.tagStrokeRatio)) {
    errs.push("Tag stroke ratio must be a number.")
  } else if (t.tagStrokeRatio < 0 || t.tagStrokeRatio > 0.15) {
    errs.push("Tag stroke ratio must be between 0 and 0.15.")
  }

  return errs
}

function HexRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (next: string) => void
}) {
  const id = useId()
  const pickerValue = /^#[0-9A-Fa-f]{6}$/.test(value.trim())
    ? `#${value.trim().slice(1).toUpperCase()}`
    : "#000000"

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1 space-y-1.5">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => {
            const s = value.trim()
            if (/^#[0-9A-Fa-f]{6}$/i.test(s)) {
              onChange(`#${s.slice(1).toUpperCase()}`)
            }
          }}
          spellCheck={false}
          className="font-mono text-sm"
          placeholder="#RRGGBB"
          maxLength={7}
        />
      </div>
      <input
        type="color"
        aria-label={`${label} color picker`}
        value={pickerValue}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        className="border-input bg-background h-10 w-full cursor-pointer rounded-md border sm:w-14 sm:shrink-0"
      />
    </div>
  )
}

function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (n: number) => void
}) {
  const id = useId()

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => {
          const raw = e.target.value
          if (raw === "") {
            onChange(NaN)
            return
          }
          onChange(Number(raw))
        }}
      />
    </div>
  )
}

export default function AdminVehicleQrTheme() {
  const contractorId = useAppSelector((s) => s.auth.contractorId)
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const superadminOnly = isAuthenticated && contractorId === null

  const [theme, setTheme] = useState<VehicleQrTheme>(DEFAULT_VEHICLE_QR_THEME)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await getAdminVehicleQrTheme()
      setTheme(mergeVehicleQrTheme(data.theme))
      setUpdatedAt(data.updatedAt)
    } catch (e: unknown) {
      setLoadError(getApiErrorMeta(e).message)
      setTheme(DEFAULT_VEHICLE_QR_THEME)
      setUpdatedAt(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (superadminOnly) {
      void load()
    }
  }, [superadminOnly, load])

  const patch = (partial: Partial<VehicleQrTheme>) => {
    setTheme((prev) => ({ ...prev, ...partial }))
    setValidationErrors([])
  }

  const handleSave = async () => {
    const errs = validateVehicleQrTheme(theme)
    if (errs.length > 0) {
      setValidationErrors(errs)
      return
    }
    setValidationErrors([])
    setSaving(true)
    try {
      const data = await updateAdminVehicleQrTheme(theme)
      setTheme(mergeVehicleQrTheme(data.theme))
      setUpdatedAt(data.updatedAt)
      toast.success("Vehicle QR theme saved")
    } catch (e: unknown) {
      toast.error(getApiErrorMeta(e).message)
    } finally {
      setSaving(false)
    }
  }

  if (!superadminOnly) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Vehicle QR theme
        </h1>
        <Alert variant="destructive">
          <AlertTitle>Superadmin only</AlertTitle>
          <AlertDescription>
            Configure branded QR artwork via{" "}
            <code className="text-xs">/api/admin/vehicle-qr-theme</code>. Sign
            in with a platform account without a tenant{" "}
            <code className="text-xs">contractorId</code>.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <QrCode className="size-7 text-primary" aria-hidden />
            Vehicle QR theme
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Colours and typography for tenant vehicle QR PNGs. Changes apply to
            newly generated images.
          </p>
          <p className="text-muted-foreground mt-2 text-xs">
            Last updated:{" "}
            {loading ? (
              <Skeleton className="inline-block h-3 w-36 align-middle" />
            ) : updatedAt ? (
              format(new Date(updatedAt), "PPpp")
            ) : (
              "Never (defaults)"
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => void load()}
            disabled={loading || saving}
          >
            <RefreshCw
              className={`size-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Reload
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => void handleSave()}
            disabled={loading || saving}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {loadError ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load theme</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <span>{loadError}</span>
            <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {validationErrors.length > 0 ? (
        <Alert variant="destructive">
          <AlertTitle>Fix validation errors</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-inside list-disc text-sm">
              {validationErrors.map((msg, i) => (
                <li key={`${i}-${msg}`}>{msg}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      {loading && !loadError ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Tag lines</CardTitle>
              <CardDescription>
                Strings rendered on the QR artwork (1–80 characters each).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="vq-tag1" className="text-sm font-medium">
                  Tag line 1
                </label>
                <Input
                  id="vq-tag1"
                  value={theme.tagLine1}
                  maxLength={80}
                  onChange={(e) => patch({ tagLine1: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="vq-tag2" className="text-sm font-medium">
                  Tag line 2
                </label>
                <Input
                  id="vq-tag2"
                  value={theme.tagLine2}
                  maxLength={80}
                  onChange={(e) => patch({ tagLine2: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Colours</CardTitle>
              <CardDescription>
                Six-digit hex values (<code className="text-xs">#RRGGBB</code>
                ).
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <HexRow
                label="QR section background"
                value={theme.qrSectionBg}
                onChange={(v) => patch({ qrSectionBg: v })}
              />
              <HexRow
                label="Middle section background"
                value={theme.midSectionBg}
                onChange={(v) => patch({ midSectionBg: v })}
              />
              <HexRow
                label="Footer section background"
                value={theme.footerSectionBg}
                onChange={(v) => patch({ footerSectionBg: v })}
              />
              <HexRow
                label="Tag text colour"
                value={theme.tagColor}
                onChange={(v) => patch({ tagColor: v })}
              />
              <HexRow
                label="Registration text colour"
                value={theme.regColor}
                onChange={(v) => patch({ regColor: v })}
              />
              <HexRow
                label="Page background"
                value={theme.pageBg}
                onChange={(v) => patch({ pageBg: v })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Typography & layout</CardTitle>
              <CardDescription>
                Numeric bounds match server validation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <span className="text-sm font-medium">Tag font weight</span>
                  <Select
                    value={String(theme.tagFontWeight)}
                    onValueChange={(v) =>
                      patch({ tagFontWeight: Number.parseInt(v, 10) })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_WEIGHTS.map((w) => (
                        <SelectItem key={w} value={String(w)}>
                          {w}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <span className="text-sm font-medium">
                    Registration font weight
                  </span>
                  <Select
                    value={String(theme.regFontWeight)}
                    onValueChange={(v) =>
                      patch({ regFontWeight: Number.parseInt(v, 10) })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_WEIGHTS.map((w) => (
                        <SelectItem key={w} value={String(w)}>
                          {w}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField
                  label="Tag font max (px)"
                  value={theme.tagFontMaxPx}
                  min={24}
                  max={960}
                  onChange={(n) => patch({ tagFontMaxPx: n })}
                />
                <NumberField
                  label="Registration font max (px)"
                  value={theme.regFontMaxPx}
                  min={24}
                  max={960}
                  onChange={(n) => patch({ regFontMaxPx: n })}
                />
                <NumberField
                  label="Tag strip height (px)"
                  value={theme.tagStripHeightPx}
                  min={120}
                  max={280}
                  onChange={(n) => patch({ tagStripHeightPx: n })}
                />
                <NumberField
                  label="Tag vertical padding (px)"
                  value={theme.tagVerticalPaddingPx}
                  min={4}
                  max={48}
                  onChange={(n) => patch({ tagVerticalPaddingPx: n })}
                />
              </div>

              <div className="max-w-xs space-y-1.5">
                <label htmlFor="vq-stroke" className="text-sm font-medium">
                  Tag stroke ratio (0–0.15)
                </label>
                <Input
                  id="vq-stroke"
                  type="number"
                  min={0}
                  max={0.15}
                  step={0.001}
                  value={
                    Number.isFinite(theme.tagStrokeRatio)
                      ? theme.tagStrokeRatio
                      : ""
                  }
                  onChange={(e) => {
                    const raw = e.target.value
                    if (raw === "") {
                      patch({ tagStrokeRatio: NaN })
                      return
                    }
                    patch({ tagStrokeRatio: Number(raw) })
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <p className="text-muted-foreground text-xs">
            API:{" "}
            <code className="rounded bg-muted px-1 py-0.5">
              GET / PUT /api/admin/vehicle-qr-theme
            </code>
          </p>
        </>
      )}
    </div>
  )
}
