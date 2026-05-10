import { useEffect, useRef, useState } from "react"

import { renderVehicleQrCanvasPreview } from "~/features/admin/vehicle-qr-canvas"
import { cn } from "~/lib/utils"
import type { VehicleQrTheme } from "~/types/admin-vehicle-qr-theme"

type VehicleQrCanvasPreviewProps = {
  theme: VehicleQrTheme
  registrationNumber: string
  /** Logical width in CSS pixels (canvas scales with devicePixelRatio). */
  logicalWidth?: number
  logoSrc?: string
  className?: string
}

export function VehicleQrCanvasPreview({
  theme,
  registrationNumber,
  logicalWidth = 440,
  logoSrc,
  className,
}: VehicleQrCanvasPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let cancelled = false
    setError(null)

    void (async () => {
      try {
        await renderVehicleQrCanvasPreview(canvas, {
          theme,
          registrationNumber,
          logicalWidth,
          logoSrc,
        })
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Preview failed to render")
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [theme, registrationNumber, logicalWidth, logoSrc])

  return (
    <div className={cn("space-y-2", className)}>
      <canvas
        ref={canvasRef}
        className="mx-auto block h-auto w-full max-w-full rounded-lg border border-border bg-muted/15 shadow-sm"
        aria-label="Vehicle QR layout preview (approximate)"
      />
      {error ? (
        <p className="text-destructive text-xs">{error}</p>
      ) : (
        <p className="text-muted-foreground text-[0.65rem] leading-snug">
          Approximate canvas preview: system fonts, raster logo, and proportions can
          differ from the server-generated PNG (including print / A4 scaling).
        </p>
      )}
    </div>
  )
}
