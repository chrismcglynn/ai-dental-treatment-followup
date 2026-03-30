"use client";

import { useState, useRef } from "react";
import { Check, ChevronsUpDown, X, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
import { DENTAL_CODE_CATEGORIES } from "@/lib/dental-codes";
import { DentalCodesSheet } from "./DentalCodesSheet";

interface ProcedureCodeSelectProps {
  selected: string[];
  onSelectedChange: (codes: string[]) => void;
}

export function ProcedureCodeSelect({
  selected,
  onSelectedChange,
}: ProcedureCodeSelectProps) {
  const [open, setOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function toggleCode(code: string) {
    if (selected.includes(code)) {
      onSelectedChange(selected.filter((c) => c !== code));
    } else {
      onSelectedChange([...selected, code]);
    }
  }

  function removeCode(code: string) {
    onSelectedChange(selected.filter((c) => c !== code));
  }

  function getLabelForCode(code: string): string {
    for (const cat of DENTAL_CODE_CATEGORIES) {
      const found = cat.codes.find((c) => c.code === code);
      if (found) return found.label;
    }
    return code;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={triggerRef}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between text-left font-normal"
            >
              {selected.length > 0
                ? `${selected.length} procedure${selected.length === 1 ? "" : "s"} selected`
                : "Search procedures..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="p-0"
            style={{ width: triggerRef.current?.offsetWidth }}
            align="start"
          >
            <Command>
              <CommandInput placeholder="Search by code or name..." />
              <CommandList>
                <CommandEmpty>No procedure found.</CommandEmpty>
                {DENTAL_CODE_CATEGORIES.map((category) => (
                  <CommandGroup
                    key={category.range}
                    heading={`${category.range} — ${category.name}`}
                  >
                    {category.codes.map((dentalCode) => (
                      <CommandItem
                        key={dentalCode.code}
                        value={`${dentalCode.code} ${dentalCode.label}`}
                        onSelect={() => toggleCode(dentalCode.code)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selected.includes(dentalCode.code)
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <span className="font-mono text-xs mr-2">
                          {dentalCode.code}
                        </span>
                        <span className="truncate text-xs">
                          {dentalCode.label}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => setSheetOpen(true)}
          title="View ADA dental codes reference"
        >
          <BookOpen className="h-4 w-4" />
        </Button>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((code) => (
            <Badge
              key={code}
              variant="secondary"
              className="gap-1 pr-1"
            >
              <span className="font-mono">{code}</span>
              <span className="text-muted-foreground">-</span>
              <span className="max-w-[150px] truncate">
                {getLabelForCode(code)}
              </span>
              <button
                type="button"
                onClick={() => removeCode(code)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <DentalCodesSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
