"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface DatePickerWithRangeProps {
  className?: string
  onDateChange?: (dateRange: { from: string; to: string }) => void
}

export function DatePickerWithRange({
  className,
  onDateChange,
}: DatePickerWithRangeProps) {
  const [dateFrom, setDateFrom] = React.useState('')
  const [dateTo, setDateTo] = React.useState('')

  React.useEffect(() => {
    if (dateFrom && dateTo && onDateChange) {
      onDateChange({ from: dateFrom, to: dateTo })
    }
  }, [dateFrom, dateTo, onDateChange])

  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
      <div>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          placeholder="Fecha inicio"
        />
      </div>
      <div>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          placeholder="Fecha fin"
        />
      </div>
    </div>
  )
}
