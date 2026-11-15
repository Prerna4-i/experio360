import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DashboardFilters } from "@/features/dashboard/DashboardFilters";
import { DashboardView } from "@/features/dashboard/DashboardView";
import { filterTransactions, resolveRange, validateDateRange } from "@/domain/filters";
import { formatDate, toYmd } from "@/lib/format";
import { ANCHOR_DATE } from "@/mock/fixtures";
import { resetDashboard, setCustomRange, setDashboardStatus, setPreset } from "@/store/dashboardSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useMerchants, useTransactions } from "@/store/selectors";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview · Experia360 Merchant Ops" },
      { name: "description", content: "KPIs and transaction status trends for merchant operations (synthetic demo data)." },
      { property: "og:title", content: "Overview · Experia360 Merchant Ops" },
      { property: "og:description", content: "KPIs and transaction status trends for merchant operations (synthetic demo data)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((s) => s.dashboard);
  const tx = useTransactions();
  const merchants = useMerchants();

  const range = resolveRange(filters.preset, ANCHOR_DATE, { from: filters.customFrom, to: filters.customTo });
  const invalid = validateDateRange(range.from, range.to);
  const filtered = useMemo(
    () => (invalid ? [] : filterTransactions(tx.items, { search: "", merchantId: "all", status: filters.status, from: range.from, to: range.to })),
    [tx.items, filters.status, range.from, range.to, invalid],
  );

  const status = tx.status === "failed" || merchants.status === "failed" ? "failed" : tx.status === "succeeded" && merchants.status === "succeeded" ? "succeeded" : "loading";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Data as of ${formatDate(ANCHOR_DATE.toISOString())}`}
        title="Operations overview"
        description="Transaction health and onboarding workload across all merchants."
      />
      <DashboardFilters
        {...filters}
        maxDate={toYmd(ANCHOR_DATE)}
        onPreset={(p) => {
          if (p === "custom" && !filters.customFrom) dispatch(setCustomRange(resolveRange("30d", ANCHOR_DATE)));
          dispatch(setPreset(p));
        }}
        onCustom={(r) => dispatch(setCustomRange(r))}
        onStatus={(s) => dispatch(setDashboardStatus(s))}
        onReset={() => dispatch(resetDashboard())}
      />
      <DashboardView
        status={status}
        error={tx.error ?? merchants.error}
        onRetry={() => {
          if (tx.status === "failed") tx.retry();
          if (merchants.status === "failed") merchants.retry();
        }}
        transactions={filtered}
        merchants={merchants.items}
        range={range}
      />
    </div>
  );
}
