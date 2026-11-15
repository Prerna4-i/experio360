import { beforeEach, describe, expect, it } from "vitest";
import { MockApiError, mockApi, resetMockDb } from "./api";

describe("mock API enforces the workflow", () => {
  beforeEach(() => resetMockDb());

  it("rejects an invalid transition even if the UI is bypassed", async () => {
    const merchants = await mockApi.listMerchants("instant");
    const draft = merchants.find((m) => m.status === "Draft")!;
    await expect(
      mockApi.transitionMerchant("instant", { merchantId: draft.id, action: "approve", actorId: "u-meera", role: "checker" }),
    ).rejects.toBeInstanceOf(MockApiError);
    const after = (await mockApi.listMerchants("instant")).find((m) => m.id === draft.id)!;
    expect(after.status).toBe("Draft");
  });

  it("blocks the submitting user from approving their own application", async () => {
    const created = await mockApi.createMerchant(
      "instant",
      { tradingName: "Self Check", legalName: "Self Check Pvt Ltd", category: "Retail", city: "Pune", contactName: "A B", contactEmail: "a@b.example", contactPhone: "+91 00000 11111", website: "https://s.example", expectedMonthlyVolume: 1000 },
      "u-priya",
      "maker",
    );
    await mockApi.transitionMerchant("instant", { merchantId: created.id, action: "submit", actorId: "u-priya", role: "maker" });
    await expect(
      mockApi.transitionMerchant("instant", { merchantId: created.id, action: "startReview", actorId: "u-priya", role: "checker" }),
    ).rejects.toThrow(/self-approval/);
    const reviewed = await mockApi.transitionMerchant("instant", { merchantId: created.id, action: "startReview", actorId: "u-meera", role: "checker" });
    expect(reviewed.status).toBe("Under Review");
    expect(reviewed.audit.map((a) => a.action)).toEqual(["create", "submit", "startReview"]);
  });

  it("only lets makers create applications", async () => {
    await expect(
      mockApi.createMerchant("instant", { tradingName: "X", legalName: "X", category: "Retail", city: "P", contactName: "A", contactEmail: "a@b.example", contactPhone: "1", website: "https://x.example", expectedMonthlyVolume: 1 }, "u-meera", "checker"),
    ).rejects.toThrow(/Only a Maker/);
  });

  it("surfaces a simulated network failure as an error", async () => {
    await expect(mockApi.listTransactions("offline")).rejects.toThrow(/unreachable/);
  });
});
