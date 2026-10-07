"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export const Accordion = AccordionPrimitive.Root;

export function AccordionItem({ value, question, children }: { value: string; question: string; children: React.ReactNode }) {
  return (
    <AccordionPrimitive.Item value={value} className="border-b border-ink/10">
      <AccordionPrimitive.Header>
        <AccordionPrimitive.Trigger className="group flex w-full items-center justify-between gap-6 py-5 text-left font-display text-lg font-medium text-ink sm:text-xl">
          {question}
          <Plus className="h-5 w-5 shrink-0 text-blueInk transition-transform duration-200 group-data-[state=open]:rotate-45" aria-hidden />
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
      <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        <div className={cn("max-w-2xl pb-6 text-[1.0625rem] leading-relaxed text-muted-foreground")}>{children}</div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  );
}
