import type { AuditEntry, Merchant, MerchantStatus, MockUser, Role, TransitionAction } from "./types";
import { ROLE_LABEL } from "./users";

export interface TransitionRule {
  from: MerchantStatus[];
  to: MerchantStatus;
  role: Role;
  label: string;
  verb: string;
}

/** The only legal status transitions. Anything not listed here is blocked. */
export const WORKFLOW: Record<TransitionAction, TransitionRule> = {
  submit: { from: ["Draft"], to: "Submitted", role: "maker", label: "Submit for review", verb: "submit" },
  startReview: { from: ["Submitted"], to: "Under Review", role: "checker", label: "Start review", verb: "start reviewing" },
  approve: { from: ["Under Review"], to: "Approved", role: "checker", label: "Approve", verb: "approve" },
  reject: { from: ["Under Review"], to: "Rejected", role: "checker", label: "Reject", verb: "reject" },
  revise: { from: ["Rejected"], to: "Draft", role: "maker", label: "Reopen as draft", verb: "reopen" },
};

export const TRANSITION_ORDER: TransitionAction[] = ["submit", "startReview", "approve", "reject", "revise"];

export const REJECT_REASON_MIN = 10;

export type TransitionCheck = { allowed: true } | { allowed: false; reason: string };

const deny = (reason: string): TransitionCheck => ({ allowed: false, reason });

/** True when this user prepared or submitted the application (maker side). */
export function isOwnApplication(merchant: Merchant, userId: string): boolean {
  return merchant.createdBy === userId || merchant.submittedBy === userId;
}

export function canPerform(
  merchant: Merchant,
  action: TransitionAction,
  user: MockUser | undefined,
  activeRole: Role,
): TransitionCheck {
  const rule = WORKFLOW[action];
  if (!rule) return deny("Unknown action.");
  if (!user) return deny("No demo user selected.");
  if (!user.roles.includes(activeRole)) {
    return deny(`${user.name} does not hold the ${ROLE_LABEL[activeRole]} role.`);
  }
  if (activeRole !== rule.role) {
    return deny(`Only a ${ROLE_LABEL[rule.role]} can ${rule.verb} an application.`);
  }
  if (!rule.from.includes(merchant.status)) {
    return deny(`Cannot ${rule.verb} an application that is ${merchant.status}.`);
  }
  if (rule.role === "checker" && isOwnApplication(merchant, user.id)) {
    return deny(
      "You prepared or submitted this application. A different checker must review it — self-approval is not allowed.",
    );
  }
  return { allowed: true };
}

export type TransitionResult = { ok: true; merchant: Merchant } | { ok: false; error: string };

export function applyTransition(
  merchant: Merchant,
  action: TransitionAction,
  user: MockUser | undefined,
  activeRole: Role,
  opts: { reason?: string | undefined; now: string; entryId: string },
): TransitionResult {
  const check = canPerform(merchant, action, user, activeRole);
  if (!check.allowed) return { ok: false, error: check.reason };
  const actor = user as MockUser;
  const reason = opts.reason?.trim();
  if (action === "reject" && (!reason || reason.length < REJECT_REASON_MIN)) {
    return { ok: false, error: `A rejection reason of at least ${REJECT_REASON_MIN} characters is required.` };
  }
  const rule = WORKFLOW[action];
  const entry: AuditEntry = {
    id: opts.entryId,
    action,
    actorId: actor.id,
    actorName: actor.name,
    actorRole: activeRole,
    at: opts.now,
    fromStatus: merchant.status,
    toStatus: rule.to,
    ...(reason ? { reason } : {}),
  };
  const next: Merchant = { ...merchant };
  if (action === "submit") next.submittedBy = actor.id;
  if (action === "revise") delete next.submittedBy;
  return {
    ok: true,
    merchant: {
      ...next,
      status: rule.to,
      updatedAt: opts.now,
      audit: [...merchant.audit, entry],
    },
  };
}

/** Actions that are relevant from the merchant's current status, with a permission check each. */
export function relevantActions(merchant: Merchant, user: MockUser | undefined, activeRole: Role) {
  return TRANSITION_ORDER.filter((a) => WORKFLOW[a].from.includes(merchant.status)).map((action) => ({
    action,
    rule: WORKFLOW[action],
    check: canPerform(merchant, action, user, activeRole),
  }));
}
