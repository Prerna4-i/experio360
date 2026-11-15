import type { Merchant, MerchantStatus, Transaction, TxnStatus } from "./types";

export type SortDir = "asc" | "desc";
export interface SortState<K extends string> {
  key: K;
  dir: SortDir;
}

export function sortItems<T, K extends string>(items: T[], sort: SortState<K>, get: (item: T, key: K) => string | number): T[] {
  const factor = sort.dir === "asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    const va = get(a, sort.key);
    const vb = get(b, sort.key);
    if (typeof va === "number" && typeof vb === "number") return (va - vb) * factor;
    return String(va).localeCompare(String(vb)) * factor;
  });
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  const start = (current - 1) * pageSize;
  return { rows: items.slice(start, start + pageSize), page: current, pageCount, total: items.length, start };
}

/* ---------- Transactions ---------- */

export interface TxnFilters {
  search: string;
  merchantId: string; // "all" or merchant id
  status: TxnStatus | "all";
  from?: string; // yyyy-mm-dd (UTC, inclusive)
  to?: string; // yyyy-mm-dd (UTC, inclusive)
}

export const EMPTY_TXN_FILTERS: TxnFilters = { search: "", merchantId: "all", status: "all" };

export function filterTransactions(txns: Transaction[], f: TxnFilters): Transaction[] {
  const q = f.search.trim().toLowerCase();
  return txns.filter((t) => {
    if (q && !t.id.toLowerCase().includes(q)) return false;
    if (f.merchantId !== "all" && t.merchantId !== f.merchantId) return false;
    if (f.status !== "all" && t.status !== f.status) return false;
    const day = t.createdAt.slice(0, 10);
    if (f.from && day < f.from) return false;
    if (f.to && day > f.to) return false;
    return true;
  });
}

export type TxnSortKey = "createdAt" | "amount" | "merchantName" | "status";
export const txnSortValue = (t: Transaction, k: TxnSortKey) => (k === "amount" ? t.amount : t[k]);

export function validateDateRange(from?: string, to?: string): string | null {
  if (from && to && from > to) return "Start date must be on or before the end date.";
  return null;
}

/* ---------- Merchants ---------- */

export interface MerchantFilters {
  search: string;
  status: MerchantStatus | "all";
}

export function filterMerchants(list: Merchant[], f: MerchantFilters): Merchant[] {
  const q = f.search.trim().toLowerCase();
  return list.filter((m) => {
    if (f.status !== "all" && m.status !== f.status) return false;
    if (!q) return true;
    return [m.tradingName, m.legalName, m.id, m.city, m.contactName].some((v) => v.toLowerCase().includes(q));
  });
}

export type MerchantSortKey = "tradingName" | "status" | "createdAt" | "updatedAt" | "city";
const STATUS_RANK: Record<MerchantStatus, number> = { Draft: 0, Submitted: 1, "Under Review": 2, Approved: 3, Rejected: 4 };
export const merchantSortValue = (m: Merchant, k: MerchantSortKey) => (k === "status" ? STATUS_RANK[m.status] : m[k]);

/* ---------- Dashboard ---------- */

export type RangePreset = "7d" | "30d" | "90d" | "custom";

export function resolveRange(preset: RangePreset, anchor: Date, custom: { from?: string; to?: string } = {}) {
  if (preset === "custom") return { from: custom.from, to: custom.to };
  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  const to = anchor.toISOString().slice(0, 10);
  const from = new Date(anchor.getTime() - (days - 1) * 86_400_000).toISOString().slice(0, 10);
  return { from, to };
}

export const AWAITING_KYC: MerchantStatus[] = ["Submitted", "Under Review"];

export function computeKpis(txns: Transaction[], merchants: Merchant[]) {
  let success = 0;
  let pending = 0;
  let unknown = 0;
  let volume = 0;
  for (const t of txns) {
    if (t.status === "Success") {
      success++;
      volume += t.amount;
    } else if (t.status === "Pending") pending++;
    else if (t.status === "Unknown") unknown++;
  }
  return {
    total: txns.length,
    success,
    successRate: txns.length ? success / txns.length : 0,
    successVolume: volume,
    pending: pending + unknown,
    pendingProcessing: pending,
    pendingUnknown: unknown,
    awaitingKyc: merchants.filter((m) => AWAITING_KYC.includes(m.status)).length,
  };
}

export type DailyPoint = { date: string } & Record<TxnStatus, number>;

export function buildDailySeries(txns: Transaction[], from: string, to: string): DailyPoint[] {
  const points = new Map<string, DailyPoint>();
  for (let d = new Date(`${from}T00:00:00Z`); d.toISOString().slice(0, 10) <= to; d = new Date(d.getTime() + 86_400_000)) {
    const key = d.toISOString().slice(0, 10);
    points.set(key, { date: key, Success: 0, Pending: 0, Unknown: 0, Failed: 0, Reversed: 0 });
    if (points.size > 400) break;
  }
  for (const t of txns) {
    const p = points.get(t.createdAt.slice(0, 10));
    if (p) p[t.status]++;
  }
  return [...points.values()];
}
