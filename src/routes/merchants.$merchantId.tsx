import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Panel } from "@/components/common/Panel";
import { EmptyState, ErrorState } from "@/components/common/states";
import { MerchantStatusPill } from "@/components/common/StatusPill";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AuditTrail, BusinessInfo, KycDocuments, OnboardingStepper } from "@/features/merchants/MerchantSections";
import { WorkflowPanel } from "@/features/merchants/WorkflowPanel";
import type { TransitionAction } from "@/domain/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { transitionMerchant } from "@/store/merchantsSlice";
import { useMerchants, useSession } from "@/store/selectors";

export const Route = createFileRoute("/merchants/$merchantId")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.merchantId} · Merchant review · Experia360` },
      { name: "description", content: "Merchant business details, KYC document status and maker-checker audit history (synthetic demo)." },
      { property: "og:title", content: `${params.merchantId} · Merchant review · Experia360` },
      { property: "og:description", content: "Merchant business details, KYC document status and maker-checker audit history (synthetic demo)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MerchantDetailPage,
});

function MerchantDetailPage() {
  const { merchantId } = Route.useParams();
  const { items, status, error, retry } = useMerchants();
  const { user, activeRole } = useSession();
  const dispatch = useAppDispatch();
  const pending = useAppSelector((s) => s.merchants.pendingAction);
  const merchant = items.find((m) => m.id === merchantId);

  const back = (
    <Button asChild variant="ghost" size="sm" className="-ml-2">
      <Link to="/merchants">
        <ArrowLeft /> All merchants
      </Link>
    </Button>
  );

  if (status === "failed") return <div className="space-y-4">{back}<ErrorState title="Couldn't load merchant" message={error ?? ""} onRetry={retry} /></div>;
  if (status !== "succeeded") {
    return (
      <div className="space-y-4" aria-busy="true">
        {back}
        <Skeleton className="h-12 w-72" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 rounded-xl lg:col-span-2" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }
  if (!merchant) {
    return (
      <div className="space-y-4">
        {back}
        <EmptyState title="Merchant not found" description={`No application with ID ${merchantId} exists in the demo data.`} />
      </div>
    );
  }

  const onAction = async (action: TransitionAction, reason?: string) => {
    const res = await dispatch(transitionMerchant({ merchantId: merchant.id, action, reason }));
    return transitionMerchant.fulfilled.match(res) ? { ok: true } : { ok: false, error: res.payload };
  };

  return (
    <div className="space-y-6">
      {back}
      <PageHeader
        eyebrow={merchant.id}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {merchant.tradingName} <MerchantStatusPill status={merchant.status} />
          </span>
        }
        description={`${merchant.legalName} · ${merchant.category} · ${merchant.city}`}
      />
      <Panel title="Onboarding progress">
        <OnboardingStepper status={merchant.status} />
      </Panel>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <BusinessInfo m={merchant} />
          <KycDocuments m={merchant} />
        </div>
        <div className="space-y-6">
          <WorkflowPanel
            merchant={merchant}
            user={user}
            activeRole={activeRole}
            busyAction={pending?.merchantId === merchant.id && pending.action !== "create" ? pending.action : null}
            onAction={onAction}
          />
          <AuditTrail m={merchant} />
        </div>
      </div>
    </div>
  );
}
