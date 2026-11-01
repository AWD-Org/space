"use client";

import * as React from "react";
import * as Menu from "@radix-ui/react-dropdown-menu";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const DropdownMenu = Menu.Root;
export const DropdownMenuTrigger = Menu.Trigger;

export function DropdownMenuContent({ className, children, ...props }: React.ComponentProps<typeof Menu.Content>) {
  return (
    <Menu.Portal>
      <Menu.Content
        align="end"
        sideOffset={6}
        collisionPadding={12}
        className={cn(
          "motion-menu z-50 min-w-[14rem] overflow-hidden rounded-2xl bg-white p-1.5 text-ink shadow-xl ring-1 ring-ink/10",
          className
        )}
        {...props}
      >
        {children}
      </Menu.Content>
    </Menu.Portal>
  );
}

export function DropdownMenuItem({ className, danger, ...props }: React.ComponentProps<typeof Menu.Item> & { danger?: boolean }) {
  return (
    <Menu.Item
      className={cn(
        "flex h-11 cursor-pointer select-none items-center gap-3 rounded-xl px-3 text-[0.95rem] outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-cloud [&_svg]:h-[1.1rem] [&_svg]:w-[1.1rem] [&_svg]:shrink-0 [&_svg]:text-slate",
        danger && "text-[#B42318] data-[highlighted]:bg-[#FDECEA] [&_svg]:text-[#B42318]",
        className
      )}
      {...props}
    />
  );
}

export const DropdownMenuSeparator = ({ className }: { className?: string }) => <Menu.Separator className={cn("my-1 h-px bg-ink/10", className)} />;

export const DropdownMenuSub = Menu.Sub;

export function DropdownMenuSubTrigger({ className, children, ...props }: React.ComponentProps<typeof Menu.SubTrigger>) {
  return (
    <Menu.SubTrigger
      className={cn(
        "flex h-11 cursor-pointer select-none items-center gap-3 rounded-xl px-3 text-[0.95rem] outline-none transition-colors data-[highlighted]:bg-cloud data-[state=open]:bg-cloud [&_svg]:h-[1.1rem] [&_svg]:w-[1.1rem] [&_svg]:shrink-0 [&_svg]:text-slate",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto" aria-hidden />
    </Menu.SubTrigger>
  );
}

export function DropdownMenuSubContent({ className, children, ...props }: React.ComponentProps<typeof Menu.SubContent>) {
  return (
    <Menu.Portal>
      <Menu.SubContent
        sideOffset={8}
        collisionPadding={12}
        className={cn("motion-menu z-50 max-h-[60dvh] min-w-[12rem] overflow-y-auto rounded-2xl bg-white p-1.5 text-ink shadow-xl ring-1 ring-ink/10", className)}
        {...props}
      >
        {children}
      </Menu.SubContent>
    </Menu.Portal>
  );
}
