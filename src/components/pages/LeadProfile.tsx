import { ArrowLeft, CalendarClock, Mail, MessageCircle, Phone, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import type { AppView } from "../../app/App";
import type { Lead } from "../../types/lead";
import { CaseStatusBadge, LeadPriorityBadge, LeadStatusBadge, formatCurrency } from "../leads/leadUi";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type LeadProfileProps = {
  lead: Lead;
  onNavigate: (view: AppView) => void;
};

export function LeadProfile({ lead, onNavigate }: LeadProfileProps) {
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
          <p className="text-sm font-medium text-primary">Lead Profile</p>
          <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">{lead.patientName}</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Patient {lead.patientId} | Case {lead.caseId} | {lead.interestedTreatment} inquiry from {lead.city}, {lead.country}.
          </p>
          {lead.possibleDuplicate ? (
            <Badge className="mt-3" tone="warning">
              Possible duplicate or existing patient. Case creation remains allowed.
            </Badge>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "case-profile", caseId: lead.caseId })}>
            Open Case Workspace
          </Button>
          <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "lead-pipeline" })}>
            View Pipeline
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Patient Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <Field label="Patient ID" value={lead.patientId} />
              <Field label="Date of Birth" value={lead.dateOfBirth} />
              <Field label="Country" value={lead.country} />
              <Field label="City" value={lead.city} />
              <Field label="Nationality" value={lead.nationality} />
              <Field label="Age" value={lead.age} />
              <Field label="Gender" value={lead.gender} />
              <Field label="Preferred Language" value={lead.preferredLanguage} />
              <Field label="Lead Source" value={lead.leadSource} />
              <Field label="Current Status" value={<LeadStatusBadge status={lead.currentStatus} />} />
              <Field label="Priority" value={<LeadPriorityBadge priority={lead.priority} />} />
              <Field label="Interested Treatment" value={lead.interestedTreatment} wide />
              <Field label="Medical Condition" value={lead.medicalCondition} wide />
              <Field label="Internal Notes" value={lead.internalNotes} wide />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Patient Ownership</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <Field label="Primary Partner Attribution" value={lead.primaryPartnerAttribution} />
              <Field label="First Referral Date" value={lead.firstReferralDate} />
              <Field label="Lifetime Partner Owner" value={lead.lifetimePartnerOwner} />
              <Field label="Ownership Status" value={<Badge tone="gold">{lead.ownershipStatus}</Badge>} />
              <Field label="Admin Override Reason" value={lead.adminOverrideReason || "None"} wide />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Patient Cases</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lead.patientCases.map((patientCase) => (
                <div key={patientCase.caseId} className="rounded-md border bg-white p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-emerald-950">{patientCase.caseId}</p>
                      <p className="text-sm text-muted-foreground">{patientCase.treatmentRequested}</p>
                    </div>
                    <CaseStatusBadge status={patientCase.caseStatus} />
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <Field label="Created Date" value={patientCase.createdDate} />
                    <Field label="Closed Date" value={patientCase.closedDate || "Open"} />
                    <Field label="Reopened Date" value={patientCase.reopenedDate || "Not reopened"} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Medical Travel Workflow</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <Field label="Case ID" value={lead.caseId} />
              <Field label="Case Status" value={<CaseStatusBadge status={lead.caseStatus} />} />
              <Field label="Created Date" value={lead.createdDate} />
              <Field label="Closed Date" value={lead.closedDate || "Open"} />
              <Field label="Reopened Date" value={lead.reopenedDate || "Not reopened"} />
              <Field label="Preferred Destination" value={lead.preferredDestination} />
              <Field label="Assigned Coordinator" value={lead.assignedCoordinator} />
              <Field label="Referral Partner" value={lead.referralPartner} />
              <Field label="Hospital" value={lead.hospital} />
              <Field label="Documents Received" value={lead.documentsReceived ? "Yes" : "No"} />
              <Field label="Medical Review Status" value={lead.medicalReviewStatus} />
              <Field label="Hospital Quote Status" value={lead.hospitalQuoteStatus} />
              <Field label="Estimated Treatment Cost" value={formatCurrency(lead.estimatedTreatmentCost)} />
              <Field label="Expected Travel Date" value={lead.expectedTravelDate} />
              <Field label="Related Hospital Referrals" value={lead.relatedHospitalReferrals.join(", ")} wide />
              <Field label="Related Quotes" value={lead.relatedQuotes.length ? lead.relatedQuotes.join(", ") : "None yet"} wide />
              <Field label="Related Medical Review" value={lead.relatedMedicalReview} />
              <Field label="Related Patient Journey" value={lead.relatedPatientJourney} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lead.activity.map((item) => (
                <div key={`${item.date}-${item.title}`} className="relative pl-6">
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
              <CardTitle>Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ContactLine icon={<UserRound className="h-4 w-4" />} label="Patient Name" value={lead.patientName} />
              <ContactLine icon={<Phone className="h-4 w-4" />} label="Phone" value={lead.phone} />
              <ContactLine icon={<MessageCircle className="h-4 w-4" />} label="WhatsApp" value={lead.whatsapp} />
              <ContactLine icon={<Mail className="h-4 w-4" />} label="Email" value={lead.email} />
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50/60">
            <CardHeader>
              <CardTitle>Follow-up Signal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <CalendarClock className="h-5 w-5 text-yellow-700" />
                <div>
                  <p className="text-sm text-muted-foreground">Next Follow-up</p>
                  <p className="text-xl font-semibold text-emerald-950">{lead.nextFollowUp}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Last contact: {lead.lastContact}</p>
              <Badge tone="gold">{lead.pipelineStage}</Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, wide }: { label: string; value: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "md:col-span-3" : undefined}>
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm">{value}</div>
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
      <p className="mt-2 break-words text-sm text-emerald-900">{value}</p>
    </div>
  );
}
