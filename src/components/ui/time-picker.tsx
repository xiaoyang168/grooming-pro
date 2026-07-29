"use client"

import * as React from "react"
import { Clock, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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
 * Beautiful time picker — click button to open HH:MM selectors in a popover.
 * Returns value as "HH:MM" 24h string (compatible with <input type="time"> consumers).
 */
export function TimePicker({
  value,
  onChange,
  placeholder = "Pick a time",
  disabled,
  minuteStep = 5,
  className,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const m = value?.match(/^(\d{1,2}):(\d{2})$/)
  const hh = m?.[1] ?? ""
  const mm = m?.[2] ?? ""

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))
  const minutes = Array.from(
    { length: Math.floor(60 / minuteStep) },
    (_, i) => String(i * minuteStep).padStart(2, "0")
  )

  function setHour(h: string) {
    onChange(hh ? `${h}:${mm}` : `${h}:00`)
  }
  function setMinute(min: string) {
    onChange(hh ? `${hh}:${min}` : `00:${min}`)
  }
  function clear(e: React.MouseEvent) {
    e.stopPropagation()
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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-9 px-3 text-sm",
            !formatted && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4 opacity-70" />
          {formatted || <span>{placeholder}</span>}
          {formatted && (
            <X className="ml-auto h-4 w-4 opacity-50 hover:opacity-100" onClick={clear} />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="flex items-center gap-2">
          <Select value={hh} onValueChange={setHour}>
            <SelectTrigger className="w-[72px] h-9"><SelectValue placeholder="HH" /></SelectTrigger>
            <SelectContent className="max-h-[240px]">
              {hours.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="text-lg font-semibold text-muted-foreground">:</span>
          <Select value={mm} onValueChange={setMinute}>
            <SelectTrigger className="w-[72px] h-9"><SelectValue placeholder="MM" /></SelectTrigger>
            <SelectContent className="max-h-[240px]">
              {minutes.map((min) => <SelectItem key={min} value={min}>{min}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  )
}
