import type { ReactNode } from "react";
import type { EventTone } from "@/domain/types";
import { cn } from "@/lib/utils";

export interface TimelineItem {
  id: string;
  title: ReactNode;
  meta?: ReactNode;
  description?: ReactNode;
  tone: EventTone;
}

const DOT: Record<EventTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
  info: "bg-info",
  neutral: "bg-neutral",
};

export function Timeline({ items, label }: { items: TimelineItem[]; label: string }) {
  return (
    <ol aria-label={label} className="relative space-y-5">
      {items.map((item, i) => (
        <li key={item.id} className="relative pl-7">
          {i < items.length - 1 && <span aria-hidden className="absolute left-[5px] top-4 h-[calc(100%+0.5rem)] w-px bg-border" />}
          <span aria-hidden className={cn("absolute left-0 top-1.5 size-[11px] rounded-full ring-4 ring-card", DOT[item.tone])} />
          <div className="text-sm font-medium leading-snug">{item.title}</div>
          {item.meta && <div className="mt-0.5 text-xs text-muted-foreground tabular">{item.meta}</div>}
          {item.description && <div className="mt-1.5 text-sm text-muted-foreground">{item.description}</div>}
        </li>
      ))}
    </ol>
  );
}
