import { describe, expect, it } from "vitest";
import type { Merchant } from "./types";
import { findUser } from "./users";
import { applyTransition, canPerform } from "./workflow";

const ananya = findUser("u-ananya")!; // maker
const meera = findUser("u-meera")!; // checker
const priya = findUser("u-priya")!; // maker + checker

function merchant(over: Partial<Merchant> = {}): Merchant {
  return {
    id: "MER-T1", tradingName: "Test Traders", legalName: "Test Traders Pvt Ltd", category: "Retail", city: "Pune", country: "India",
    registrationNumber: "SYN", taxId: "SYN", contactName: "A B", contactEmail: "a@b.example", contactPhone: "+91 00000 00000",
    website: "https://t.example", expectedMonthlyVolume: 1000, riskLevel: "Low", createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z", createdBy: ananya.id, status: "Draft", documents: [], audit: [], ...over,
  };
}
const opts = { now: "2026-11-15T12:00:00Z", entryId: "E1" };

describe("merchant workflow transitions", () => {
  it("lets a maker submit a draft and records who submitted it", () => {
    const r = applyTransition(merchant(), "submit", ananya, "maker", opts);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.merchant.status).toBe("Submitted");
      expect(r.merchant.submittedBy).toBe(ananya.id);
      expect(r.merchant.audit).toHaveLength(1);
    }
  });

  it("blocks approving a Draft (must go through Submitted and Under Review)", () => {
    const r = applyTransition(merchant({ createdBy: "u-kabir" }), "approve", meera, "checker", opts);
    expect(r).toEqual({ ok: false, error: "Cannot approve an application that is Draft." });
  });

  it("blocks approving an already Approved or Rejected application", () => {
    expect(canPerform(merchant({ status: "Approved" }), "approve", meera, "checker").allowed).toBe(false);
    expect(canPerform(merchant({ status: "Rejected" }), "approve", meera, "checker").allowed).toBe(false);
  });

  it("does not let a maker approve", () => {
    const check = canPerform(merchant({ status: "Under Review" }), "approve", ananya, "maker");
    expect(check).toEqual({ allowed: false, reason: "Only a Checker can approve an application." });
  });

  it("does not let a checker submit", () => {
    expect(canPerform(merchant(), "submit", meera, "checker").allowed).toBe(false);
  });

  it("prevents self-approval for a user holding both roles", () => {
    const m = merchant({ status: "Under Review", createdBy: priya.id, submittedBy: priya.id });
    const check = canPerform(m, "approve", priya, "checker");
    expect(check.allowed).toBe(false);
    expect(canPerform(m, "reject", priya, "checker").allowed).toBe(false);
    expect(canPerform(m, "approve", meera, "checker").allowed).toBe(true);
  });

  it("rejects without a reason of at least 10 characters", () => {
    const m = merchant({ status: "Under Review" });
    expect(applyTransition(m, "reject", meera, "checker", { ...opts, reason: "bad" }).ok).toBe(false);
    const ok = applyTransition(m, "reject", meera, "checker", { ...opts, reason: "GST name mismatch" });
    expect(ok.ok && ok.merchant.status).toBe("Rejected");
    expect(ok.ok && ok.merchant.audit[0]?.reason).toBe("GST name mismatch");
  });

  it("refuses a role the user does not hold", () => {
    expect(canPerform(merchant({ status: "Under Review" }), "approve", ananya, "checker").allowed).toBe(false);
  });
});
