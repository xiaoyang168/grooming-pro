/**
 * Format cents to USD currency string
 * Usage: formatCurrency(5900) → "$59" | formatCurrency(1599) → "$15.99"
 */
export function formatCurrency(cents: number, showDecimals = false): string {
  const dollars = cents / 100
  if (showDecimals || cents % 100 !== 0) {
    return `$${dollars.toFixed(2)}`
  }
  return `$${dollars.toFixed(0)}`
}

/**
 * Format a Date to YYYY-MM-DD in local timezone (not UTC)
 * Fixes timezone offset bug with toISOString()
 */
export function formatDateLocal(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}
