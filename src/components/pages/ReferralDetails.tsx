import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import type { AppView } from "../../app/App";
import type { ProtectedReferralCase } from "../../types/referralProtection";
import {
  OwnershipBadge,
  ProtectionCaseStatusBadge,
  QuoteBadge,
  RegistrationBadge,
  formatCurrency,
} from "../protection/protectionUi";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type ReferralDetailsProps = {
  protectionCase: ProtectedReferralCase;
  onNavigate: (view: AppView) => void;
};

export function ReferralDetails({ protectionCase, onNavigate }: ReferralDetailsProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button
            variant="ghost"
            className="-ml-3 mb-2"
            type="button"
            onClick={() => onNavigate({ name: "hospital-referrals" })}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <p className="text-sm font-medium text-primary">Referral Protection Case</p>
          <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">{protectionCase.patientName}</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Patient {protectionCase.patientId} | Case {protectionCase.caseId} | {protectionCase.treatment} | Patient created {protectionCase.patientCreatedDate}
          </p>
          {protectionCase.possibleDuplicate ? (
            <Badge className="mt-3" tone="warning">
              Possible duplicate detected. Registration remains allowed; review ownership separately.
            </Badge>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "case-profile", caseId: protectionCase.caseId })}>
            Open Case Workspace
          </Button>
          <OwnershipBadge ownership={protectionCase.ownership} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Commission Protection</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <Field label="Patient ID" value={protectionCase.patientId} />
              <Field label="Case ID" value={protectionCase.caseId} />
              <Field label="Date of Birth" value={protectionCase.dateOfBirth} />
              <Field label="Case Status" value={<ProtectionCaseStatusBadge status={protectionCase.caseStatus} />} />
              <Field label="Destination" value={protectionCase.destination} />
              <Field label="Medical Condition" value={protectionCase.medicalCondition} />
              <Field label="Created Date" value={protectionCase.createdDate} />
              <Field label="Closed Date" value={protectionCase.closedDate || "Open"} />
              <Field label="Reopened Date" value={protectionCase.reopenedDate || "Not reopened"} />
              <Field label="Primary Partner Attribution" value={protectionCase.primaryPartnerAttribution} />
              <Field label="First Referral Date" value={protectionCase.firstReferralDate} />
              <Field label="Lifetime Partner Owner" value={protectionCase.lifetimePartnerOwner} />
              <Field label="Commission Owner" value={protectionCase.currentCommissionOwner} />
              <Field label="Referral Ownership" value={<OwnershipBadge ownership={protectionCase.ownership} />} />
              <Field label="Partner Notified" value={protectionCase.partnerNotified ? "Yes" : "No"} />
              <Field label="Commission Conflict" value={protectionCase.conflict ? "Yes" : "No"} />
              <Field label="Partner Attempts Preserved" value={protectionCase.partnerAttempts.length} />
              <Field label="Hospital Referrals Preserved" value={protectionCase.hospitalReferrals.length} />
              <Field label="Related Quotes" value={protectionCase.relatedQuotes.join(", ")} />
              <Field label="Related Medical Review" value={protectionCase.relatedMedicalReview} />
              <Field label="Related Patient Journey" value={protectionCase.relatedPatientJourney} />
              <Field label="Admin Override Reason" value={protectionCase.adminOverrideReason || "None"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Partner Referral Attempts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {protectionCase.partnerAttempts.map((attempt) => (
                <div key={attempt.id} className="rounded-md border bg-white p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-emerald-950">{attempt.partner}</p>
                      <p className="text-sm text-muted-foreground">
                        {attempt.referralDate} via {attempt.channel}
                      </p>
                    </div>
                    <OwnershipBadge ownership={attempt.ownership} />
                  </div>
                  <EvidenceList items={attempt.evidence} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hospital Referral History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {protectionCase.hospitalReferrals.map((referral) => (
                <div key={referral.id} className="rounded-md border bg-white p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-medium text-emerald-950">{referral.hospital}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Case ID: {referral.hospitalCaseId} | Contact: {referral.contactPerson}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <RegistrationBadge status={referral.registrationStatus} />
                      <QuoteBadge status={referral.quoteStatus} />
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <Field label="Referral Date" value={referral.referralDate} />
                    <Field label="Registration Date" value={referral.registrationDate} />
                    <Field label="Coordinator" value={referral.coordinator} />
                    <Field label="Treatment Cost" value={formatCurrency(referral.treatmentCost)} />
                  </div>
                  <EvidenceList items={referral.evidence} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-yellow-200 bg-yellow-50/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-yellow-700" />
                Protection Principle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Duplicate detection never blocks registration.</p>
              <p>Every partner attempt, hospital registration, evidence record, and manager decision remains preserved.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Commission Decisions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {protectionCase.commissionDecisions.map((decision) => (
                <div key={decision.id} className="rounded-md border p-3">
                  <p className="font-medium text-emerald-950">{decision.commissionOwner}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{decision.reason}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {decision.decisionDate} by {decision.decisionBy}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Case Audit Trail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {protectionCase.auditTrail.map((event) => (
                <div key={event.id} className="rounded-md border p-3">
                  <p className="font-medium text-emerald-950">{event.action}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {event.date} {event.time} | {event.user}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{event.notes}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}

function EvidenceList({ items }: { items: Array<{ id: string; type: string; label: string; date: string; notes: string }> }) {
  return (
    <div className="mt-4 grid gap-2">
      {items.map((item) => (
        <div key={item.id} className="rounded-md bg-muted p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-emerald-800" />
              {item.label}
            </p>
            <Badge tone="info">{item.type}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{item.date} | {item.notes}</p>
        </div>
      ))}
    </div>
  );
}
