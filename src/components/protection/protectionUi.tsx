import { Badge } from "../ui/badge";
import type {
  DuplicateReviewStatus,
  ProtectionCaseStatus,
  QuoteStatus,
  ReferralOwnership,
  RegistrationStatus,
} from "../../types/referralProtection";

export function OwnershipBadge({ ownership }: { ownership: ReferralOwnership }) {
  const tone =
    ownership === "Confirmed First Referrer"
      ? "success"
      : ownership === "Split Commission" || ownership === "Transferred by Manager"
        ? "gold"
        : ownership === "No Commission"
          ? "danger"
          : "info";

  return <Badge tone={tone}>{ownership}</Badge>;
}

export function RegistrationBadge({ status }: { status: RegistrationStatus }) {
  const tone =
    status === "Confirmed"
      ? "success"
      : status === "Duplicate Flagged"
        ? "warning"
        : status === "Rejected"
          ? "danger"
          : status === "Submitted"
            ? "info"
            : "muted";

  return <Badge tone={tone}>{status}</Badge>;
}

export function QuoteBadge({ status }: { status: QuoteStatus }) {
  const tone =
    status === "Received" || status === "Sent to Patient"
      ? "success"
      : status === "Requested"
        ? "gold"
        : status === "Expired"
          ? "danger"
          : "muted";

  return <Badge tone={tone}>{status}</Badge>;
}

export function DuplicateBadge({ status }: { status: DuplicateReviewStatus }) {
  const tone = status === "Pending" ? "warning" : status === "Resolved" ? "success" : "danger";
  return <Badge tone={tone}>{status}</Badge>;
}

export function ProtectionCaseStatusBadge({ status }: { status: ProtectionCaseStatus }) {
  const tone =
    status === "Active"
      ? "success"
      : status === "Reopened"
        ? "gold"
        : status === "Lost"
          ? "danger"
          : status === "Future"
            ? "info"
            : "muted";

  return <Badge tone={tone}>{status}</Badge>;
}

export function formatCurrency(value: number) {
  if (value === 0) {
    return "Pending";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
