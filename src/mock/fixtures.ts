/**
 * Deterministic SYNTHETIC fixtures. Every name, number and reference is fictional
 * (registration and tax IDs carry an "SYN" marker, emails use the reserved .example TLD).
 */
import type {
  AuditEntry,
  DocStatus,
  KycDocument,
  Merchant,
  MerchantStatus,
  MockUser,
  PaymentMethod,
  RiskLevel,
  Transaction,
  TxnEvent,
  TxnStatus,
} from "@/domain/types";
import { MOCK_USERS } from "@/domain/users";

/** Fixed "today" for the demo so data, filters and SSR stay deterministic. */
export const ANCHOR_DATE = new Date("2026-11-15T12:00:00.000Z");
const DAY = 86_400_000;

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PREFIXES = [
  "Saffron", "Monsoon", "Blue Lotus", "Copperleaf", "Northwind", "Tidewater", "Peacock", "Amberline",
  "Kestrel", "Juniper", "Marigold", "Indigo Kite", "Silverfern", "Cobalt Bay", "Banyan", "Riverstone",
  "Lanternfly", "Cardamom", "Greyhaven", "Sundial", "Coral Reef", "Tamarind", "Halcyon", "Mosaic",
];
const SUFFIXES: { word: string; category: string }[] = [
  { word: "Traders", category: "Wholesale" },
  { word: "Foods", category: "Food & Beverage" },
  { word: "Retail", category: "Retail" },
  { word: "Labs", category: "Software" },
  { word: "Travels", category: "Travel" },
  { word: "Wellness", category: "Health" },
  { word: "Textiles", category: "Apparel" },
  { word: "Electronics", category: "Electronics" },
  { word: "Café", category: "Food & Beverage" },
  { word: "Logistics", category: "Logistics" },
];
const CITIES = ["Bengaluru", "Mumbai", "Pune", "Chennai", "Hyderabad", "New Delhi", "Kochi", "Jaipur", "Ahmedabad", "Kolkata"];
const CONTACT_FIRST = ["Arjun", "Diya", "Ishaan", "Kavya", "Neel", "Riya", "Siddharth", "Tara", "Vikram", "Zoya", "Aditi", "Farhan"];
const CONTACT_LAST = ["Kulkarni", "Menon", "Bhat", "Sengupta", "Reddy", "Joshi", "Pillai", "Chawla", "Gill", "Naidu"];
export const DOC_TYPES = [
  "Certificate of Incorporation",
  "Company PAN",
  "GST Registration",
  "Bank Account Proof",
  "Director ID Proof",
];
const REJECT_REASONS = [
  "GST registration does not match the legal entity name on the incorporation certificate.",
  "Bank account proof is illegible; please upload a clearer cancelled cheque or bank letter.",
  "Director ID proof has expired. A valid document is required before onboarding.",
  "Business category conflicts with the declared website content; clarification needed.",
];

export const CATEGORIES = Array.from(new Set(SUFFIXES.map((s) => s.category))).sort();

const makers = MOCK_USERS.filter((u) => u.roles.includes("maker"));
const checkers = MOCK_USERS.filter((u) => u.roles.includes("checker"));

const STATUS_PLAN: MerchantStatus[] = [
  ...Array<MerchantStatus>(22).fill("Approved"),
  ...Array<MerchantStatus>(7).fill("Under Review"),
  ...Array<MerchantStatus>(7).fill("Submitted"),
  ...Array<MerchantStatus>(6).fill("Draft"),
  ...Array<MerchantStatus>(6).fill("Rejected"),
];

function iso(ms: number) {
  return new Date(ms).toISOString();
}

