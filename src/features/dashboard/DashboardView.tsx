import { Link } from "@tanstack/react-router";
import { Activity, CheckCircle2, Clock3, FileSearch } from "lucide-react";
import { Panel } from "@/components/common/Panel";
import { EmptyState, ErrorState } from "@/components/common/states";
import { MerchantStatusPill, TxnStatusPill } from "@/components/common/StatusPill";
import { Skeleton } from "@/components/ui/skeleton";
import { AWAITING_KYC, buildDailySeries, computeKpis } from "@/domain/filters";
import type { Merchant, Transaction } from "@/domain/types";
import { formatCurrency, formatCurrencyCompact, formatDate, formatNumber } from "@/lib/format";
import type { LoadStatus } from "@/store/merchantsSlice";
import { KpiCard } from "./KpiCard";
import { StatusChart } from "./StatusChart";

interface Props {
  status: LoadStatus;
  error?: string | undefined | null;
  onRetry?: (() => void) | undefined;
  /** Transactions already filtered by the dashboard date range + status. */
  transactions: Transaction[];
  merchants: Merchant[];
  range: { from?: string | undefined; to?: string | undefined };
}

export function DashboardView({ status, error, onRetry, transactions, merchants, range }: Props) {
  if (status === "failed") return <ErrorState title="Dashboard data unavailable" message={error ?? "Could not load data."} onRetry={onRetry} />;
  if (status !== "succeeded") {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[132px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[380px] rounded-xl" />
      </div>
    );
  }

  const k = computeKpis(transactions, merchants);
  const from = range.from ?? transactions.at(-1)?.createdAt.slice(0, 10);
  const to = range.to ?? transactions[0]?.createdAt.slice(0, 10);
  const series = from && to ? buildDailySeries(transactions, from, to) : [];
  const queue = merchants.filter((m) => AWAITING_KYC.includes(m.status)).sort((a, b) => a.updatedAt.localeCompare(b.updatedAt)).slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total transactions" value={formatNumber(k.total)} icon={Activity} accent="primary" hint="In selected range & status" />
        <KpiCard label="Successful" value={formatNumber(k.success)} icon={CheckCircle2} accent="success" hint={`${(k.successRate * 100).toFixed(1)}% success · ${formatCurrencyCompact(k.successVolume)} captured`} />
        <KpiCard label="Pending" value={formatNumber(k.pending)} icon={Clock3} accent="warning" hint={`${k.pendingProcessing} processing · ${k.pendingUnknown} awaiting provider confirmation`} />
        <KpiCard label="Merchants awaiting KYC review" value={formatNumber(k.awaitingKyc)} icon={FileSearch} accent="info" hint="Submitted or under review (all time)" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Transaction status trend" description="Daily count, stacked by status (UTC)">
          {transactions.length === 0 ? (
            <EmptyState title="No transactions match these filters" description="Try widening the date range or choosing a different status." />
          ) : (
            <StatusChart data={series} />
          )}
        </Panel>
        <Panel title="KYC review queue" description="Oldest first" bodyClassName="p-0">
          {queue.length === 0 ? (
            <div className="p-5">
              <EmptyState title="Queue is clear" description="No applications are waiting for review." />
            </div>
          ) : (
            <ul className="divide-y">
              {queue.map((m) => (
                <li key={m.id}>
                  <Link to="/merchants/$merchantId" params={{ merchantId: m.id }} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{m.tradingName}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-mono">{m.id}</span> · since {formatDate(m.updatedAt)}
                      </p>
                    </div>
                    <MerchantStatusPill status={m.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Latest transactions" bodyClassName="p-0" actions={<Link to="/transactions" className="text-sm font-medium text-primary hover:underline">Open explorer →</Link>}>
        {transactions.length === 0 ? (
          <div className="p-5">
            <EmptyState title="Nothing to show yet" description="No transactions in this range." />
          </div>
        ) : (
          <ul className="divide-y">
            {transactions.slice(0, 5).map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm">{t.id}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.merchantName} · {formatDate(t.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium tabular">{formatCurrency(t.amount)}</span>
                  <TxnStatusPill status={t.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
