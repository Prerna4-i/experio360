import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { DataPagination } from "@/components/common/DataPagination";
import { PageHeader } from "@/components/common/PageHeader";
import { SortableHead, toggleSort } from "@/components/common/SortableHead";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/common/states";
import { TXN_LABEL, TxnStatusPill } from "@/components/common/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TransactionDrawer } from "@/features/transactions/TransactionDrawer";
import { EMPTY_TXN_FILTERS, filterTransactions, paginate, sortItems, txnSortValue, validateDateRange, type SortState, type TxnFilters, type TxnSortKey } from "@/domain/filters";
import { TXN_STATUSES, type Transaction, type TxnStatus } from "@/domain/types";
import { formatCurrency, formatDateTime, toYmd } from "@/lib/format";
import { ANCHOR_DATE } from "@/mock/fixtures";
import { useTransactions } from "@/store/selectors";

export const Route = createFileRoute("/transactions")({
  head: () => ({
    meta: [
      { title: "Transactions · Experia360 Merchant Ops" },
      { name: "description", content: "Search and inspect synthetic merchant transactions with full status timelines." },
      { property: "og:title", content: "Transactions · Experia360 Merchant Ops" },
      { property: "og:description", content: "Search and inspect synthetic merchant transactions with full status timelines." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TransactionsPage,
});

function TransactionsPage() {
  const { items, status, error, retry } = useTransactions();
  const [filters, setFilters] = useState<TxnFilters>(EMPTY_TXN_FILTERS);
  const [sort, setSort] = useState<SortState<TxnSortKey>>({ key: "createdAt", dir: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selected, setSelected] = useState<Transaction | null>(null);

  const merchants = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of items) map.set(t.merchantId, t.merchantName);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [items]);

  const rangeError = validateDateRange(filters.from, filters.to);
  const filtered = useMemo(() => (rangeError ? [] : sortItems(filterTransactions(items, filters), sort, txnSortValue)), [items, filters, sort, rangeError]);
  const pg = paginate(filtered, page, pageSize);

  const update = (patch: Partial<TxnFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };
  const onSort = (k: TxnSortKey) => {
    setSort((s) => toggleSort(s, k, k === "merchantName" || k === "status" ? "asc" : "desc"));
    setPage(1);
  };
  const isFiltered = JSON.stringify(filters) !== JSON.stringify(EMPTY_TXN_FILTERS);
  const maxDate = toYmd(ANCHOR_DATE);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Monitoring" title="Transaction explorer" description="Pending and unknown outcomes are shown as-is — a provider timeout is never reported as a failure." />

      <section className="rounded-xl border bg-card shadow-card">
        <div className="grid gap-3 border-b p-4 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1.4fr)_1fr_1fr_auto_auto_auto]">
          <div className="space-y-1.5">
            <Label htmlFor="tx-search">Transaction ID</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input id="tx-search" type="search" placeholder="e.g. TXN2LK9F3" className="pl-9 font-mono" value={filters.search} onChange={(e) => update({ search: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tx-merchant">Merchant</Label>
            <Select value={filters.merchantId} onValueChange={(v) => update({ merchantId: v })}>
              <SelectTrigger id="tx-merchant">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All merchants</SelectItem>
                {merchants.map(([id, name]) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tx-status">Status</Label>
            <Select value={filters.status} onValueChange={(v) => update({ status: v as TxnStatus | "all" })}>
              <SelectTrigger id="tx-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {TXN_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {TXN_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tx-from">From</Label>
            <Input id="tx-from" type="date" max={maxDate} value={filters.from ?? ""} aria-invalid={!!rangeError} onChange={(e) => update({ from: e.target.value || undefined })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tx-to">To</Label>
            <Input id="tx-to" type="date" max={maxDate} value={filters.to ?? ""} aria-invalid={!!rangeError} onChange={(e) => update({ to: e.target.value || undefined })} />
          </div>
          <div className="flex items-end">
            <Button variant="ghost" disabled={!isFiltered} onClick={() => update(EMPTY_TXN_FILTERS)}>
              <RotateCcw /> Reset
            </Button>
          </div>
          {rangeError && (
            <p role="alert" className="text-sm text-destructive sm:col-span-2 xl:col-span-6">
              {rangeError}
            </p>
          )}
        </div>

        {status === "failed" ? (
          <div className="p-4">
            <ErrorState title="Couldn't load transactions" message={error ?? ""} onRetry={retry} />
          </div>
        ) : status !== "succeeded" ? (
          <TableSkeleton rows={10} />
        ) : pg.total === 0 ? (
          <div className="p-4">
            <EmptyState title="No transactions found" description={rangeError ? "Fix the date range to see results." : "Nothing matches these filters."} action={isFiltered ? <Button variant="outline" size="sm" onClick={() => update(EMPTY_TXN_FILTERS)}>Clear filters</Button> : undefined} />
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4 text-xs font-semibold uppercase tracking-wide">Transaction</TableHead>
                    <SortableHead label="Merchant" sortKey="merchantName" sort={sort} onSort={onSort} />
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">Reference</TableHead>
                    <SortableHead label="Amount" sortKey="amount" sort={sort} onSort={onSort} className="text-right" align="right" />
                    <SortableHead label="Date (UTC)" sortKey="createdAt" sort={sort} onSort={onSort} />
                    <SortableHead label="Status" sortKey="status" sort={sort} onSort={onSort} />
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">Provider ref</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pg.rows.map((t) => (
                    <TableRow key={t.id} className="cursor-pointer" onClick={() => setSelected(t)}>
                      <TableCell className="pl-4">
                        <button type="button" className="font-mono text-sm font-medium hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" onClick={(e) => { e.stopPropagation(); setSelected(t); }} aria-label={`View details for ${t.id}`}>
                          {t.id}
                        </button>
                      </TableCell>
                      <TableCell className="text-sm">{t.merchantName}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{t.reference}</TableCell>
                      <TableCell className="text-right text-sm font-medium tabular">{formatCurrency(t.amount)}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm tabular">{formatDateTime(t.createdAt).replace(" UTC", "")}</TableCell>
                      <TableCell>
                        <TxnStatusPill status={t.status} />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{t.providerReference ?? <span className="font-sans text-muted-foreground">Awaiting</span>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ul className="divide-y md:hidden">
              {pg.rows.map((t) => (
                <li key={t.id}>
                  <button type="button" onClick={() => setSelected(t)} className="flex w-full items-start justify-between gap-3 p-4 text-left hover:bg-muted/50">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-medium">{t.id}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {t.merchantName} · {formatDateTime(t.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-medium tabular">{formatCurrency(t.amount)}</span>
                      <TxnStatusPill status={t.status} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            <DataPagination page={pg.page} pageCount={pg.pageCount} total={pg.total} start={pg.start} shown={pg.rows.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(1); }} />
          </>
        )}
      </section>
      <TransactionDrawer txn={selected} onOpenChange={(o) => !o && setSelected(null)} />
    </div>
  );
}
