import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "muted" | "success" | "warning" | "danger" | "info" | "gold";
};

const tones = {
  default: "bg-primary text-primary-foreground",
  muted: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  success: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  warning: "bg-amber-100 text-amber-900 ring-1 ring-amber-200",
  danger: "bg-rose-100 text-rose-800 ring-1 ring-rose-200",
  info: "bg-sky-100 text-sky-800 ring-1 ring-sky-200",
  gold: "bg-yellow-100 text-yellow-900 ring-1 ring-yellow-200",
};

export function Badge({ className, tone = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded px-2 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
