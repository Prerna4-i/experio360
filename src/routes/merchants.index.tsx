import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { DataPagination } from "@/components/common/DataPagination";
import { PageHeader } from "@/components/common/PageHeader";
import { SortableHead, toggleSort } from "@/components/common/SortableHead";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/common/states";
import { MerchantStatusPill } from "@/components/common/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NewMerchantDialog } from "@/features/merchants/NewMerchantDialog";
import { filterMerchants, merchantSortValue, paginate, sortItems, type MerchantSortKey, type SortState } from "@/domain/filters";
import { MERCHANT_STATUSES, type MerchantStatus } from "@/domain/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMerchants, useSession } from "@/store/selectors";

export const Route = createFileRoute("/merchants/")({
  head: () => ({
    meta: [
      { title: "Merchants · Experia360 Merchant Ops" },
      { name: "description", content: "Search, filter and review merchant onboarding applications (synthetic demo data)." },
      { property: "og:title", content: "Merchants · Experia360 Merchant Ops" },
      { property: "og:description", content: "Search, filter and review merchant onboarding applications (synthetic demo data)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MerchantsPage,
});

const PAGE_SIZE = 10;

function MerchantsPage() {
  const { items, status, error, retry } = useMerchants();
  const { activeRole } = useSession();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<MerchantStatus | "all">("all");
  const [sort, setSort] = useState<SortState<MerchantSortKey>>({ key: "updatedAt", dir: "desc" });
  const [page, setPage] = useState(1);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    for (const m of items) c[m.status] = (c[m.status] ?? 0) + 1;
    return c;
  }, [items]);

  const filtered = useMemo(() => sortItems(filterMerchants(items, { search, status: statusFilter }), sort, merchantSortValue), [items, search, statusFilter, sort]);
  const pg = paginate(filtered, page, PAGE_SIZE);
  const onSort = (k: MerchantSortKey) => {
    setSort((s) => toggleSort(s, k, k === "tradingName" || k === "city" ? "asc" : "desc"));
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Onboarding"
        title="Merchants"
        description="Applications move Draft → Submitted → Under Review → Approved or Rejected. Makers prepare, checkers decide."
        actions={
          <div className="flex flex-col items-end gap-1">
            <NewMerchantDialog disabled={activeRole !== "maker"} />
            {activeRole !== "maker" && <p className="text-xs text-muted-foreground">Switch to a Maker role to create applications.</p>}
          </div>
        }
      />

      <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
        {(["all", ...MERCHANT_STATUSES] as const).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={statusFilter === s}
            onClick={() => {
              setStatusFilter(s);
              setPage(1);
            }}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              statusFilter === s ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
            )}
          >
            {s === "all" ? "All" : s}
            <span className={cn("rounded-full px-1.5 text-xs tabular", statusFilter === s ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground")}>{counts[s] ?? 0}</span>
          </button>
        ))}
      </div>

      <section className="rounded-xl border bg-card shadow-card">
        <div className="border-b p-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              aria-label="Search merchants"
              placeholder="Search name, ID, city or contact…"
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {status === "failed" ? (
          <div className="p-4">
            <ErrorState title="Couldn't load merchants" message={error ?? ""} onRetry={retry} />
          </div>
        ) : status !== "succeeded" ? (
          <TableSkeleton />
        ) : pg.total === 0 ? (
          <div className="p-4">
            <EmptyState
              title="No merchants match"
              description="Try a different search term or status."
              action={
                <Button variant="outline" size="sm" onClick={() => { setSearch(""); setStatusFilter("all"); }}>
                  Clear filters
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHead label="Merchant" sortKey="tradingName" sort={sort} onSort={onSort} className="pl-4" />
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">Category</TableHead>
                    <SortableHead label="City" sortKey="city" sort={sort} onSort={onSort} />
                    <SortableHead label="Status" sortKey="status" sort={sort} onSort={onSort} />
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">KYC docs</TableHead>
                    <SortableHead label="Created" sortKey="createdAt" sort={sort} onSort={onSort} />
                    <SortableHead label="Updated" sortKey="updatedAt" sort={sort} onSort={onSort} />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pg.rows.map((m) => {
                    const v = m.documents.filter((d) => d.status === "Verified").length;
                    return (
                      <TableRow key={m.id} className="cursor-pointer" onClick={() => navigate({ to: "/merchants/$merchantId", params: { merchantId: m.id } })}>
                        <TableCell className="pl-4">
                          <Link to="/merchants/$merchantId" params={{ merchantId: m.id }} className="font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
                            {m.tradingName}
                          </Link>
                          <p className="font-mono text-xs text-muted-foreground">{m.id}</p>
                        </TableCell>
                        <TableCell className="text-sm">{m.category}</TableCell>
                        <TableCell className="text-sm">{m.city}</TableCell>
                        <TableCell>
                          <MerchantStatusPill status={m.status} />
                        </TableCell>
                        <TableCell className="text-sm tabular">
                          {v}/{m.documents.length} verified
                        </TableCell>
                        <TableCell className="text-sm tabular">{formatDate(m.createdAt)}</TableCell>
                        <TableCell className="text-sm tabular">{formatDate(m.updatedAt)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <ul className="divide-y md:hidden">
              {pg.rows.map((m) => (
                <li key={m.id}>
                  <Link to="/merchants/$merchantId" params={{ merchantId: m.id }} className="flex items-start justify-between gap-3 p-4 hover:bg-muted/50">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{m.tradingName}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-mono">{m.id}</span> · {m.city} · {formatDate(m.updatedAt)}
                      </p>
                    </div>
                    <MerchantStatusPill status={m.status} />
                  </Link>
                </li>
              ))}
            </ul>
            <DataPagination page={pg.page} pageCount={pg.pageCount} total={pg.total} start={pg.start} shown={pg.rows.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </>
        )}
      </section>
    </div>
  );
}
