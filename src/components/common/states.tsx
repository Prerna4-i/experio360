import { AlertTriangle, Inbox, RotateCw } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function EmptyState({ title, description, action, icon }: { title: string; description?: string | undefined; action?: ReactNode | undefined; icon?: ReactNode | undefined }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/40 px-6 py-12 text-center">
      <div className="mb-1 grid size-10 place-items-center rounded-full bg-secondary text-muted-foreground">{icon ?? <Inbox className="size-5" />}</div>
      <p className="font-display text-base font-semibold">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", message, onRetry }: { title?: string | undefined; message: string; onRetry?: (() => void) | undefined }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
      <div className="mb-1 grid size-10 place-items-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" />
      </div>
      <p className="font-display text-base font-semibold">{title}</p>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
          <RotateCw /> Try again
        </Button>
      )}
    </div>
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number | undefined }) {
  return (
    <div className="space-y-2 p-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}
