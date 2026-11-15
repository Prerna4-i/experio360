/** Domain types for the Experia360 merchant operations demo. All data is synthetic. */

export type Role = "maker" | "checker";

export interface MockUser {
  id: string;
  name: string;
  title: string;
  roles: Role[];
}

export const MERCHANT_STATUSES = [
  "Draft",
  "Submitted",
  "Under Review",
  "Approved",
  "Rejected",
] as const;
export type MerchantStatus = (typeof MERCHANT_STATUSES)[number];

export type DocStatus = "Verified" | "Pending" | "Rejected" | "Missing";

export interface KycDocument {
  id: string;
  type: string;
  status: DocStatus;
  uploadedAt?: string | undefined;
  note?: string | undefined;
}

export type WorkflowAction = "create" | "submit" | "startReview" | "approve" | "reject" | "revise";
export type TransitionAction = Exclude<WorkflowAction, "create">;

export interface AuditEntry {
  id: string;
  action: WorkflowAction;
  actorId: string;
  actorName: string;
  actorRole: Role;
  at: string;
  fromStatus: MerchantStatus | null;
  toStatus: MerchantStatus;
  reason?: string | undefined;
}

export type RiskLevel = "Low" | "Medium" | "High";

export interface Merchant {
  id: string;
  tradingName: string;
  legalName: string;
  category: string;
  city: string;
  country: string;
  registrationNumber: string;
  taxId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  expectedMonthlyVolume: number;
  riskLevel: RiskLevel;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  submittedBy?: string | undefined;
  status: MerchantStatus;
  documents: KycDocument[];
  audit: AuditEntry[];
}

export const TXN_STATUSES = ["Success", "Pending", "Unknown", "Failed", "Reversed"] as const;
export type TxnStatus = (typeof TXN_STATUSES)[number];

export type EventTone = "success" | "warning" | "danger" | "info" | "neutral";

export interface TxnEvent {
  id: string;
  at: string;
  label: string;
  detail?: string | undefined;
  tone: EventTone;
}

export type PaymentMethod = "UPI" | "Card" | "NetBanking" | "Wallet";

export interface Transaction {
  id: string;
  reference: string;
  merchantId: string;
  merchantName: string;
  amount: number;
  currency: "INR";
  method: PaymentMethod;
  provider: string;
  providerReference: string | null;
  createdAt: string;
  status: TxnStatus;
  timeline: TxnEvent[];
}

export interface NewMerchantInput {
  tradingName: string;
  legalName: string;
  category: string;
  city: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  expectedMonthlyVolume: number;
}
