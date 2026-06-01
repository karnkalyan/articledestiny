import React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "ghost" | "destructive" | "outline";
};

export function Button({ className, variant = "default", ...props }: ButtonProps) {
  const variants = {
    default: "nexus-btn-primary border-transparent",
    secondary: "border-white/50 bg-white/65 text-slate-900 shadow-lg shadow-slate-200/40 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15",
    ghost: "border-transparent bg-transparent text-slate-700 hover:bg-white/60 dark:text-zinc-200 dark:hover:bg-white/10",
    destructive: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300",
    outline: "border-slate-200/80 bg-white/30 text-slate-800 hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-white/10",
  };

  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
