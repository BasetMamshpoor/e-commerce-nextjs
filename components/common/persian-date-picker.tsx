"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { faIR } from "date-fns-jalali/locale";
import { Calendar as CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDateTimeFa } from "@/utils/format";

/** Convert Gregorian Date to ISO string for backend (end of day). */
function toISO(date: Date | undefined): string | undefined {
  if (!date) return undefined;
  date.setHours(23, 59, 59, 0);
  return date.toISOString();
}

interface PersianDatePickerProps {
  value?: string | null;
  onChange: (isoString: string | null) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Persian (Jalali) date picker using react-day-picker + date-fns-jalali locale.
 * Displays dates in Persian calendar, outputs ISO string for backend.
 */
export function PersianDatePicker({
  value,
  onChange,
  placeholder = "انتخاب تاریخ",
  className,
}: PersianDatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selectedDate = value ? new Date(value) : undefined;

  const formatDate = (date: Date | undefined): string => {
    if (!date) return placeholder;
    return formatDateTimeFa(date.toISOString());
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-right font-normal",
            !selectedDate && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="ml-2 size-4" />
          {formatDate(selectedDate)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <DayPicker
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            onChange(toISO(date) ?? null);
            setOpen(false);
          }}
          locale={faIR}
          dir="rtl"
          className="p-3"
        />
      </PopoverContent>
    </Popover>
  );
}
