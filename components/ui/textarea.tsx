import React from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "nexus-input w-full px-3 py-2 text-xs outline-none transition",
        className,
      )}
      {...props}
    />
  );
}
