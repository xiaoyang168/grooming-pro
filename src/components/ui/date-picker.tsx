"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerProps {
  value?: string          // ISO string: "YYYY-MM-DD" or ""
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  fromDate?: Date         // minimum selectable date
  toDate?: Date          // maximum selectable date
  className?: string
}

/**
 * Beautiful date picker — click button to open a calendar popover.
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
  // Local mirror of selected date so Calendar's selected prop is always correct
  const [internal, setInternal] = React.useState<Date | undefined>(
    value ? new Date(value + "T00:00:00") : undefined
  )
  // Sync internal when external `value` changes (e.g. when form is reset)
  React.useEffect(() => {
    setInternal(value ? new Date(value + "T00:00:00") : undefined)
  }, [value])

  const display = internal

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-9 px-3 text-sm",
            !display && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
          {display ? format(display, "MMM d, yyyy") : <span>{placeholder}</span>}
          {display && (
            <X
              className="ml-auto h-4 w-4 opacity-50 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation()
                setInternal(undefined)
                onChange("")
              }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={display}
          onSelect={(d) => {
            const picked = d ?? undefined
            setInternal(picked)
            onChange(picked ? format(picked, "yyyy-MM-dd") : "")
            setOpen(false)
          }}
          disabled={(d) => {
            if (fromDate && d < fromDate) return true
            if (toDate && d > toDate) return true
            return false
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
