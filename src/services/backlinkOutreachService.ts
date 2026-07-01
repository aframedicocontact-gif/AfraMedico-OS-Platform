import type {
  BacklinkCampaign,
  BacklinkOutreachStatus,
  BacklinkStatus,
  BacklinkTemplateChannel,
} from "../types/backlinkCampaign";

export function updateTargetOutreachStatus(
  campaign: BacklinkCampaign,
  organizationId: string,
  outreachStatus: BacklinkOutreachStatus,
): BacklinkCampaign {
  return {
    ...campaign,
    targets: campaign.targets.map((target) =>
      target.organizationId === organizationId ? { ...target, outreachStatus } : target,
    ),
  };
}

export function updateTargetBacklinkStatus(
  campaign: BacklinkCampaign,
  organizationId: string,
  backlinkStatus: BacklinkStatus,
): BacklinkCampaign {
  return {
    ...campaign,
    targets: campaign.targets.map((target) =>
      target.organizationId === organizationId ? { ...target, backlinkStatus } : target,
    ),
  };
}

export function updateTargetBacklinkField(
  campaign: BacklinkCampaign,
  organizationId: string,
  field: "requestedUrl" | "targetPage" | "anchorText" | "dateRequested" | "dateWon" | "backlinkUrl" | "notes",
  value: string,
): BacklinkCampaign {
  return {
    ...campaign,
    targets: campaign.targets.map((target) =>
      target.organizationId === organizationId ? { ...target, [field]: value } : target,
    ),
  };
}

export function updateCampaignTemplate(
  campaign: BacklinkCampaign,
  channel: BacklinkTemplateChannel,
  value: string,
): BacklinkCampaign {
  return {
    ...campaign,
    templates: {
      ...campaign.templates,
      [channel]: value,
    },
  };
}
