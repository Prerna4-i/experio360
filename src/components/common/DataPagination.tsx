import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatNumber } from "@/lib/format";

interface Props {
  page: number;
  pageCount: number;
  total: number;
  start: number;
  pageSize: number;
  shown: number;
  onPageChange: (p: number) => void;
  onPageSizeChange?: ((n: number) => void) | undefined;
  pageSizes?: number[] | undefined;
}

export function DataPagination({ page, pageCount, total, start, pageSize, shown, onPageChange, onPageSizeChange, pageSizes = [10, 20, 50] }: Props) {
  return (
    <nav aria-label="Pagination" className="flex flex-col gap-3 border-t px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground tabular" aria-live="polite">
        {total === 0 ? "No results" : `Showing ${formatNumber(start + 1)}–${formatNumber(start + shown)} of ${formatNumber(total)}`}
      </p>
      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
            <SelectTrigger className="h-8 w-[112px]" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizes.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
          <ChevronLeft />
        </Button>
        <span className="min-w-[88px] text-center tabular">
          Page {page} of {pageCount}
        </span>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount} aria-label="Next page">
          <ChevronRight />
        </Button>
      </div>
    </nav>
  );
}
