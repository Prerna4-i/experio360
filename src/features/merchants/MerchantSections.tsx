import { Check, FileText } from "lucide-react";
import { Panel } from "@/components/common/Panel";
import { DocStatusPill } from "@/components/common/StatusPill";
import { Timeline } from "@/components/common/Timeline";
import type { AuditEntry, EventTone, Merchant, MerchantStatus } from "@/domain/types";
import { ROLE_LABEL } from "@/domain/users";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function BusinessInfo({ m }: { m: Merchant }) {
  const rows: [string, React.ReactNode][] = [
    ["Legal name", m.legalName],
    ["Trading name", m.tradingName],
    ["Category", m.category],
    ["Location", `${m.city}, ${m.country}`],
    ["Registration no.", <span className="font-mono text-xs">{m.registrationNumber}</span>],
    ["Tax ID", <span className="font-mono text-xs">{m.taxId}</span>],
    ["Primary contact", m.contactName],
    ["Email", m.contactEmail],
    ["Phone", m.contactPhone],
    ["Website", m.website],
    ["Expected monthly volume", formatCurrency(m.expectedMonthlyVolume)],
    ["Risk rating", m.riskLevel],
    ["Created", formatDate(m.createdAt)],
    ["Last updated", formatDate(m.updatedAt)],
  ];
  return (
    <Panel title="Business information">
      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-xs text-muted-foreground">{k}</dt>
            <dd className="mt-0.5 break-words text-sm">{v}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

export function KycDocuments({ m }: { m: Merchant }) {
  const verified = m.documents.filter((d) => d.status === "Verified").length;
  return (
    <Panel title="KYC documents" description={`${verified} of ${m.documents.length} verified`} bodyClassName="p-0">
      <ul className="divide-y">
        {m.documents.map((d) => (
          <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
            <div className="flex min-w-0 items-start gap-3">
              <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <div>
                <p className="text-sm font-medium">{d.type}</p>
                <p className="text-xs text-muted-foreground">{d.uploadedAt ? `Uploaded ${formatDate(d.uploadedAt)}` : "Not uploaded"}</p>
                {d.note && <p className="mt-1 text-xs text-destructive">{d.note}</p>}
              </div>
            </div>
            <DocStatusPill status={d.status} />
          </li>
        ))}
      </ul>
    </Panel>
  );
}

const STEPS: MerchantStatus[] = ["Draft", "Submitted", "Under Review", "Approved"];

/** Stage tracker for the onboarding lifecycle. */
export function OnboardingStepper({ status }: { status: MerchantStatus }) {
  const rejected = status === "Rejected";
  const current = rejected ? 2 : STEPS.indexOf(status);
  return (
    <ol aria-label="Onboarding progress" className="grid grid-cols-4 gap-2">
      {STEPS.map((s, i) => {
        const done = i < current || (i === current && status === "Approved");
        const active = i === current && !done;
        const label = i === 3 && rejected ? "Rejected" : s;
        return (
          <li key={s} aria-current={active ? "step" : undefined} className="space-y-2">
            <div className={cn("h-1.5 rounded-full", done ? "bg-success" : active ? "bg-warning" : "bg-border", i === 3 && rejected && "bg-destructive")} />
            <p className={cn("flex items-center gap-1 text-xs", done || active ? "font-medium text-foreground" : "text-muted-foreground", i === 3 && rejected && "text-destructive")}>
              {done && <Check className="size-3" aria-hidden />}
              {label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

const ACTION_TEXT: Record<AuditEntry["action"], string> = {
  create: "Application created",
  submit: "Submitted for review",
  startReview: "Review started",
  approve: "Approved",
  reject: "Rejected",
  revise: "Reopened as draft",
};
const ACTION_TONE: Record<AuditEntry["action"], EventTone> = {
  create: "neutral",
  submit: "info",
  startReview: "warning",
  approve: "success",
  reject: "danger",
  revise: "neutral",
};

export function AuditTrail({ m }: { m: Merchant }) {
  const items = [...m.audit].reverse().map((e) => ({
    id: e.id,
    tone: ACTION_TONE[e.action],
    title: (
      <>
        {ACTION_TEXT[e.action]}
        {e.fromStatus && (
          <span className="ml-2 font-mono text-[11px] font-normal text-muted-foreground">
            {e.fromStatus} → {e.toStatus}
          </span>
        )}
      </>
    ),
    meta: `${e.actorName} · ${ROLE_LABEL[e.actorRole]} · ${formatDateTime(e.at)}`,
    description: e.reason ? <span className="block rounded-md bg-muted px-3 py-2 text-foreground">“{e.reason}”</span> : undefined,
  }));
  return (
    <Panel title="Audit history" description="Every workflow action, newest first">
      <Timeline items={items} label="Audit history" />
    </Panel>
  );
}
