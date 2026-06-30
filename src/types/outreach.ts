export type OutreachTab =
  | "Overview"
  | "Contacts"
  | "Communications"
  | "Tasks"
  | "Meetings"
  | "Documents"
  | "Notes"
  | "History";

export type PartnershipStage =
  | "Discovered"
  | "Qualified"
  | "Contacted"
  | "Meeting Scheduled"
  | "Proposal Sent"
  | "Negotiating"
  | "Agreement Signed"
  | "Active Partner"
  | "Inactive";

export type CommunicationType =
  | "Email"
  | "Phone"
  | "WhatsApp"
  | "LinkedIn"
  | "Meeting"
  | "Video Call"
  | "Conference";

export type OutreachPriority = "High" | "Medium" | "Low";
export type OutreachTaskStatus = "Open" | "In Progress" | "Waiting" | "Completed";
export type ContactStatus = "New" | "Active" | "Unresponsive" | "Left Organization";
export type PreferredCommunication = "Email" | "Phone" | "WhatsApp" | "LinkedIn";

export type OutreachContact = {
  id: string;
  organizationId: string;
  fullName: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  linkedin: string;
  decisionMaker: boolean;
  preferredCommunication: PreferredCommunication;
  status: ContactStatus;
  createdAt: string;
};

export type OutreachCommunication = {
  id: string;
  organizationId: string;
  date: string;
  type: CommunicationType;
  subject: string;
  summary: string;
  outcome: string;
  nextAction: string;
};

export type OutreachTask = {
  id: string;
  organizationId: string;
  title: string;
  assignedTo: string;
  dueDate: string;
  priority: OutreachPriority;
  status: OutreachTaskStatus;
  reminder: string;
};

export type OutreachMeeting = {
  id: string;
  organizationId: string;
  date: string;
  title: string;
  attendees: string;
  outcome: string;
  nextAction: string;
};

export type OutreachDocument = {
  id: string;
  organizationId: string;
  title: string;
  documentType: string;
  status: string;
  updatedAt: string;
};

export type OutreachNote = {
  id: string;
  organizationId: string;
  date: string;
  author: string;
  note: string;
};

export type RelationshipScores = {
  relationshipScore: number;
  responseScore: number;
  partnershipPotential: number;
  referralPotential: number;
  strategicValue: number;
};

export type OutreachTimelineEvent = {
  id: string;
  organizationId: string;
  date: string;
  type: string;
  title: string;
  detail: string;
};

export type OutreachWorkspaceRecord = {
  organizationId: string;
  partnershipStage: PartnershipStage;
  contacts: OutreachContact[];
  communications: OutreachCommunication[];
  tasks: OutreachTask[];
  meetings: OutreachMeeting[];
  documents: OutreachDocument[];
  notes: OutreachNote[];
  history: OutreachTimelineEvent[];
  updatedAt: string;
};

export type OutreachIntegrationProvider =
  | "Gmail"
  | "Outlook"
  | "Google Calendar"
  | "Microsoft Calendar"
  | "WhatsApp Business API"
  | "LinkedIn";

export type OutreachIntegrationAdapter = {
  provider: OutreachIntegrationProvider;
  isConfigured: boolean;
};
