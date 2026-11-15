import { zodResolver } from "@hookform/resolvers/zod";
import { Ban, CheckCircle2, Lock, Send, Undo2, Eye } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Panel } from "@/components/common/Panel";
import { MerchantStatusPill } from "@/components/common/StatusPill";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import type { Merchant, MockUser, Role, TransitionAction } from "@/domain/types";
import { ROLE_LABEL, findUser } from "@/domain/users";
import { REJECT_REASON_MIN, isOwnApplication, relevantActions } from "@/domain/workflow";

const ICONS: Record<TransitionAction, typeof Send> = { submit: Send, startReview: Eye, approve: CheckCircle2, reject: Ban, revise: Undo2 };

const rejectSchema = z.object({
  reason: z.string().trim().min(REJECT_REASON_MIN, `Give a reason of at least ${REJECT_REASON_MIN} characters`).max(500, "Keep it under 500 characters"),
});

interface Props {
  merchant: Merchant;
  user: MockUser | undefined;
  activeRole: Role;
  busyAction?: TransitionAction | null | undefined;
  onAction: (action: TransitionAction, reason?: string) => Promise<{ ok: boolean; error?: string | undefined }>;
}

export function WorkflowPanel({ merchant, user, activeRole, busyAction, onAction }: Props) {
  const [confirm, setConfirm] = useState<TransitionAction | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const form = useForm<{ reason: string }>({ resolver: zodResolver(rejectSchema), defaultValues: { reason: "" } });
  const actions = relevantActions(merchant, user, activeRole);
  const own = user ? isOwnApplication(merchant, user.id) : false;
  const submitter = findUser(merchant.submittedBy);
  const creator = findUser(merchant.createdBy);

  const run = async (action: TransitionAction, reason?: string) => {
    const res = await onAction(action, reason);
    if (res.ok) {
      toast.success(`${merchant.tradingName}: action recorded`);
      return true;
    }
    toast.error(res.error ?? "Action failed");
    return false;
  };

  return (
    <Panel title="Maker–checker workflow" description={`You are acting as ${ROLE_LABEL[activeRole]}${user ? ` (${user.name})` : ""}`}>
      <div className="space-y-4">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Current status</dt>
            <dd className="mt-1">
              <MerchantStatusPill status={merchant.status} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Prepared by</dt>
            <dd className="mt-1 font-medium">{creator?.name ?? "—"}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-muted-foreground">Submitted by</dt>
            <dd className="mt-1 font-medium">{submitter?.name ?? "Not yet submitted"}</dd>
          </div>
        </dl>

        {own && activeRole === "checker" && (
          <div role="note" className="flex gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning-ink">
            <Lock className="mt-0.5 size-4 shrink-0" />
            <p>You prepared or submitted this application, so you can't review it. Ask another checker.</p>
          </div>
        )}

        {actions.length === 0 ? (
          <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">Onboarding complete — no further workflow actions are available.</p>
        ) : (
          <ul className="space-y-3">
            {actions.map(({ action, rule, check }) => {
              const Icon = ICONS[action];
              const reasonId = `why-${action}`;
              return (
                <li key={action}>
                  <Button
                    className="w-full justify-start"
                    variant={action === "reject" ? "destructive" : action === "approve" ? "default" : "outline"}
                    disabled={!check.allowed || !!busyAction}
                    aria-describedby={!check.allowed ? reasonId : undefined}
                    onClick={() => (action === "reject" ? setRejectOpen(true) : setConfirm(action))}
                  >
                    <Icon /> {busyAction === action ? "Working…" : rule.label}
                  </Button>
                  {!check.allowed && (
                    <p id={reasonId} className="mt-1.5 flex gap-1.5 text-xs text-muted-foreground">
                      <Lock className="mt-0.5 size-3 shrink-0" aria-hidden /> {check.reason}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm && actions.find((a) => a.action === confirm)?.rule.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              {merchant.tradingName} will move from <strong>{merchant.status}</strong> to{" "}
              <strong>{confirm && actions.find((a) => a.action === confirm)?.rule.to}</strong>. This is recorded in the audit history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const a = confirm;
                setConfirm(null);
                if (a) void run(a);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={rejectOpen}
        onOpenChange={(o) => {
          setRejectOpen(o);
          if (!o) form.reset();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject application</DialogTitle>
            <DialogDescription>The maker will see this reason and can reopen the application as a draft.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              noValidate
              onSubmit={form.handleSubmit(async ({ reason }) => {
                if (await run("reject", reason)) {
                  setRejectOpen(false);
                  form.reset();
                }
              })}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for rejection</FormLabel>
                    <FormControl>
                      <Textarea rows={4} placeholder="e.g. GST certificate does not match the legal entity name." {...field} />
                    </FormControl>
                    <FormDescription>Minimum {REJECT_REASON_MIN} characters.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setRejectOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="destructive" disabled={busyAction === "reject"}>
                  {busyAction === "reject" ? "Rejecting…" : "Reject application"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Panel>
  );
}
