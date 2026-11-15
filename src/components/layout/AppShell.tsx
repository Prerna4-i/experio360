import { Link } from "@tanstack/react-router";
import { ArrowLeftRight, LayoutDashboard, Menu, ShieldAlert, Store } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { RoleSwitcher } from "./RoleSwitcher";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/merchants", label: "Merchants", icon: Store, exact: false },
  { to: "/transactions", label: "Transactions", icon: ArrowLeftRight, exact: false },
] as const;

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <div className="grid size-8 place-items-center rounded-md bg-sidebar-primary font-display text-sm font-bold text-sidebar-primary-foreground">E</div>
      <div className="leading-tight">
        <p className="font-display text-[15px] font-semibold text-sidebar-foreground">Experia360</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-sidebar-muted">Merchant Ops</p>
      </div>
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  return (
    <nav aria-label="Primary" className="space-y-1">
      {NAV.map(({ to, label, icon: Icon, exact }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact }}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground"
        >
          <Icon className="size-4" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  return (
    <div className="flex h-full flex-col gap-8 bg-sidebar px-3 py-5">
      <Brand />
      <NavLinks onNavigate={onNavigate} />
      <div className="mt-auto rounded-lg border border-sidebar-border p-3 text-xs text-sidebar-muted">
        <p className="mb-1 flex items-center gap-1.5 font-medium text-sidebar-foreground">
          <ShieldAlert className="size-3.5" /> Demo environment
        </p>
        Synthetic data only. Role switching is a UI mock, not real authentication.
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen lg:pl-64">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-card focus:px-3 focus:py-2">
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">
        <SidebarBody />
      </aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 border-sidebar-border p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarBody onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur sm:px-6">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation">
          <Menu />
        </Button>
        <span className="hidden items-center gap-1.5 rounded-full border border-warning/40 bg-warning/15 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-warning-ink md:inline-flex">
          UI demo · not real auth
        </span>
        <div className="ml-auto">
          <RoleSwitcher />
        </div>
      </header>
      <main id="main" className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
