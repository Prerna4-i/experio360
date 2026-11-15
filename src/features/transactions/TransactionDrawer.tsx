import { HelpCircle, Hourglass } from "lucide-react";
import { EVENT_TONE, TxnStatusPill } from "@/components/common/StatusPill";
import { Timeline } from "@/components/common/Timeline";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Transaction } from "@/domain/types";
import { formatCurrency, formatDateTime } from "@/lib/format";

export function OutcomeNotice({ status }: { status: Transaction["status"] }) {
  if (status === "Unknown") {
    return (
      <div role="note" className="flex gap-3 rounded-lg border border-info/30 bg-info/5 p-3 text-sm">
        <HelpCircle className="mt-0.5 size-4 shrink-0 text-info" />
        <div>
          <p className="font-medium">Outcome not yet known — this is not a failure</p>
          <p className="mt-0.5 text-muted-foreground">
            The provider didn't respond before the timeout. The final result will come from a status enquiry or the settlement file. Don't refund or ask the customer to retry until it's confirmed.
          </p>
        </div>
      </div>
    );
  }
  if (status === "Pending") {
    return (
      <div role="note" className="flex gap-3 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
        <Hourglass className="mt-0.5 size-4 shrink-0 text-warning-ink" />
        <div>
          <p className="font-medium">Still processing</p>
          <p className="mt-0.5 text-muted-foreground">Waiting for the customer or provider to complete authorisation.</p>
        </div>
      </div>
    );
  }
  return null;
}

export function TransactionDrawer({ txn, onOpenChange }: { txn: Transaction | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={!!txn} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {txn && (
          <>
            <SheetHeader className="text-left">
              <SheetTitle className="font-mono text-lg">{txn.id}</SheetTitle>
              <SheetDescription>
                {txn.merchantName} · {formatDateTime(txn.createdAt)}
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              <div className="flex items-end justify-between gap-3">
                <p className="font-display text-3xl font-semibold tabular">{formatCurrency(txn.amount)}</p>
                <TxnStatusPill status={txn.status} />
              </div>
              <OutcomeNotice status={txn.status} />
              <dl className="grid grid-cols-2 gap-4 rounded-lg border p-4 text-sm">
                {(
                  [
                    ["Merchant reference", <span className="font-mono">{txn.reference}</span>],
                    ["Merchant ID", <span className="font-mono">{txn.merchantId}</span>],
                    ["Method", txn.method],
                    ["Provider", txn.provider],
                    ["Provider reference", txn.providerReference ? <span className="font-mono">{txn.providerReference}</span> : <span className="text-muted-foreground">Not received yet</span>],
                    ["Currency", txn.currency],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k} className="min-w-0">
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="mt-0.5 break-words">{v}</dd>
                  </div>
                ))}
              </dl>
              <div>
                <h3 className="mb-3 text-sm font-semibold">Status timeline</h3>
                <Timeline
                  label="Transaction status timeline"
                  items={txn.timeline.map((e) => ({ id: e.id, title: e.label, meta: formatDateTime(e.at), description: e.detail, tone: EVENT_TONE[e.tone] ?? e.tone }))}
                />
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
