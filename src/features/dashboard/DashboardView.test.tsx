import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardView } from "./DashboardView";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, className }: { children: React.ReactNode; className?: string }) => <a className={className}>{children}</a>,
}));

describe("DashboardView", () => {
  it("shows an empty state and zero KPIs when no transactions match", () => {
    render(<DashboardView status="succeeded" transactions={[]} merchants={[]} range={{ from: "2026-11-01", to: "2026-11-15" }} />);
    expect(screen.getByText("No transactions match these filters")).toBeInTheDocument();
    expect(screen.getByText("Total transactions").parentElement?.parentElement).toHaveTextContent("0");
    expect(screen.getByText("Queue is clear")).toBeInTheDocument();
  });

  it("shows an error state with retry", () => {
    const retry = vi.fn();
    render(<DashboardView status="failed" error="Mock API down" onRetry={retry} transactions={[]} merchants={[]} range={{}} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Mock API down");
    screen.getByRole("button", { name: /try again/i }).click();
    expect(retry).toHaveBeenCalled();
  });
});
