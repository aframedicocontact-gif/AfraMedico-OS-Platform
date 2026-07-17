import type { AppView } from "../../app/App";
import { cn } from "../../lib/utils";
import { Badge } from "../ui/badge";
import type { AgreementStatus, ReferralStatus } from "../../types/referralPartner";

export type ReferralNavKey = "dashboard" | "pipeline" | "directory";

const referralNavItems: { key: ReferralNavKey; label: string; view: AppView }[] = [
  { key: "dashboard", label: "Dashboard", view: { name: "referral-dashboard" } },
  { key: "pipeline", label: "Pipeline", view: { name: "referral-pipeline" } },
  { key: "directory", label: "Directory", view: { name: "partner-directory" } },
];

export function ReferralPartnerNav({
  current,
  onNavigate,
}: {
  current: ReferralNavKey;
  onNavigate: (view: AppView) => void;
}) {
  return (
    <nav className="inline-flex w-fit gap-1 rounded-md border bg-white p-1 shadow-sm">
      {referralNavItems.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onNavigate(item.view)}
          className={cn(
            "rounded px-3 py-1.5 text-sm font-medium transition-colors",
            current === item.key
              ? "bg-emerald-600 text-white"
              : "text-muted-foreground hover:bg-muted hover:text-emerald-900",
          )}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

export const pipelineStages: ReferralStatus[] = [
  "Prospect",
  "Contacted",
  "Meeting Scheduled",
  "Negotiation",
  "Agreement Signed",
  "Active Referrer",
  "Inactive",
];

export function ReferralStatusBadge({ status }: { status: ReferralStatus }) {
  const tone =
    status === "Active Referrer" || status === "Agreement Signed"
      ? "success"
      : status === "Negotiation" || status === "Meeting Scheduled"
        ? "gold"
        : status === "Inactive"
          ? "danger"
          : status === "Contacted"
            ? "info"
            : "muted";

  return <Badge tone={tone}>{status}</Badge>;
}

export function AgreementStatusBadge({ status }: { status: AgreementStatus }) {
  const tone =
    status === "Signed"
      ? "success"
      : status === "Under Review" || status === "Draft Sent"
        ? "gold"
        : status === "Paused"
          ? "danger"
          : "muted";

  return <Badge tone={tone}>{status}</Badge>;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
