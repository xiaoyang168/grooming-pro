import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount / 100)
}

export function formatDate(date: string | Date, format: "short" | "long" | "time" = "short"): string {
  const d = typeof date === "string" ? new Date(date) : date
  switch (format) {
    case "long":
      return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    case "time":
      return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    default:
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }
}

export function formatTimeRange(start: string, end: string): string {
  return `${formatDate(start, "time")} - ${formatDate(end, "time")}`
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    checked_in: "bg-purple-100 text-purple-800",
    in_progress: "bg-orange-100 text-orange-800",
    completed: "bg-green-100 text-green-800",
    canceled: "bg-red-100 text-red-800",
    no_show: "bg-gray-100 text-gray-800",
  }
  return map[status] || "bg-gray-100 text-gray-800"
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    checked_in: "Checked In",
    in_progress: "In Progress",
    completed: "Completed",
    canceled: "Canceled",
    no_show: "No Show",
  }
  return map[status] || status
}

export function getDaysSince(date: string): number {
  const now = new Date()
  const d = new Date(date)
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
}
