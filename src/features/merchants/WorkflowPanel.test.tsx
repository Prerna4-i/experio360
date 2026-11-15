import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Merchant } from "@/domain/types";
import { findUser } from "@/domain/users";
import { WorkflowPanel } from "./WorkflowPanel";

const base: Merchant = {
  id: "MER-T2", tradingName: "Panel Foods", legalName: "Panel Foods Pvt Ltd", category: "Retail", city: "Pune", country: "India",
  registrationNumber: "SYN", taxId: "SYN", contactName: "A B", contactEmail: "a@b.example", contactPhone: "+91 00000 00000",
  website: "https://p.example", expectedMonthlyVolume: 1000, riskLevel: "Low", createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z", createdBy: "u-priya", submittedBy: "u-priya", status: "Under Review", documents: [], audit: [],
};

describe("WorkflowPanel maker-checker separation", () => {
  it("disables approve/reject for the checker who submitted the application", () => {
    render(<WorkflowPanel merchant={base} user={findUser("u-priya")} activeRole="checker" onAction={vi.fn()} />);
    expect(screen.getByRole("button", { name: /approve/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /reject/i })).toBeDisabled();
    expect(screen.getByRole("note")).toHaveTextContent(/can't review it/);
  });

  it("enables approve/reject for a different checker", () => {
    render(<WorkflowPanel merchant={base} user={findUser("u-meera")} activeRole="checker" onAction={vi.fn()} />);
    expect(screen.getByRole("button", { name: /approve/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /reject/i })).toBeEnabled();
  });

  it("does not let a maker approve", () => {
    render(<WorkflowPanel merchant={base} user={findUser("u-ananya")} activeRole="maker" onAction={vi.fn()} />);
    expect(screen.getByRole("button", { name: /approve/i })).toBeDisabled();
    expect(screen.getAllByText("Only a Checker can approve an application.").length).toBeGreaterThan(0);
  });
});
