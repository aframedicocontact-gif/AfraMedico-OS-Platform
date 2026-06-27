import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

export function KanbanBoard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "overflow-x-auto overflow-y-hidden pb-4 [scrollbar-color:theme(colors.emerald.700)_theme(colors.emerald.50)] [scrollbar-width:thin]",
        className,
      )}
      {...props}
    />
  );
}

export function KanbanColumns({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex min-w-max items-start gap-4 pr-4", className)}
      {...props}
    />
  );
}

export function KanbanColumn({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("w-[280px] shrink-0 sm:w-[300px]", className)}>{children}</div>;
}
