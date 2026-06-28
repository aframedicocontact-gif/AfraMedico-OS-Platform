import { Badge } from "../ui/badge";
import type { CaseStatus } from "../../types/case";

type CaseStatusBadgeProps = {
  status: CaseStatus;
};

function statusTone(status: CaseStatus) {
  if (status === "active" || status === "treatment_approved" || status === "travel_planned") return "success";
  if (status === "new" || status === "reopened") return "info";
  if (status === "lost") return "danger";
  if (status === "closed") return "muted";
  return "warning";
}

function label(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function CaseStatusBadge({ status }: CaseStatusBadgeProps) {
  return <Badge tone={statusTone(status)}>{label(status)}</Badge>;
}
