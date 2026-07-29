"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"

interface DatePickerProps {
  value?: string          // ISO string: "YYYY-MM-DD" or ""
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  fromDate?: Date
  toDate?: Date
  className?: string
}

/**
 * Beautiful date picker — click button to reveal a calendar panel below it.
 * Self-contained (no Radix Popover) so it never fights with day-picker's DOM mutations.
 * Returns value as ISO string "YYYY-MM-DD".
 */
export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  fromDate,
  toDate,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const internalDate = value ? new Date(value + "T00:00:00") : undefined
  const display = internalDate

  // Close on outside click
  React.useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  function handleSelect(d?: Date) {
    const picked = d ?? undefined
    onChange(picked ? format(picked, "yyyy-MM-dd") : "")
    setOpen(false)
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange("")
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={cn(
          "w-full justify-start text-left font-normal h-9 px-3 text-sm",
          !display && "text-muted-foreground",
          open && "border-primary ring-2 ring-primary/20"
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
        {display ? format(display, "MMM d, yyyy") : <span>{placeholder}</span>}
        {display && (
          <X
            className="ml-auto h-4 w-4 opacity-50 hover:opacity-100"
            onClick={clear}
          />
        )}
      </Button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 rounded-xl border bg-popover shadow-lg animate-in fade-in zoom-in-95">
          <Calendar
            mode="single"
            selected={display}
            onSelect={handleSelect}
            disabled={(d) => {
              if (fromDate && d < fromDate) return true
              if (toDate && d > toDate) return true
              return false
            }}
          />
        </div>
      )}
    </div>
  )
}
