/** Theme used when rendering branded vehicle QR PNGs (admin-configurable). */

export type VehicleQrTheme = {
  tagLine1: string
  tagLine2: string
  qrSectionBg: string
  midSectionBg: string
  footerSectionBg: string
  tagColor: string
  regColor: string
  pageBg: string
  tagFontWeight: number
  regFontWeight: number
  tagFontMaxPx: number
  regFontMaxPx: number
  tagStripHeightPx: number
  tagVerticalPaddingPx: number
  tagStrokeRatio: number
}

export type UpdateVehicleQrThemePayload = Partial<VehicleQrTheme>

export type VehicleQrThemeApiData = {
  theme: VehicleQrTheme
  updatedAt: string | null
}

/** Defaults aligned with backend when no document exists yet */
export const DEFAULT_VEHICLE_QR_THEME: VehicleQrTheme = {
  tagLine1: "PROUDLY BUILDING",
  tagLine2: "PEOPLE'S CAPITAL",
  qrSectionBg: "#FDE7D9",
  midSectionBg: "#ffffff",
  footerSectionBg: "#000000",
  tagColor: "#000000",
  regColor: "#ffffff",
  pageBg: "#ffffff",
  tagFontWeight: 900,
  regFontWeight: 900,
  tagFontMaxPx: 920,
  regFontMaxPx: 900,
  tagStripHeightPx: 200,
  tagVerticalPaddingPx: 14,
  tagStrokeRatio: 0.032,
}

export function mergeVehicleQrTheme(
  partial: Partial<VehicleQrTheme> | undefined | null
): VehicleQrTheme {
  return { ...DEFAULT_VEHICLE_QR_THEME, ...partial }
}
