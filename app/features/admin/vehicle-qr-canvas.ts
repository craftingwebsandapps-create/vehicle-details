import type { VehicleQrTheme } from "~/types/admin-vehicle-qr-theme"

const FONT_STACK =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'

const REF_WIDTH_PX = 920

export type VehicleQrCanvasPreviewOptions = {
  theme: VehicleQrTheme
  registrationNumber: string
  /** Logical CSS pixels width (height computed from layout). */
  logicalWidth: number
  /** Optional logo URL (same-origin recommended). Default `/logo.png`. */
  logoSrc?: string
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.decoding = "async"
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function measureFitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxPx: number,
  weight: number
): number {
  let lo = 8
  let hi = Math.max(lo + 1, Math.floor(maxPx))
  while (lo < hi - 1) {
    const mid = Math.floor((lo + hi) / 2)
    ctx.font = `${weight} ${mid}px ${FONT_STACK}`
    if (ctx.measureText(text).width <= maxWidth) lo = mid
    else hi = mid
  }
  return lo
}

function fitTagFontSize(
  ctx: CanvasRenderingContext2D,
  line1: string,
  line2: string,
  maxWidth: number,
  maxHeight: number,
  weight: number,
  themeMaxPx: number,
  scale: number
): number {
  const cap = Math.floor(themeMaxPx * scale)
  let best = 10
  for (let fs = Math.min(cap, Math.floor(maxHeight / 2.4)); fs >= 10; fs--) {
    ctx.font = `${weight} ${fs}px ${FONT_STACK}`
    const w = Math.max(
      ctx.measureText(line1).width,
      ctx.measureText(line2).width
    )
    const lineGap = fs * 0.2
    const h = fs * 2 + lineGap
    if (w <= maxWidth && h <= maxHeight) {
      best = fs
      break
    }
  }
  return best
}

/**
 * Renders an approximate vehicle QR poster on canvas (preview only — will
 * differ from server PNG in fonts, metrics, logo fidelity, and print scale).
 */
export async function renderVehicleQrCanvasPreview(
  canvas: HTMLCanvasElement,
  {
    theme,
    registrationNumber,
    logicalWidth,
    logoSrc = "/logo.png",
  }: VehicleQrCanvasPreviewOptions
): Promise<void> {
  const reg = registrationNumber.trim()
  if (!reg) {
    const ctx = canvas.getContext("2d")
    if (ctx) {
      canvas.width = logicalWidth
      canvas.height = 120
      ctx.fillStyle = "#f4f4f5"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = "#71717a"
      ctx.font = `14px ${FONT_STACK}`
      ctx.fillText("Enter a registration number to preview.", 16, 64)
    }
    return
  }

  const { default: QRCode } = await import("qrcode")

  const W = Math.max(280, Math.floor(logicalWidth))
  const scale = W / REF_WIDTH_PX
  const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2)

  const qrMarginX = Math.round(22 * scale)
  const qrPadY = Math.round(18 * scale)
  const whiteRing = Math.round(12 * scale)

  const qrInner = Math.floor(Math.min(W - 2 * qrMarginX, W * 0.78))
  const qrSectionH = qrInner + 2 * whiteRing + 2 * qrPadY

  const midH = Math.max(Math.round(theme.tagStripHeightPx * scale), Math.round(72 * scale))
  const footerH = Math.max(
    Math.round(56 * scale),
    Math.min(Math.round(theme.regFontMaxPx * scale * 0.32), Math.round(140 * scale))
  )

  const H = qrSectionH + midH + footerH

  canvas.width = Math.round(W * dpr)
  canvas.height = Math.round(H * dpr)

  const ctx = canvas.getContext("2d")
  if (!ctx) return

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  ctx.fillStyle = theme.pageBg
  ctx.fillRect(0, 0, W, H)

  let y = 0

  /* ── QR section ── */
  ctx.fillStyle = theme.qrSectionBg
  ctx.fillRect(0, y, W, qrSectionH)

  const qrCanvas = document.createElement("canvas")
  await QRCode.toCanvas(qrCanvas, reg, {
    width: Math.max(64, Math.round(qrInner * dpr)),
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  })

  const qrX = (W - qrInner) / 2
  const qrY = y + qrPadY + whiteRing
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(qrX - whiteRing, qrY - whiteRing, qrInner + 2 * whiteRing, qrInner + 2 * whiteRing)
  ctx.drawImage(qrCanvas, qrX, qrY, qrInner, qrInner)

  y += qrSectionH

  /* ── Mid section ── */
  ctx.fillStyle = theme.midSectionBg
  ctx.fillRect(0, y, W, midH)

  const logo = await loadImage(logoSrc)
  const padX = Math.round(14 * scale)
  const innerMidW = W - padX * 2
  const logoSlotW = Math.round(innerMidW * 0.38)
  const textSlotX = padX + logoSlotW + Math.round(10 * scale)
  const textSlotW = W - textSlotX - padX
  const textPadY = Math.round(theme.tagVerticalPaddingPx * scale)

  const logoMaxH = midH - textPadY * 2
  const logoMaxW = logoSlotW - Math.round(8 * scale)

  if (logo && logo.naturalWidth > 0) {
    const lw = logo.naturalWidth
    const lh = logo.naturalHeight
    const r = Math.min(logoMaxW / lw, logoMaxH / lh)
    const dw = lw * r
    const dh = lh * r
    const lx = padX + (logoSlotW - dw) / 2
    const ly = y + (midH - dh) / 2
    ctx.drawImage(logo, lx, ly, dw, dh)
  }

  const l1 = theme.tagLine1.trim()
  const l2 = theme.tagLine2.trim()
  const tagFs = fitTagFontSize(
    ctx,
    l1,
    l2,
    textSlotW,
    midH - textPadY * 2,
    theme.tagFontWeight,
    theme.tagFontMaxPx,
    scale
  )

  ctx.textBaseline = "middle"
  ctx.textAlign = "left"
  const strokeW = Math.max(0.5, tagFs * theme.tagStrokeRatio)
  const midCY = y + midH / 2

  const drawTaggedLine = (text: string, lineY: number) => {
    ctx.font = `${theme.tagFontWeight} ${tagFs}px ${FONT_STACK}`
    if (strokeW >= 0.75 && theme.tagStrokeRatio > 0) {
      ctx.lineJoin = "round"
      ctx.lineWidth = strokeW
      ctx.strokeStyle = theme.tagColor
      ctx.strokeText(text, textSlotX, lineY)
    }
    ctx.fillStyle = theme.tagColor
    ctx.fillText(text, textSlotX, lineY)
  }

  const lineGap = tagFs * 1.15
  drawTaggedLine(l1, midCY - lineGap / 2)
  drawTaggedLine(l2, midCY + lineGap / 2)

  y += midH

  /* ── Footer ── */
  ctx.fillStyle = theme.footerSectionBg
  ctx.fillRect(0, y, W, footerH)

  const footerPadX = Math.round(12 * scale)
  const maxRegPx = Math.floor(theme.regFontMaxPx * scale)
  const regFs = measureFitFontSize(
    ctx,
    reg,
    W - 2 * footerPadX,
    maxRegPx,
    theme.regFontWeight
  )
  ctx.font = `${theme.regFontWeight} ${regFs}px ${FONT_STACK}`
  ctx.fillStyle = theme.regColor
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(reg, W / 2, y + footerH / 2)
}
