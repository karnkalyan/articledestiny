import React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "nexus-input h-10 w-full px-3 text-xs outline-none transition",
        className,
      )}
      {...props}
    />
  );
}
