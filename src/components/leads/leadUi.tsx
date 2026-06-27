import { Badge } from "../ui/badge";
import type { CaseStatus, LeadPipelineStage, LeadPriority, LeadStatus } from "../../types/lead";

export const leadPipelineStages: LeadPipelineStage[] = [
  "New Lead",
  "Initial Contact",
  "Documents Requested",
  "Documents Received",
  "Medical Review",
  "Hospital Selection",
  "Quotation Sent",
  "Decision Pending",
  "Confirmed",
  "Lost",
];

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const tone =
    status === "Accepted"
      ? "success"
      : status === "Lost"
        ? "danger"
        : status === "Hospital Quotes Received" || status === "Patient Decision Pending"
          ? "gold"
          : status === "Medical Review" || status === "Hospital Quotes Requested"
            ? "info"
            : "muted";

  return <Badge tone={tone}>{status}</Badge>;
}

export function LeadPriorityBadge({ priority }: { priority: LeadPriority }) {
  const tone =
    priority === "Urgent"
      ? "danger"
      : priority === "High"
        ? "warning"
        : priority === "Medium"
          ? "gold"
          : "muted";

  return <Badge tone={tone}>{priority}</Badge>;
}

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
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
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
