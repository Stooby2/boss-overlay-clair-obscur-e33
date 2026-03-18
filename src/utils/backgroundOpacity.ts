export const DEFAULT_BACKGROUND_OPACITY = 85

export function normalizeBackgroundOpacity(value: unknown): number {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseFloat(value)
        : Number.NaN

  if (!Number.isFinite(parsed)) {
    return DEFAULT_BACKGROUND_OPACITY
  }

  return Math.min(100, Math.max(0, Math.round(parsed)))
}

export function getBackgroundColor(opacity: number): string {
  return `rgba(0, 0, 0, ${normalizeBackgroundOpacity(opacity) / 100})`
}
