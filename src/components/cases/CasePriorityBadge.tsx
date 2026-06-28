import { Badge } from "../ui/badge";
import type { CasePriority } from "../../types/case";

type CasePriorityBadgeProps = {
  priority: CasePriority;
};

function priorityTone(priority: CasePriority) {
  if (priority === "critical") return "danger";
  if (priority === "high") return "warning";
  if (priority === "low") return "muted";
  return "info";
}

export function CasePriorityBadge({ priority }: CasePriorityBadgeProps) {
  return <Badge tone={priorityTone(priority)}>{priority}</Badge>;
}