function docsFor(status: MerchantStatus, rand: () => number, baseMs: number, idx: number): KycDocument[] {
  const rejectedDoc = Math.floor(rand() * DOC_TYPES.length);
  return DOC_TYPES.map((type, d) => {
    let s: DocStatus;
    switch (status) {
      case "Approved":
        s = "Verified";
        break;
      case "Draft":
        s = rand() < 0.45 ? "Missing" : "Pending";
        break;
      case "Submitted":
        s = "Pending";
        break;
      case "Under Review":
        s = rand() < 0.55 ? "Verified" : "Pending";
        break;
      case "Rejected":
        s = d === rejectedDoc ? "Rejected" : rand() < 0.6 ? "Verified" : "Pending";
        break;
    }
    return {
      id: `DOC-${idx}-${d}`,
      type,
      status: s,
      uploadedAt: s === "Missing" ? undefined : iso(baseMs + d * 3_600_000),
      note: s === "Rejected" ? "Document did not pass verification. See rejection reason." : undefined,
    };
  });
}

export function buildMerchants(seed = 360): Merchant[] {
  const rand = mulberry32(seed);
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
  const statuses = [...STATUS_PLAN];
  for (let i = statuses.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [statuses[i], statuses[j]] = [statuses[j], statuses[i]];
  }

  return statuses.map((status, i) => {
    const prefix = PREFIXES[i % PREFIXES.length];
    const suffix = SUFFIXES[(i * 7) % SUFFIXES.length];
    const tradingName = `${prefix} ${suffix.word}`;
    const slug = tradingName.toLowerCase().replace(/[^a-z]+/g, "");
    const id = `MER-${String(1001 + i)}`;
    const maker: MockUser = pick(makers);
    const checker: MockUser = pick(checkers.filter((c) => c.id !== maker.id));
    const createdMs = ANCHOR_DATE.getTime() - (20 + Math.floor(rand() * 160)) * DAY - Math.floor(rand() * DAY);

    let t = createdMs;
    const audit: AuditEntry[] = [];
    const push = (
      action: AuditEntry["action"],
      actor: MockUser,
      role: AuditEntry["actorRole"],
      from: MerchantStatus | null,
      to: MerchantStatus,
      reason?: string,
    ) => {
      audit.push({
        id: `${id}-A${audit.length + 1}`,
        action,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: role,
        at: iso(t),
        fromStatus: from,
        toStatus: to,
        ...(reason ? { reason } : {}),
      });
    };
    push("create", maker, "maker", null, "Draft");
    let submittedBy: string | undefined;
    if (status !== "Draft") {
      t += DAY * (1 + Math.floor(rand() * 3)) + Math.floor(rand() * 8 * 3_600_000);
      push("submit", maker, "maker", "Draft", "Submitted");
      submittedBy = maker.id;
    }
    if (status === "Under Review" || status === "Approved" || status === "Rejected") {
      t += DAY + Math.floor(rand() * 6 * 3_600_000);
      push("startReview", checker, "checker", "Submitted", "Under Review");
    }
    if (status === "Approved") {
      t += DAY * (1 + Math.floor(rand() * 3));
      push("approve", checker, "checker", "Under Review", "Approved");
    }
    if (status === "Rejected") {
      t += DAY * (1 + Math.floor(rand() * 3));
      push("reject", checker, "checker", "Under Review", "Rejected", pick(REJECT_REASONS));
    }

    const contactName = `${pick(CONTACT_FIRST)} ${pick(CONTACT_LAST)}`;
    const risk: RiskLevel = rand() < 0.6 ? "Low" : rand() < 0.75 ? "Medium" : "High";
    return {
      id,
      tradingName,
      legalName: `${tradingName} Private Limited`,
      category: suffix.category,
      city: CITIES[i % CITIES.length],
      country: "India",
      registrationNumber: `SYN-U${String(70000 + i * 37).padStart(6, "0")}KA2026PTC`,
      taxId: `SYN29AAA${String(1000 + i)}Z${i % 9}`,
      contactName,
      contactEmail: `${contactName.split(" ")[0].toLowerCase()}@${slug}.example`,
      contactPhone: `+91 00000 ${String(10000 + i * 113).slice(0, 5)}`,
      website: `https://${slug}.example`,
      expectedMonthlyVolume: Math.round((2 + rand() * 98) * 100_000),
      riskLevel: risk,
      createdAt: iso(createdMs),
      updatedAt: audit[audit.length - 1].at,
      createdBy: maker.id,
      submittedBy,
      status,
      documents: docsFor(status, rand, createdMs + 3_600_000, i),
      audit,
    } satisfies Merchant;
  });
}

