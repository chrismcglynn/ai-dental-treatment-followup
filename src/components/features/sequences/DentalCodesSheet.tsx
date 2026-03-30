"use client";

import { DENTAL_CODE_CATEGORIES } from "@/lib/dental-codes";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DentalCodesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DentalCodesSheet({ open, onOpenChange }: DentalCodesSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>ADA CDT Dental Codes</SheetTitle>
          <SheetDescription>
            Current Dental Terminology (CDT-2024/CDT-2025)
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] mt-4 pr-4">
          <div className="space-y-6">
            {DENTAL_CODE_CATEGORIES.map((category) => (
              <div key={category.range}>
                <h3 className="text-sm font-semibold text-foreground sticky top-0 bg-background py-1.5 border-b mb-2">
                  {category.range} — {category.name}
                </h3>
                <div className="space-y-0.5">
                  {category.codes.map((code) => (
                    <div
                      key={code.code}
                      className="flex gap-3 py-1 text-xs"
                    >
                      <span className="font-mono font-medium text-muted-foreground w-14 shrink-0">
                        {code.code}
                      </span>
                      <span className="text-foreground">{code.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
