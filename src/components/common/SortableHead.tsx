import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import type { SortState } from "@/domain/filters";
import { cn } from "@/lib/utils";

interface Props<K extends string> {
  label: string;
  sortKey: K;
  sort: SortState<K>;
  onSort: (key: K) => void;
  className?: string;
  align?: "left" | "right";
}

export function SortableHead<K extends string>({ label, sortKey, sort, onSort, className, align = "left" }: Props<K>) {
  const active = sort.key === sortKey;
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"} className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "-mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 text-xs font-semibold uppercase tracking-wide hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          align === "right" && "ml-auto flex-row-reverse",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        <Icon className="size-3.5" aria-hidden />
      </button>
    </TableHead>
  );
}

export function toggleSort<K extends string>(sort: SortState<K>, key: K, defaultDir: "asc" | "desc" = "asc"): SortState<K> {
  if (sort.key === key) return { key, dir: sort.dir === "asc" ? "desc" : "asc" };
  return { key, dir: defaultDir };
}
