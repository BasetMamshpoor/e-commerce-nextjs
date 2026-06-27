"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export interface ComboboxOption {
  value: string;
  label: string;
  /** Optional color hex (for color attributes). */
  colorHex?: string | null;
}

interface MultiSelectComboboxProps {
  options: ComboboxOption[];
  /** Selected values. */
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Multi-select combobox with search.
 * Used for brand filters, attribute value filters, etc.
 */
export function MultiSelectCombobox({
  options,
  value,
  onChange,
  placeholder = "انتخاب کنید...",
  searchPlaceholder = "جست‌وجو...",
  emptyText = "موردی یافت نشد",
  className,
  disabled,
}: MultiSelectComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const toggle = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const selectedLabels = options
    .filter((o) => value.includes(o.value))
    .map((o) => o.label);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          <span className="flex items-center gap-2 truncate">
            {selectedLabels.length > 0 ? (
              <span className="flex flex-wrap gap-1">
                {selectedLabels.slice(0, 2).map((label) => (
                  <Badge key={label} variant="secondary" className="text-[10px]">
                    {label}
                  </Badge>
                ))}
                {selectedLabels.length > 2 && (
                  <Badge variant="secondary" className="text-[10px]">
                    +{selectedLabels.length - 2}
                  </Badge>
                )}
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => toggle(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      value.includes(option.value) ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {option.colorHex && (
                    <span
                      className="ml-1 size-3 rounded-full border border-border"
                      style={{ backgroundColor: option.colorHex }}
                    />
                  )}
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
