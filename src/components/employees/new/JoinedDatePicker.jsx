"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// --- Helper Functions (Slightly improved) ---

function formatDate(date) {
  if (!date || !isValidDate(date)) {
    return "";
  }
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function isValidDate(date) {
  return date instanceof Date && !isNaN(date.getTime());
}

export function JoinedDatePicker({ label, value, onChange }) {
  const [open, setOpen] = React.useState(false);

  // This state is for calendar navigation
  const [month, setMonth] = React.useState(value || new Date());

  // This state is ONLY for the text input, to allow partial typing
  const [inputValue, setInputValue] = React.useState(formatDate(value));

  // --- 2. Sync input text when form value changes externally (e.g., form.reset()) ---
  React.useEffect(() => {
    setInputValue(formatDate(value));
    if (value) {
      setMonth(value);
    }
  }, [value]);

  // --- 3. Handle selection from the Calendar ---
  const handleCalendarSelect = (selectedDate) => {
    onChange(selectedDate); // <-- Update react-hook-form state

    if (selectedDate) {
      setInputValue(formatDate(selectedDate)); // Update local text input
      setMonth(selectedDate);
    }
    setOpen(false);
  };

  // --- 4. Handle typing in the text input ---
  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputValue(text); // Update local text input

    const date = new Date(text);
    if (isValidDate(date)) {
      onChange(date); // Update RHF if the typed date is valid
      setMonth(date);
    } else {
      // Optional: If you want to clear invalid partial dates
      // onChange(undefined);
    }
  };

  // --- 5. On blur, re-format the input to match the *actual* RHF state ---
  // This cleans up any invalid text the user left behind.
  const handleInputBlur = () => {
    setInputValue(formatDate(value));
  };

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor="date" className="px-1">
        {label}
      </Label>
      <div className="relative flex gap-2">
        <Input
          id="date"
          value={inputValue} // Use local input state
          placeholder="June 01, 2025"
          className="bg-background pr-10"
          onChange={handleInputChange} // Use text change handler
          onBlur={handleInputBlur} // Use blur handler
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
            }
          }}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id="date-picker"
              variant="ghost"
              className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
            >
              <CalendarIcon className="size-3.5" />
              <span className="sr-only">Select date</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto overflow-hidden p-0"
            align="end"
            alignOffset={-8}
            sideOffset={10}
          >
            <Calendar
              mode="single"
              selected={value} // <-- Calendar is controlled by RHF value
              captionLayout="dropdown"
              month={month}
              onMonthChange={setMonth}
              onSelect={handleCalendarSelect} // <-- Use RHF-aware handler
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
