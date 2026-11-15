import type { MockUser, Role } from "./types";

/**
 * Fictional demo personas. Switching between them is a UI demo only —
 * it is NOT authentication and provides no security.
 */
export const MOCK_USERS: MockUser[] = [
  { id: "u-ananya", name: "Ananya Rao", title: "Onboarding Analyst", roles: ["maker"] },
  { id: "u-kabir", name: "Kabir Mehta", title: "Onboarding Analyst", roles: ["maker"] },
  { id: "u-meera", name: "Meera Iyer", title: "Compliance Reviewer", roles: ["checker"] },
  { id: "u-rohan", name: "Rohan Das", title: "Compliance Reviewer", roles: ["checker"] },
  { id: "u-priya", name: "Priya Nair", title: "Ops Lead (maker + checker)", roles: ["maker", "checker"] },
];

export const ROLE_LABEL: Record<Role, string> = { maker: "Maker", checker: "Checker" };

export function findUser(id: string | undefined): MockUser | undefined {
  return MOCK_USERS.find((u) => u.id === id);
}
