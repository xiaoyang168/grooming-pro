"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
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
 * Compact time picker — looks like a single input field.
 * HH and MM selects are inline, sized like input boxes.
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

  return (
    <div
      className={cn(
        "flex items-center gap-2 h-10 w-full rounded-xl border bg-background px-3 text-sm transition-colors",
        "focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      <Clock className="h-4 w-4 opacity-60 shrink-0" />

      {/* Compact HH select styled like a number input */}
      <Select value={hh} onValueChange={setHour} disabled={disabled}>
        <SelectTrigger
          className="h-7 w-14 border-0 bg-muted/60 px-0 justify-center font-medium tabular-nums hover:bg-muted focus:ring-0 focus:ring-offset-0"
        >
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent className="max-h-[260px]">
          {hours.map((h) => (
            <SelectItem key={h} value={h} className="font-medium">{h}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-muted-foreground font-bold">:</span>

      {/* Compact MM select styled like a number input */}
      <Select value={mm} onValueChange={setMinute} disabled={disabled}>
        <SelectTrigger
          className="h-7 w-14 border-0 bg-muted/60 px-0 justify-center font-medium tabular-nums hover:bg-muted focus:ring-0 focus:ring-offset-0"
        >
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent className="max-h-[260px]">
          {minutes.map((min) => (
            <SelectItem key={min} value={min} className="font-medium">{min}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* AM/PM indicator (only when value set) */}
      <div className="ml-auto h-7 px-2 inline-flex items-center rounded-md bg-primary/10 text-primary text-xs font-bold">
        {(() => {
          if (!hh) return "—"
          const h = parseInt(hh, 10)
          return h < 12 ? "AM" : "PM"
        })()}
      </div>
    </div>
  )
}
