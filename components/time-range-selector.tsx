"use client"

import { Button } from "@/components/ui/button"
import type { TimeRange } from "../lib/sentiment-api"

interface TimeRangeSelectorProps {
  selectedRange: TimeRange
  onRangeChange: (range: TimeRange) => void
}

const timeRanges: { value: TimeRange; label: string; description: string }[] = [
  { value: "1h", label: "1H", description: "Last hour (1min intervals)" },
  { value: "6h", label: "6H", description: "Last 6 hours (5min intervals)" },
  { value: "1d", label: "1D", description: "Last 24 hours (1hr intervals)" },
  { value: "1w", label: "1W", description: "Last week (1hr intervals)" },
]

export function TimeRangeSelector({ selectedRange, onRangeChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      {timeRanges.map((range) => (
        <Button
          key={range.value}
          variant={selectedRange === range.value ? "default" : "ghost"}
          size="sm"
          onClick={() => onRangeChange(range.value)}
          className="text-xs"
          title={range.description}
        >
          {range.label}
        </Button>
      ))}
    </div>
  )
}
