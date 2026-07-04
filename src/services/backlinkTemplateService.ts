import type {
  BacklinkCampaignTemplates,
  BacklinkCampaignType,
  BacklinkTemplateChannel,
} from "../types/backlinkCampaign";

const campaignTypeMessages: Record<BacklinkCampaignType, string> = {
  "Resource Page Backlink": "request inclusion as an international patient education resource",
  "Guest Article": "offer a high-quality educational article for their audience",
  "Partner Page": "request a partnership or resource listing",
  "Partner Page Listing": "request a partnership or resource listing",
  "Medical Directory": "request inclusion in a relevant healthcare directory",
  "Medical Directory Listing": "request inclusion in a relevant healthcare directory",
  "Conference": "explore conference collaboration and educational visibility",
  "Conference Collaboration": "explore conference collaboration and educational visibility",
  "University": "explore an academic resource, education, or student-facing collaboration",
  "Medical Association": "explore professional association collaboration and patient education visibility",
  "Academic Collaboration": "explore academic collaboration and patient education resources",
  "NGO Partnership": "propose an awareness partnership for patients seeking care options",
  "NGO Awareness Partnership": "propose an awareness partnership for patients seeking care options",
  "Referral Partnership": "explore a referral partnership for international patient support",
};

const channelOpeners: Record<BacklinkTemplateChannel, string> = {
  Email: "Dear team,",
  LinkedIn: "Hello,",
  Facebook: "Hello,",
  Instagram: "Hello,",
  "Contact Form": "Hello,",
};

export function buildBacklinkTemplates({
  campaignName,
  campaignType,
  goal,
  targetBacklinkUrl,
  anchorText,
  treatmentFocus,
}: {
  campaignName: string;
  campaignType: BacklinkCampaignType;
  goal: string;
  targetBacklinkUrl: string;
  anchorText: string;
  treatmentFocus: string;
}): BacklinkCampaignTemplates {
  const intent = campaignTypeMessages[campaignType];
  const context = treatmentFocus ? ` around ${treatmentFocus}` : "";
  const urlLine = targetBacklinkUrl ? ` Suggested resource URL: ${targetBacklinkUrl}.` : "";
  const anchorLine = anchorText ? ` Suggested anchor text: ${anchorText}.` : "";

  return {
    Email: `${channelOpeners.Email}\n\nI am reaching out from AfraMedico regarding ${campaignName}. We would like to ${intent}${context}. ${goal}${urlLine}${anchorLine}\n\nNothing needs to be published immediately. We would appreciate the opportunity to share the resource and confirm whether it is useful for your audience.\n\nBest regards,\nAfraMedico Growth Team`,
    LinkedIn: `${channelOpeners.LinkedIn} I am contacting you from AfraMedico about ${campaignName}. We would like to ${intent}${context}. Would you be open to reviewing a short resource or partnership note?`,
    Facebook: `${channelOpeners.Facebook} AfraMedico is exploring ${campaignType.toLowerCase()} opportunities${context}. Could you direct us to the right person to review this resource?`,
    Instagram: `${channelOpeners.Instagram} AfraMedico is preparing patient education and partnership resources${context}. Who is the best contact for reviewing this type of collaboration?`,
    "Contact Form": `${channelOpeners["Contact Form"]}\n\nAfraMedico would like to ${intent}${context}. ${goal}${urlLine}${anchorLine}\n\nPlease let us know the correct contact or review process.\n\nThank you.`,
  };
}
