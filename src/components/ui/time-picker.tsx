"use client"

import * as React from "react"
import { Clock, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

interface TimePickerProps {
  /** "HH:MM" 24h format, e.g. "14:30". Use "" when not set. */
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  /** Minute step. Defaults to 5. Use 1 for any minute, 15 for quarter-hour slots. */
  minuteStep?: number
  className?: string
}

/**
 * Beautiful inline time picker — HH:MM selectors shown directly.
 * Designed to avoid Radix Popover+Select nesting conflicts.
 * Returns value as "HH:MM" 24h string.
 */
export function TimePicker({
  value,
  onChange,
  disabled,
  minuteStep = 5,
  className,
}: TimePickerProps) {
  const m = value?.match(/^(\d{1,2}):(\d{2})$/)
  const hh = m?.[1] ?? ""
  const mm = m?.[2] ?? ""

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))
  const minutes = Array.from(
    { length: Math.floor(60 / minuteStep) },
    (_, i) => String(i * minuteStep).padStart(2, "0")
  )

  function setHour(h: string) {
    onChange(mm ? `${h}:${mm}` : `${h}:00`)
  }
  function setMinute(min: string) {
    onChange(hh ? `${hh}:${min}` : `00:${min}`)
  }
  function clear() {
    onChange("")
  }

  const formatted = (() => {
    if (!value || !m) return null
    const h = parseInt(hh, 10)
    const ampm = h < 12 ? "AM" : "PM"
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
    return `${h12}:${mm} ${ampm}`
  })()

  return (
    <div
      className={cn(
        "flex items-center gap-1 w-full h-9 rounded-xl border bg-background px-3 text-sm",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      <Clock className="h-4 w-4 opacity-70 shrink-0" />
      {formatted ? (
        <span className="font-medium tabular-nums">{formatted}</span>
      ) : (
        <span className="text-muted-foreground">Pick a time</span>
      )}
      <div className="ml-auto flex items-center gap-1">
        <Select value={hh} onValueChange={setHour}>
          <SelectTrigger className="h-7 w-14 px-2 text-xs border-0 bg-muted/40">
            <SelectValue placeholder="HH" />
          </SelectTrigger>
          <SelectContent className="max-h-[240px]">
            {hours.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground">:</span>
        <Select value={mm} onValueChange={setMinute}>
          <SelectTrigger className="h-7 w-14 px-2 text-xs border-0 bg-muted/40">
            <SelectValue placeholder="MM" />
          </SelectTrigger>
          <SelectContent className="max-h-[240px]">
            {minutes.map((min) => <SelectItem key={min} value={min}>{min}</SelectItem>)}
          </SelectContent>
        </Select>
        {formatted && (
          <button
            type="button"
            onClick={clear}
            className="ml-1 h-5 w-5 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted"
            aria-label="Clear time"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  )
}
