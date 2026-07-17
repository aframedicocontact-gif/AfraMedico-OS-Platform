import type { LivePartner } from "../types/partnerRecord";
import type { ReferralStatus } from "../types/referralPartner";
import { pipelineStages } from "../components/referrals/referralUi";

const LIVE_STATUS_LABELS: Record<string, string> = {
  prospect: "Prospect",
};

const LIVE_SOURCE_LABELS: Record<string, string> = {
  website_application: "Website Application",
};

const LIVE_LIFECYCLE_LABELS: Record<string, string> = {
  approved_activation_pending: "Approved – Activation Pending",
};

function humanizeLiveValue(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatLiveStatus(value: string | null) {
  if (!value) return "—";
  return LIVE_STATUS_LABELS[value] ?? humanizeLiveValue(value);
}

export function formatLiveSource(value: string | null) {
  if (!value) return "—";
  return LIVE_SOURCE_LABELS[value] ?? humanizeLiveValue(value);
}

export function formatLiveLifecycle(value: string | null) {
  if (!value) return "—";
  return LIVE_LIFECYCLE_LABELS[value] ?? humanizeLiveValue(value);
}

export function formatLiveDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function mapLivePartnerToPipelineStage(partner: LivePartner): ReferralStatus {
  if (partner.lifecycle_stage === "approved_activation_pending") {
    return "Prospect";
  }

  const humanizedStatus = formatLiveStatus(partner.status);
  const matchedStage = pipelineStages.find(
    (stage) => stage.toLowerCase() === humanizedStatus.toLowerCase(),
  );

  return matchedStage ?? "Prospect";
}
