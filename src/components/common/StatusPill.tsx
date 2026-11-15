import { cva, type VariantProps } from "class-variance-authority";
import type { DocStatus, EventTone, MerchantStatus, TxnStatus } from "@/domain/types";
import { cn } from "@/lib/utils";

export const pillVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      tone: {
        success: "border-success/30 bg-success/10 text-success",
        warning: "border-warning/40 bg-warning/15 text-warning-ink",
        danger: "border-destructive/30 bg-destructive/10 text-destructive",
        info: "border-info/30 bg-info/10 text-info",
        neutral: "border-neutral/25 bg-neutral/10 text-neutral",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

type Tone = NonNullable<VariantProps<typeof pillVariants>["tone"]>;

export function StatusPill({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn(pillVariants({ tone }), className)}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export const MERCHANT_TONE: Record<MerchantStatus, Tone> = {
  Draft: "neutral",
  Submitted: "info",
  "Under Review": "warning",
  Approved: "success",
  Rejected: "danger",
};

export const TXN_TONE: Record<TxnStatus, Tone> = {
  Success: "success",
  Pending: "warning",
  Unknown: "info",
  Failed: "danger",
  Reversed: "neutral",
};

/** Unknown outcomes are never shown as failures. */
export const TXN_LABEL: Record<TxnStatus, string> = {
  Success: "Success",
  Pending: "Pending",
  Unknown: "Outcome unknown",
  Failed: "Failed",
  Reversed: "Reversed",
};

const DOC_TONE: Record<DocStatus, Tone> = { Verified: "success", Pending: "warning", Rejected: "danger", Missing: "neutral" };
export const EVENT_TONE: Record<EventTone, Tone> = { success: "success", warning: "warning", danger: "danger", info: "info", neutral: "neutral" };

export const MerchantStatusPill = ({ status }: { status: MerchantStatus }) => (
  <StatusPill tone={MERCHANT_TONE[status]}>{status}</StatusPill>
);
export const TxnStatusPill = ({ status }: { status: TxnStatus }) => (
  <StatusPill tone={TXN_TONE[status]}>{TXN_LABEL[status]}</StatusPill>
);
export const DocStatusPill = ({ status }: { status: DocStatus }) => <StatusPill tone={DOC_TONE[status]}>{status}</StatusPill>;
