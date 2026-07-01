import { buildBacklinkTemplates } from "./backlinkTemplateService";
import type {
  BacklinkCampaign,
  BacklinkCampaignTarget,
  CreateBacklinkCampaignInput,
} from "../types/backlinkCampaign";

const storageKey = "aframedico.backlinkCampaigns.records";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function readCampaigns(): BacklinkCampaign[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as BacklinkCampaign[]) : [];
  } catch {
    window.localStorage.removeItem(storageKey);
    return [];
  }
}

function writeCampaigns(campaigns: BacklinkCampaign[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(campaigns));
}

export function getBacklinkCampaigns() {
  return readCampaigns();
}

export function saveBacklinkCampaigns(campaigns: BacklinkCampaign[]) {
  writeCampaigns(campaigns);
  return campaigns;
}

export function createBacklinkCampaign(input: CreateBacklinkCampaignInput) {
  const targetDefaults = createCampaignTargets(input.targetOrganizationIds, input.targetBacklinkUrl, input.anchorText);
  const campaign: BacklinkCampaign = {
    id: createId("backlink-campaign"),
    campaignName: input.campaignName,
    targetCountry: input.targetCountry,
    treatmentFocus: input.treatmentFocus,
    campaignType: input.campaignType,
    goal: input.goal,
    targetBacklinkUrl: input.targetBacklinkUrl,
    anchorText: input.anchorText,
    priority: input.priority,
    status: input.status,
    startDate: input.startDate,
    followUpDate: input.followUpDate,
    notes: input.notes,
    targets: targetDefaults,
    templates: buildBacklinkTemplates(input),
    createdAt: today(),
    updatedAt: today(),
  };

  return saveBacklinkCampaigns([campaign, ...readCampaigns()]);
}

export function updateBacklinkCampaign(campaign: BacklinkCampaign) {
  return saveBacklinkCampaigns(
    readCampaigns().map((item) =>
      item.id === campaign.id ? { ...campaign, updatedAt: today() } : item,
    ),
  );
}

export function createCampaignTargets(
  organizationIds: string[],
  targetBacklinkUrl: string,
  anchorText: string,
): BacklinkCampaignTarget[] {
  return organizationIds.map((organizationId) => ({
    organizationId,
    outreachStatus: "Not Started",
    backlinkStatus: "Not Requested",
    requestedUrl: targetBacklinkUrl,
    targetPage: "",
    anchorText,
    dateRequested: "",
    dateWon: "",
    backlinkUrl: "",
    notes: "",
  }));
}
