import { Badge } from "../ui/badge";
import type { AgreementStatus, ReferralStatus } from "../../types/referralPartner";

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
