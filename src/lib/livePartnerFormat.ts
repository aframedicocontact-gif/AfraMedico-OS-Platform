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
  invitation_sent: "Invitation Sent",
  registration_started: "Registration Started",
  profile_completed: "Profile Completed",
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

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isLivePartnerId(value: string) {
  return UUID_PATTERN.test(value);
}

export function mapLivePartnerToPipelineStage(partner: LivePartner): ReferralStatus {
  switch (partner.lifecycle_stage) {
    case "approved_activation_pending":
      return "Prospect";
    case "invitation_sent":
      return "Invitation Sent";
    case "registration_started":
      return "Registration Started";
    case "profile_completed":
      return "Profile Completed";
  }

  const humanizedStatus = formatLiveStatus(partner.status);
  const matchedStage = pipelineStages.find(
    (stage) => stage.toLowerCase() === humanizedStatus.toLowerCase(),
  );

  return matchedStage ?? "Prospect";
}
