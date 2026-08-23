"use client";

import { useState } from "react";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  startMonth?: Date;
  endMonth?: Date;
};

export function DatePicker({
  value,
  onChange,
  placeholder = "Sélectionner une date",
  className,
  startMonth = new Date(2010, 0),
  endMonth = new Date(),
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  // noon avoids date shifting in negative-UTC timezones
  const selected = value ? new Date(`${value}T12:00:00`) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground", className)}
        >
          <CalendarIcon className="mr-2 size-4" />
          {selected ? format(selected, "d MMMM yyyy", { locale: fr }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            onChange?.(date ? format(date, "yyyy-MM-dd") : "");
            setOpen(false);
          }}
          captionLayout="dropdown"
          locale={fr}
          startMonth={startMonth}
          endMonth={endMonth}
        />
      </PopoverContent>
    </Popover>
  );
}
