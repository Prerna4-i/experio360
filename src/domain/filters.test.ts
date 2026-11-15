import { describe, expect, it } from "vitest";
import { buildMerchants, buildTransactions, ANCHOR_DATE } from "@/mock/fixtures";
import { computeKpis, filterMerchants, filterTransactions, paginate, resolveRange, sortItems, txnSortValue, validateDateRange, EMPTY_TXN_FILTERS } from "./filters";

const merchants = buildMerchants();
const txns = buildTransactions(merchants);

describe("transaction filters", () => {
  it("filters by status, merchant and inclusive UTC date range together", () => {
    const m = txns[0]!.merchantId;
    const out = filterTransactions(txns, { search: "", merchantId: m, status: "Success", from: "2026-10-01", to: "2026-10-31" });
    expect(out.length).toBeGreaterThan(0);
    for (const t of out) {
      expect(t.merchantId).toBe(m);
      expect(t.status).toBe("Success");
      expect(t.createdAt.slice(0, 10) >= "2026-10-01" && t.createdAt.slice(0, 10) <= "2026-10-31").toBe(true);
    }
  });

  it("searches by transaction ID, case-insensitively", () => {
    const id = txns[5]!.id;
    expect(filterTransactions(txns, { ...EMPTY_TXN_FILTERS, search: id.toLowerCase() }).map((t) => t.id)).toEqual([id]);
  });

  it("flags a start date after the end date", () => {
    expect(validateDateRange("2026-11-10", "2026-11-01")).not.toBeNull();
    expect(validateDateRange("2026-11-01", "2026-11-10")).toBeNull();
  });

  it("never labels unknown outcomes as failed in the fixtures", () => {
    const unknown = txns.filter((t) => t.status === "Unknown");
    expect(unknown.length).toBeGreaterThan(0);
    expect(unknown.every((t) => !t.timeline.some((e) => e.tone === "danger"))).toBe(true);
  });

  it("sorts by amount and paginates with clamped pages", () => {
    const sorted = sortItems(txns, { key: "amount", dir: "desc" }, txnSortValue);
    expect(sorted[0]!.amount).toBeGreaterThanOrEqual(sorted[1]!.amount);
    const pg = paginate(sorted, 999, 20);
    expect(pg.page).toBe(pg.pageCount);
    expect(pg.rows.length).toBeLessThanOrEqual(20);
  });
});

describe("dashboard", () => {
  it("a 7-day range covers the anchor day and the six days before", () => {
    expect(resolveRange("7d", ANCHOR_DATE)).toEqual({ from: "2026-11-09", to: "2026-11-15" });
  });

  it("counts pending including unknown outcomes and merchants awaiting KYC", () => {
    const k = computeKpis(txns, merchants);
    expect(k.total).toBe(txns.length);
    expect(k.pending).toBe(txns.filter((t) => t.status === "Pending" || t.status === "Unknown").length);
    expect(k.awaitingKyc).toBe(merchants.filter((m) => m.status === "Submitted" || m.status === "Under Review").length);
  });
});

describe("merchant filters", () => {
  it("filters by status and search text", () => {
    const out = filterMerchants(merchants, { search: "", status: "Rejected" });
    expect(out.every((m) => m.status === "Rejected")).toBe(true);
    const name = merchants[3]!.tradingName;
    expect(filterMerchants(merchants, { search: name.toUpperCase(), status: "all" })[0]?.tradingName).toBe(name);
  });
});
