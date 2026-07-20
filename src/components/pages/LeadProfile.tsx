import {
  Archive,
  ArrowLeft,
  Building2,
  CalendarClock,
  CalendarPlus,
  ClipboardList,
  FilePlus2,
  Mail,
  MessageCircle,
  NotebookPen,
  Paperclip,
  Phone,
  Save,
  Send,
  UserCheck,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import type { AppView } from "../../app/App";
import {
  createLeadNote,
  createLeadItemId,
  getLeadPipelineStage,
  updateLead,
  updateLeadWithActivity,
} from "../../services/leadService";
import type { Lead, LeadPriority, LeadStatus } from "../../types/lead";
import { CaseStatusBadge, LeadPriorityBadge, LeadStatusBadge, formatCurrency } from "../leads/leadUi";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";

const operationalStatuses: LeadStatus[] = [
  "New Lead",
  "Medical Records Requested",
  "Medical Records Received",
  "Medical Review Requested",
  "Quotation Requested",
  "Quotation Received",
  "Patient Decision",
  "Treatment Scheduled",
  "Travel Planning",
  "Completed",
  "Closed",
];

const priorityOptions: LeadPriority[] = ["Low", "Medium", "High", "Urgent"];

type LeadProfileProps = {
  lead: Lead;
  onNavigate: (view: AppView) => void;
  onLeadUpdated: (lead: Lead) => void;
};

export function LeadProfile({ lead, onNavigate, onLeadUpdated }: LeadProfileProps) {
  const [currentLead, setCurrentLead] = useState(lead);
  const [editForm, setEditForm] = useState({
    patientName: lead.patientName,
    phone: lead.phone,
    whatsapp: lead.whatsapp,
    email: lead.email,
    country: lead.country,
    city: lead.city,
    interestedTreatment: lead.interestedTreatment,
    medicalCondition: lead.medicalCondition,
  });
  const [assignmentForm, setAssignmentForm] = useState({
    coordinator: lead.assignedCoordinator,
    hospital: lead.hospital,
    referralPartner: lead.referralPartner,
  });
  const [statusValue, setStatusValue] = useState<LeadStatus>(lead.currentStatus);
  const [noteText, setNoteText] = useState("");
  const [attachmentForm, setAttachmentForm] = useState({ name: "", category: "Medical record", notes: "" });
  const [whatsAppSummary, setWhatsAppSummary] = useState("");
  const [emailForm, setEmailForm] = useState({ subject: "", summary: "" });
  const [followUpDate, setFollowUpDate] = useState(lead.nextFollowUp);
  const [actionError, setActionError] = useState("");
  const [reminderForm, setReminderForm] = useState({
    title: "",
    dueDate: lead.nextFollowUp,
    priority: lead.priority,
  });

  useEffect(() => {
    setCurrentLead(lead);
    setEditForm({
      patientName: lead.patientName,
      phone: lead.phone,
      whatsapp: lead.whatsapp,
      email: lead.email,
      country: lead.country,
      city: lead.city,
      interestedTreatment: lead.interestedTreatment,
      medicalCondition: lead.medicalCondition,
    });
    setAssignmentForm({
      coordinator: lead.assignedCoordinator,
      hospital: lead.hospital,
      referralPartner: lead.referralPartner,
    });
    setStatusValue(lead.currentStatus);
    setFollowUpDate(lead.nextFollowUp);
    setReminderForm((current) => ({ ...current, dueDate: lead.nextFollowUp, priority: lead.priority }));
  }, [lead]);

  const lastActivity = currentLead.activity[0];
  const hasCaseWorkspaceLink = Boolean(currentLead.caseId && currentLead.caseId !== "Pending case");
  const daysSinceLastContact = useMemo(() => {
    if (!currentLead.lastContact) return "Not tracked";
    const lastDate = new Date(currentLead.lastContact);
    if (Number.isNaN(lastDate.getTime())) return "Not tracked";
    const dayMs = 1000 * 60 * 60 * 24;
    return `${Math.max(0, Math.floor((Date.now() - lastDate.getTime()) / dayMs))} days`;
  }, [currentLead.lastContact]);

  async function persist(updates: Partial<Lead>, title: string, detail: string) {
    setActionError("");
    try {
      const updated = await updateLeadWithActivity(currentLead, updates, title, detail);
      setCurrentLead(updated);
      onLeadUpdated(updated);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to update Lead.");
    }
  }

  function updateStatus(status: LeadStatus, title = "Status Updated", detail = `Lead status changed to ${status}.`) {
    persist(
      {
        currentStatus: status,
        pipelineStage: getLeadPipelineStage(status),
        lastContact: today(),
      },
      title,
      detail,
    );
    setStatusValue(status);
  }

  function saveLeadEdits() {
    persist(
      {
        patientName: editForm.patientName.trim() || currentLead.patientName,
        phone: editForm.phone.trim(),
        whatsapp: editForm.whatsapp.trim(),
        email: editForm.email.trim(),
        country: editForm.country.trim() || currentLead.country,
        city: editForm.city.trim(),
        interestedTreatment: editForm.interestedTreatment.trim() || currentLead.interestedTreatment,
        medicalCondition: editForm.medicalCondition.trim(),
      },
      "Lead Edited",
      "Core intake details were updated.",
    );
  }

  function assignCoordinator() {
    const coordinator = assignmentForm.coordinator.trim() || "Unassigned";
    persist({ assignedCoordinator: coordinator }, "Coordinator Assigned", `${coordinator} is now responsible for this lead.`);
  }

  function assignHospital() {
    const hospital = assignmentForm.hospital.trim() || "Pending selection";
    persist(
      { hospital, relatedHospitalReferrals: [hospital] },
      "Hospital Assigned",
      `${hospital} was assigned as the target hospital.`,
    );
  }

  function assignReferralPartner() {
    const referralPartner = assignmentForm.referralPartner.trim();
    persist(
      {
        referralPartner,
        primaryPartnerAttribution: referralPartner || currentLead.primaryPartnerAttribution,
        lifetimePartnerOwner: referralPartner || currentLead.lifetimePartnerOwner,
      },
      "Referral Partner Assigned",
      referralPartner ? `${referralPartner} was linked to this lead.` : "Referral partner was cleared.",
    );
  }

  async function addInternalNote() {
    if (!noteText.trim()) return;
    const timestamp = new Date().toLocaleString();
    const nextNotes = [currentLead.internalNotes, `[${timestamp}] ${noteText.trim()}`].filter(Boolean).join("\n\n");
    setActionError("");
    try {
      await createLeadNote(currentLead.id, noteText.trim());
      const updated = await updateLead({ ...currentLead, internalNotes: nextNotes });
      setCurrentLead(updated);
      onLeadUpdated(updated);
      setNoteText("");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to add internal note.");
    }
  }

  function addAttachment() {
    if (!attachmentForm.name.trim()) return;
    const attachment = {
      id: createLeadItemId("lead-attachment"),
      name: attachmentForm.name.trim(),
      category: attachmentForm.category.trim() || "Document",
      notes: attachmentForm.notes.trim(),
      createdAt: new Date().toISOString(),
    };
    persist(
      { attachments: [attachment, ...(currentLead.attachments ?? [])] },
      "Attachment Added",
      `${attachment.name} was added as ${attachment.category}.`,
    );
    setAttachmentForm({ name: "", category: "Medical record", notes: "" });
  }

  function recordWhatsAppConversation() {
    const summary = whatsAppSummary.trim() || "Manual WhatsApp conversation recorded.";
    const communication = {
      id: createLeadItemId("lead-whatsapp"),
      type: "WhatsApp" as const,
      subject: "WhatsApp conversation",
      summary,
      createdAt: new Date().toISOString(),
    };
    persist(
      {
        communications: [communication, ...(currentLead.communications ?? [])],
        lastContact: today(),
      },
      "WhatsApp Sent",
      summary,
    );
    setWhatsAppSummary("");
  }

  function recordEmailConversation() {
    const subject = emailForm.subject.trim() || "Email conversation";
    const summary = emailForm.summary.trim() || "Manual email conversation recorded.";
    const communication = {
      id: createLeadItemId("lead-email"),
      type: "Email" as const,
      subject,
      summary,
      createdAt: new Date().toISOString(),
    };
    persist(
      {
        communications: [communication, ...(currentLead.communications ?? [])],
        lastContact: today(),
      },
      "Email Sent",
      `${subject}: ${summary}`,
    );
    setEmailForm({ subject: "", summary: "" });
  }

  function scheduleFollowUp() {
    if (!followUpDate) return;
    persist({ nextFollowUp: followUpDate }, "Follow-up Scheduled", `Next follow-up set for ${followUpDate}.`);
  }

  function createReminder() {
    if (!reminderForm.title.trim()) return;
    const reminder = {
      id: createLeadItemId("lead-reminder"),
      title: reminderForm.title.trim(),
      dueDate: reminderForm.dueDate,
      priority: reminderForm.priority,
      status: "Open" as const,
      createdAt: new Date().toISOString(),
    };
    persist(
      { reminders: [reminder, ...(currentLead.reminders ?? [])] },
      "Reminder Created",
      `${reminder.title} is due ${reminder.dueDate || "without a date"}.`,
    );
    setReminderForm({ title: "", dueDate: currentLead.nextFollowUp, priority: currentLead.priority });
  }

  function openWhatsApp() {
    recordWhatsAppConversation();
    const phone = currentLead.whatsapp || currentLead.phone;
    const normalized = phone.replace(/\D/g, "");
    if (normalized) window.open(`https://wa.me/${normalized}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button
            variant="ghost"
            className="-ml-3 mb-2"
            type="button"
            onClick={() => onNavigate({ name: "lead-directory" })}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <p className="text-sm font-medium text-primary">Lead Workspace</p>
          <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">{currentLead.patientName}</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Patient {currentLead.patientId} | Case {currentLead.caseId} | {currentLead.interestedTreatment} inquiry from{" "}
            {currentLead.city}, {currentLead.country}.
          </p>
          {currentLead.possibleDuplicate ? (
            <Badge className="mt-3" tone="warning">
              Possible duplicate or existing patient. Case creation remains allowed.
            </Badge>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            type="button"
            disabled={!hasCaseWorkspaceLink}
            title={hasCaseWorkspaceLink ? "Open linked Case Workspace." : "No Case has been created for this Lead yet."}
            onClick={() => hasCaseWorkspaceLink && onNavigate({ name: "case-profile", caseId: currentLead.caseId })}
          >
            Open Case Workspace
          </Button>
          <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "lead-pipeline" })}>
            View Pipeline
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => updateStatus("Medical Records Requested", "Medical Records Requested", "Patient was asked to provide medical records.")}>
            <FilePlus2 className="h-4 w-4" />
            Request Medical Records
          </Button>
          <Button variant="secondary" type="button" onClick={recordEmailConversation}>
            <Mail className="h-4 w-4" />
            Send Initial Email
          </Button>
          <Button variant="secondary" type="button" onClick={openWhatsApp}>
            <MessageCircle className="h-4 w-4" />
            Open WhatsApp
          </Button>
          <Button variant="secondary" type="button" onClick={scheduleFollowUp}>
            <CalendarPlus className="h-4 w-4" />
            Schedule Consultation
          </Button>
          <Button variant="secondary" type="button" disabled title="Patient conversion is prepared for a future sprint.">
            <UserCheck className="h-4 w-4" />
            Convert to Patient
          </Button>
          <Button variant="secondary" type="button" onClick={() => updateStatus("Closed", "Lead Archived", "Lead was archived from active intake.")}>
            <Archive className="h-4 w-4" />
            Archive Lead
          </Button>
        </CardContent>
      </Card>

      {actionError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {actionError}
        </div>
      ) : null}

      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardHeader>
          <CardTitle>Operational Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <Field label="Current Status" value={<LeadStatusBadge status={currentLead.currentStatus} />} />
          <Field label="Assigned Coordinator" value={currentLead.assignedCoordinator} />
          <Field label="Assigned Hospital" value={currentLead.hospital} />
          <Field label="Referral Partner" value={currentLead.referralPartner || "Direct / none"} />
          <Field label="Last Activity" value={lastActivity ? `${lastActivity.title} (${lastActivity.date})` : "None"} />
          <Field label="Next Follow-up" value={currentLead.nextFollowUp || "Not scheduled"} />
          <Field label="Days Since Last Contact" value={daysSinceLastContact} />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Edit Lead</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <Input value={editForm.patientName} onChange={(event) => setEditForm({ ...editForm, patientName: event.target.value })} placeholder="Patient name" />
              <Input value={editForm.country} onChange={(event) => setEditForm({ ...editForm, country: event.target.value })} placeholder="Country" />
              <Input value={editForm.city} onChange={(event) => setEditForm({ ...editForm, city: event.target.value })} placeholder="City" />
              <Input value={editForm.phone} onChange={(event) => setEditForm({ ...editForm, phone: event.target.value })} placeholder="Phone" />
              <Input value={editForm.whatsapp} onChange={(event) => setEditForm({ ...editForm, whatsapp: event.target.value })} placeholder="WhatsApp" />
              <Input value={editForm.email} onChange={(event) => setEditForm({ ...editForm, email: event.target.value })} placeholder="Email" />
              <Input value={editForm.interestedTreatment} onChange={(event) => setEditForm({ ...editForm, interestedTreatment: event.target.value })} placeholder="Interested treatment" />
              <Input value={editForm.medicalCondition} onChange={(event) => setEditForm({ ...editForm, medicalCondition: event.target.value })} placeholder="Medical condition" />
              <div className="md:col-span-2">
                <Button type="button" onClick={saveLeadEdits}>
                  <Save className="h-4 w-4" />
                  Save Lead
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Patient Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <Field label="Patient ID" value={currentLead.patientId} />
              <Field label="Date of Birth" value={currentLead.dateOfBirth} />
              <Field label="Country" value={currentLead.country} />
              <Field label="City" value={currentLead.city} />
              <Field label="Nationality" value={currentLead.nationality} />
              <Field label="Age" value={currentLead.age} />
              <Field label="Gender" value={currentLead.gender} />
              <Field label="Preferred Language" value={currentLead.preferredLanguage} />
              <Field label="Lead Source" value={currentLead.leadSource} />
              <Field label="Current Status" value={<LeadStatusBadge status={currentLead.currentStatus} />} />
              <Field label="Priority" value={<LeadPriorityBadge priority={currentLead.priority} />} />
              <Field label="Created At" value={formatTimestamp(currentLead.createdAt)} />
              <Field label="Updated At" value={formatTimestamp(currentLead.updatedAt)} />
              <Field label="Interested Treatment" value={currentLead.interestedTreatment} wide />
              <Field label="Medical Condition" value={currentLead.medicalCondition} wide />
              <Field label="Internal Notes" value={<pre className="whitespace-pre-wrap font-sans text-sm">{currentLead.internalNotes || "None yet"}</pre>} wide />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Patient Ownership</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <Field label="Primary Partner Attribution" value={currentLead.primaryPartnerAttribution} />
              <Field label="Partner Code" value={currentLead.partnerCode || "Not linked"} />
              <Field label="Source Referral ID" value={currentLead.sourceReferralId || "Not linked"} />
              <Field label="First Referral Date" value={currentLead.firstReferralDate} />
              <Field label="Lifetime Partner Owner" value={currentLead.lifetimePartnerOwner} />
              <Field label="Ownership Status" value={<Badge tone="gold">{currentLead.ownershipStatus}</Badge>} />
              <Field label="Admin Override Reason" value={currentLead.adminOverrideReason || "None"} wide />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Medical Travel Workflow</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <Field label="Case ID" value={currentLead.caseId} />
              <Field label="Case Status" value={<CaseStatusBadge status={currentLead.caseStatus} />} />
              <Field label="Created Date" value={currentLead.createdDate} />
              <Field label="Preferred Destination" value={currentLead.preferredDestination} />
              <Field label="Assigned Coordinator" value={currentLead.assignedCoordinator} />
              <Field label="Referral Partner" value={currentLead.referralPartner || "Direct / none"} />
              <Field label="Hospital" value={currentLead.hospital} />
              <Field label="Documents Received" value={currentLead.documentsReceived ? "Yes" : "No"} />
              <Field label="Medical Review Status" value={currentLead.medicalReviewStatus} />
              <Field label="Hospital Quote Status" value={currentLead.hospitalQuoteStatus} />
              <Field label="Estimated Treatment Cost" value={formatCurrency(currentLead.estimatedTreatmentCost)} />
              <Field label="Expected Travel Date" value={currentLead.expectedTravelDate} />
              <Field label="Related Hospital Referrals" value={currentLead.relatedHospitalReferrals.join(", ")} wide />
              <Field label="Related Quotes" value={currentLead.relatedQuotes.length ? currentLead.relatedQuotes.join(", ") : "None yet"} wide />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentLead.activity.map((item, index) => (
                <div key={`${item.date}-${item.title}-${index}`} className="relative pl-6">
                  <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-600 ring-4 ring-emerald-100" />
                  <div className="rounded-md border bg-white p-3">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.date}</p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assignments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ActionInput icon={<UserCheck className="h-4 w-4" />} label="Coordinator" value={assignmentForm.coordinator} onChange={(value) => setAssignmentForm({ ...assignmentForm, coordinator: value })} onSave={assignCoordinator} />
              <ActionInput icon={<Building2 className="h-4 w-4" />} label="Hospital" value={assignmentForm.hospital} onChange={(value) => setAssignmentForm({ ...assignmentForm, hospital: value })} onSave={assignHospital} />
              <ActionInput icon={<UserRound className="h-4 w-4" />} label="Referral Partner" value={assignmentForm.referralPartner} onChange={(value) => setAssignmentForm({ ...assignmentForm, referralPartner: value })} onSave={assignReferralPartner} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <select className="h-9 w-full rounded-md border bg-white px-3 text-sm" value={statusValue} onChange={(event) => setStatusValue(event.target.value as LeadStatus)}>
                {[...new Set([currentLead.currentStatus, ...operationalStatuses])].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <Button type="button" onClick={() => updateStatus(statusValue)}>
                <ClipboardList className="h-4 w-4" />
                Update Status
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea className="min-h-24 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="Add coordinator, clinical, or operational note" />
              <Button type="button" onClick={addInternalNote}>
                <NotebookPen className="h-4 w-4" />
                Add Note
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input value={attachmentForm.name} onChange={(event) => setAttachmentForm({ ...attachmentForm, name: event.target.value })} placeholder="Document name" />
              <Input value={attachmentForm.category} onChange={(event) => setAttachmentForm({ ...attachmentForm, category: event.target.value })} placeholder="Category" />
              <Input value={attachmentForm.notes} onChange={(event) => setAttachmentForm({ ...attachmentForm, notes: event.target.value })} placeholder="Notes" />
              <Button type="button" onClick={addAttachment}>
                <Paperclip className="h-4 w-4" />
                Add Attachment
              </Button>
              <ListItems items={currentLead.attachments ?? []} render={(item) => `${item.name} | ${item.category}`} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Communications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea className="min-h-20 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" value={whatsAppSummary} onChange={(event) => setWhatsAppSummary(event.target.value)} placeholder="WhatsApp conversation summary" />
              <Button variant="secondary" type="button" onClick={recordWhatsAppConversation}>
                <MessageCircle className="h-4 w-4" />
                Record WhatsApp
              </Button>
              <Input value={emailForm.subject} onChange={(event) => setEmailForm({ ...emailForm, subject: event.target.value })} placeholder="Email subject" />
              <textarea className="min-h-20 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" value={emailForm.summary} onChange={(event) => setEmailForm({ ...emailForm, summary: event.target.value })} placeholder="Email summary" />
              <Button variant="secondary" type="button" onClick={recordEmailConversation}>
                <Send className="h-4 w-4" />
                Record Email
              </Button>
              <ListItems items={currentLead.communications ?? []} render={(item) => `${item.type}: ${item.subject}`} />
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50/60">
            <CardHeader>
              <CardTitle>Follow-up and Reminders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <CalendarClock className="h-5 w-5 text-yellow-700" />
                <div>
                  <p className="text-sm text-muted-foreground">Next Follow-up</p>
                  <p className="text-xl font-semibold text-emerald-950">{currentLead.nextFollowUp || "Not scheduled"}</p>
                </div>
              </div>
              <Input type="date" value={followUpDate} onChange={(event) => setFollowUpDate(event.target.value)} />
              <Button type="button" onClick={scheduleFollowUp}>
                <CalendarPlus className="h-4 w-4" />
                Schedule Follow-up
              </Button>
              <Input value={reminderForm.title} onChange={(event) => setReminderForm({ ...reminderForm, title: event.target.value })} placeholder="Reminder title" />
              <Input type="date" value={reminderForm.dueDate} onChange={(event) => setReminderForm({ ...reminderForm, dueDate: event.target.value })} />
              <select className="h-9 w-full rounded-md border bg-white px-3 text-sm" value={reminderForm.priority} onChange={(event) => setReminderForm({ ...reminderForm, priority: event.target.value as LeadPriority })}>
                {priorityOptions.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
              <Button variant="secondary" type="button" onClick={createReminder}>
                Create Reminder
              </Button>
              <ListItems items={currentLead.reminders ?? []} render={(item) => `${item.title} | ${item.dueDate || "No date"} | ${item.status}`} />
              <Badge tone="gold">{currentLead.pipelineStage}</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ContactLine icon={<UserRound className="h-4 w-4" />} label="Patient Name" value={currentLead.patientName} />
              <ContactLine icon={<Phone className="h-4 w-4" />} label="Phone" value={currentLead.phone} />
              <ContactLine icon={<MessageCircle className="h-4 w-4" />} label="WhatsApp" value={currentLead.whatsapp} />
              <ContactLine icon={<Mail className="h-4 w-4" />} label="Email" value={currentLead.email} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatTimestamp(value?: string) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function Field({ label, value, wide }: { label: string; value: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "md:col-span-3" : undefined}>
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}

function ActionInput({
  icon,
  label,
  value,
  onChange,
  onSave,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
}) {
  return (
    <div className="rounded-md border p-3">
      <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
        {icon}
        {label}
      </p>
      <div className="flex gap-2">
        <Input value={value} onChange={(event) => onChange(event.target.value)} />
        <Button type="button" onClick={onSave}>
          Save
        </Button>
      </div>
    </div>
  );
}

function ContactLine({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-2 break-words text-sm text-emerald-900">{value || "Not found"}</p>
    </div>
  );
}

function ListItems<T>({ items, render }: { items: T[]; render: (item: T) => string }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">None yet.</p>;

  return (
    <div className="space-y-2">
      {items.slice(0, 4).map((item, index) => (
        <div key={index} className="rounded-md border bg-white p-2 text-xs text-muted-foreground">
          {render(item)}
        </div>
      ))}
    </div>
  );
}
