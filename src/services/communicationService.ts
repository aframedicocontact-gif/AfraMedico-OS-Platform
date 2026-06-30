import { addOutreachCommunication } from "./outreachService";
import type { OutreachCommunication, OutreachIntegrationAdapter, OutreachWorkspaceRecord } from "../types/outreach";

export const outreachIntegrationAdapters: OutreachIntegrationAdapter[] = [
  { provider: "Gmail", isConfigured: false },
  { provider: "Outlook", isConfigured: false },
  { provider: "Google Calendar", isConfigured: false },
  { provider: "Microsoft Calendar", isConfigured: false },
  { provider: "WhatsApp Business API", isConfigured: false },
  { provider: "LinkedIn", isConfigured: false },
];

export function recordLocalCommunication(
  workspace: OutreachWorkspaceRecord,
  communication: Omit<OutreachCommunication, "id" | "organizationId">,
) {
  return addOutreachCommunication(workspace, communication);
}