const PROVIDERS = ["Northstar PG (sim)", "HarborPay (sim)", "UPI Switch (sim)"];
const METHODS: PaymentMethod[] = ["UPI", "UPI", "UPI", "Card", "Card", "NetBanking", "Wallet"];
const DECLINES = ["Issuer declined the payment", "Insufficient funds reported by issuer", "Invalid UPI handle", "Card authentication failed"];

function pickStatus(r: number): TxnStatus {
  if (r < 0.78) return "Success";
  if (r < 0.85) return "Pending";
  if (r < 0.89) return "Unknown";
  if (r < 0.97) return "Failed";
  return "Reversed";
}

export function buildTransactions(merchants: Merchant[], count = 640, seed = 9001): Transaction[] {
  const rand = mulberry32(seed);
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
  const approved = merchants.filter((m) => m.status === "Approved");
  if (approved.length === 0) return [];
  const anchor = ANCHOR_DATE.getTime();
  const out: Transaction[] = [];

  for (let i = 0; i < count; i++) {
    const m = pick(approved);
    const status = pickStatus(rand());
    const window = status === "Pending" ? 2 : status === "Unknown" ? 6 : 89;
    const createdMs = anchor - Math.floor(rand() * window * DAY) - Math.floor(rand() * 10 * 3_600_000);
    const amount = Math.round(Math.exp(5 + rand() * 6.8) * 100) / 100;
    const provider = pick(PROVIDERS);
    const id = `TXN${(0x10000000 + i * 7919 + Math.floor(rand() * 999)).toString(36).toUpperCase()}`;
    const ev = (offsetSec: number, label: string, tone: TxnEvent["tone"], detail?: string): TxnEvent => ({
      id: `${id}-E${offsetSec}`,
      at: iso(createdMs + offsetSec * 1000),
      label,
      tone,
      detail,
    });
    const timeline: TxnEvent[] = [
      ev(0, "Payment initiated", "neutral", "Customer started checkout on merchant site."),
      ev(2, `Authorisation request sent to ${provider}`, "info"),
    ];
    const providerRef = `PRV-${Math.floor(rand() * 1e10).toString().padStart(10, "0")}`;
    let providerReference: string | null = providerRef;
    switch (status) {
      case "Success":
        timeline.push(ev(6, "Provider confirmed — captured", "success"));
        timeline.push(ev(6 + 86400, "Included in settlement batch", "success"));
        break;
      case "Failed":
        timeline.push(ev(5, "Provider declined", "danger", pick(DECLINES)));
        break;
      case "Reversed":
        timeline.push(ev(6, "Provider confirmed — captured", "success"));
        timeline.push(ev(3600, "Reversal requested by merchant", "warning"));
        timeline.push(ev(7200, "Reversed — funds returned to customer", "neutral"));
        break;
      case "Pending":
        providerReference = null;
        timeline.push(ev(4, "Awaiting provider response", "warning", "Customer authorisation in progress (e.g. UPI collect request)."));
        break;
      case "Unknown":
        providerReference = null;
        timeline.push(ev(32, "Provider request timed out after 30s", "warning", "No final response was received. This is not a failure."));
        timeline.push(ev(300, "Queued for status enquiry & reconciliation", "info", "Outcome will be confirmed from the provider's status API or settlement file."));
        break;
    }
    out.push({
      id,
      reference: `ORD-${String(Math.floor(rand() * 900000) + 100000)}`,
      merchantId: m.id,
      merchantName: m.tradingName,
      amount,
      currency: "INR",
      method: pick(METHODS),
      provider,
      providerReference,
      createdAt: iso(createdMs),
      status,
      timeline,
    });
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
