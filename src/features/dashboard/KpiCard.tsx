import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function KpiCard({ label, value, hint, icon: Icon, accent }: { label: string; value: ReactNode; hint?: ReactNode; icon: LucideIcon; accent: "primary" | "success" | "warning" | "info" }) {
  const ring = {
    primary: "bg-accent text-accent-foreground",
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning-ink",
    info: "bg-info/10 text-info",
  }[accent];
  return (
    <article className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-sans text-sm font-medium tracking-normal text-muted-foreground">{label}</h3>
        <span className={cn("grid size-9 place-items-center rounded-lg", ring)}>
          <Icon className="size-[18px]" aria-hidden />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold tabular">{value}</p>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </article>
  );
}
