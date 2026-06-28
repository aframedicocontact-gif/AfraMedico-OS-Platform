import { Badge } from "../ui/badge";
import type { PatientStatus } from "../../types/patient";

type PatientStatusBadgeProps = {
  status: PatientStatus;
};

function statusTone(status: PatientStatus) {
  if (status === "active") return "success";
  if (status === "prospect") return "info";
  if (status === "archived") return "muted";
  return "warning";
}

function statusLabel(status: PatientStatus) {
  return status
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function PatientStatusBadge({ status }: PatientStatusBadgeProps) {
  return <Badge tone={statusTone(status)}>{statusLabel(status)}</Badge>;
}
