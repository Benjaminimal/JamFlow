import { type ComponentProps, type JSX, useState } from "react";

import {
  Button,
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/ui-lib";

type DatePickerProps = {
  value: string | null;
  onChange: (v: string | null) => void;
  id: string;
} & Pick<ComponentProps<typeof Button>, "aria-describedby">;

export function DatePicker({
  value,
  onChange,
  id,
  ...buttonProps
}: DatePickerProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const selectedDate = value ? new Date(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          id={id}
          className="w-auto justify-between font-normal"
          {...buttonProps}
        >
          {selectedDate ? selectedDate.toLocaleDateString() : "Select date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          captionLayout="dropdown"
          onSelect={(date) => {
            onChange(date ? date.toISOString().split("T")[0] : null);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
