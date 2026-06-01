import React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-white/50 bg-white/55 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-700 backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-zinc-200",
        className,
      )}
      {...props}
    />
  );
}
