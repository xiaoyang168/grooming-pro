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
 * Returns value as ISO string "YYYY-MM-DD" (compatible with <input type="date"> consumers).
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
  const date = value ? new Date(value + "T00:00:00") : undefined
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-9 px-3 text-sm",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
          {date ? format(date, "MMM d, yyyy") : <span>{placeholder}</span>}
          {date && (
            <X
              className="ml-auto h-4 w-4 opacity-50 hover:opacity-100"
              onClick={(e) => { e.stopPropagation(); onChange("") }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            onChange(d ? format(d, "yyyy-MM-dd") : "")
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
