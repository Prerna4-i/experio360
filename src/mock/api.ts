/**
 * In-memory mock API. Simulates latency and network failures, and re-validates every
 * workflow transition so invalid moves are rejected by the "server" as well as the UI.
 */
import type { Merchant, NewMerchantInput, Role, Transaction, TransitionAction } from "@/domain/types";
import { findUser } from "@/domain/users";
import { applyTransition } from "@/domain/workflow";
import { ANCHOR_DATE, DOC_TYPES, buildMerchants, buildTransactions } from "./fixtures";

export type NetworkMode = "normal" | "slow" | "offline" | "instant";

export class MockApiError extends Error {
  constructor(
    message: string,
    public code: "NETWORK" | "NOT_FOUND" | "INVALID_TRANSITION" | "FORBIDDEN" | "VALIDATION",
  ) {
    super(message);
    this.name = "MockApiError";
  }
}

interface Db {
  merchants: Merchant[];
  transactions: Transaction[];
  seq: number;
}
let db: Db | null = null;

function getDb(): Db {
  if (!db) {
    const merchants = buildMerchants();
    db = { merchants, transactions: buildTransactions(merchants), seq: 0 };
  }
  return db;
}

export function resetMockDb(seed?: { merchants?: Merchant[]; transactions?: Transaction[] }) {
  db = null;
  if (seed) {
    const base = getDb();
    if (seed.merchants) base.merchants = structuredClone(seed.merchants);
    if (seed.transactions) base.transactions = structuredClone(seed.transactions);
  }
}

const clone = <T,>(v: T): T => structuredClone(v);

/** The mock clock advances from the demo anchor so new audit entries sort after fixtures. */
function now(): string {
  const d = getDb();
  d.seq += 1;
  return new Date(ANCHOR_DATE.getTime() + d.seq * 60_000).toISOString();
}

async function network(mode: NetworkMode) {
  const ms = mode === "instant" ? 0 : mode === "slow" ? 1800 : 380;
  if (ms) await new Promise((r) => setTimeout(r, ms));
  if (mode === "offline") {
    throw new MockApiError("The mock API is unreachable (simulated network failure).", "NETWORK");
  }
}

export const mockApi = {
  async listMerchants(mode: NetworkMode): Promise<Merchant[]> {
    await network(mode);
    return clone(getDb().merchants);
  },

  async listTransactions(mode: NetworkMode): Promise<Transaction[]> {
    await network(mode);
    return clone(getDb().transactions);
  },

  async transitionMerchant(
    mode: NetworkMode,
    req: { merchantId: string; action: TransitionAction; actorId: string; role: Role; reason?: string },
  ): Promise<Merchant> {
    await network(mode);
    const d = getDb();
    const idx = d.merchants.findIndex((m) => m.id === req.merchantId);
    if (idx < 0) throw new MockApiError("Merchant not found.", "NOT_FOUND");
    const result = applyTransition(d.merchants[idx], req.action, findUser(req.actorId), req.role, {
      reason: req.reason,
      now: now(),
      entryId: `${req.merchantId}-A${d.merchants[idx].audit.length + 1}`,
    });
    if (!result.ok) throw new MockApiError(result.error, "INVALID_TRANSITION");
    d.merchants[idx] = result.merchant;
    return clone(result.merchant);
  },

  async createMerchant(mode: NetworkMode, input: NewMerchantInput, actorId: string, role: Role): Promise<Merchant> {
    await network(mode);
    const user = findUser(actorId);
    if (!user || role !== "maker" || !user.roles.includes("maker")) {
      throw new MockApiError("Only a Maker can create a merchant application.", "FORBIDDEN");
    }
    const d = getDb();
    const id = `MER-${1001 + d.merchants.length}`;
    const at = now();
    const merchant: Merchant = {
      id,
      ...input,
      country: "India",
      registrationNumber: `SYN-PENDING-${id}`,
      taxId: "SYN-PENDING",
      riskLevel: "Medium",
      createdAt: at,
      updatedAt: at,
      createdBy: user.id,
      status: "Draft",
      documents: DOC_TYPES.map((type, i) => ({ id: `DOC-${id}-${i}`, type, status: "Missing" as const })),
      audit: [
        {
          id: `${id}-A1`,
          action: "create",
          actorId: user.id,
          actorName: user.name,
          actorRole: "maker",
          at,
          fromStatus: null,
          toStatus: "Draft",
        },
      ],
    };
    d.merchants.unshift(merchant);
    return clone(merchant);
  },
};
