import {
  ArrowLeft,
  BadgeCheck,
  Bot,
  ClipboardCheck,
  FileQuestion,
  FileSearch,
  Hospital,
  MessageSquareReply,
  Send,
  Stethoscope,
  UserCheck,
} from "lucide-react";
import type { ReactNode } from "react";
import type { AppView } from "../../app/App";
import type { MedicalReviewRecord } from "../../types/medicalReview";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type MedicalReviewWorkspaceProps = {
  review: MedicalReviewRecord;
  onNavigate: (view: AppView) => void;
};

const futurePlaceholders = [
  "AI Diagnosis",
  "Tumor Board",
  "MDT Review",
  "Radiology AI",
  "Pathology AI",
  "Clinical Guidelines",
];

const destinationOptions = ["Turkey", "Germany", "India", "Thailand", "South Korea", "Other"];

export function MedicalReviewWorkspace({ review, onNavigate }: MedicalReviewWorkspaceProps) {
  return (
    <div className="space-y-5">
      <div>
        <Button
          variant="ghost"
          className="-ml-3 mb-2"
          type="button"
          onClick={() => onNavigate({ name: "medical-review-queue" })}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <ReviewBanner review={review} />
      </div>

      <Card className="border-emerald-200 bg-emerald-50/70">
        <CardContent className="p-4">
          <p className="font-semibold text-emerald-950">Separate protection from clinical packaging.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Early Hospital Registration can happen before this review to protect commission rights. This workspace prepares the full clinical package required before detailed quote requests.
          </p>
        </CardContent>
      </Card>

      <QuickActions onNavigate={onNavigate} review={review} />
      <FuturePlaceholders />

      <div className="grid gap-4 xl:grid-cols-[1fr_390px]">
        <div className="space-y-4">
          <ClinicalSummary review={review} />
          <MedicalDocuments review={review} />
          <AiMedicalSummary review={review} />
          <ClinicalRecommendation review={review} />
          <HospitalRecommendations review={review} />
          <ReviewTimeline review={review} />
        </div>

        <div className="space-y-4">
          <MissingDocuments review={review} />
          <DestinationRecommendation review={review} />
          <ReviewOutcome review={review} />
          <InternalNotes review={review} />
        </div>
      </div>
    </div>
  );
}

function ReviewBanner({ review }: { review: MedicalReviewRecord }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="border-b bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 p-5 text-white">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-yellow-200">Medical Review Center</p>
            <h2 className="mt-1 text-3xl font-semibold">{review.patientName}</h2>
            <p className="mt-2 text-sm text-emerald-100">
              {review.id} | {review.caseId} | {review.treatment}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge status={review.status} />
              <PriorityBadge priority={review.priority} />
              <Badge tone="info">{review.country}</Badge>
              <Badge tone="gold">{review.outcome}</Badge>
            </div>
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-2 lg:min-w-[520px]">
            <BannerFact label="Assigned Reviewer" value={review.assignedReviewer} />
            <BannerFact label="Coordinator" value={review.coordinator} />
            <BannerFact label="Submission Date" value={review.submissionDate} />
            <BannerFact label="Review Time" value={`${review.reviewTimeHours}h`} />
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoPill label="Patient ID" value={review.patientId} />
        <InfoPill label="Age / Gender" value={`${review.age} / ${review.gender}`} />
        <InfoPill label="Case ID" value={review.caseId} />
        <InfoPill label="Treatment" value={review.treatment} />
      </div>
    </div>
  );
}

function ClinicalSummary({ review }: { review: MedicalReviewRecord }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Clinical Intake Summary</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <Field label="Patient Summary" value={review.patientSummary} wide />
        <Field label="Case Summary" value={review.caseSummary} wide />
        <Field label="Diagnosis" value={review.diagnosis} />
        <Field label="Chief Complaint" value={review.chiefComplaint} />
        <Field label="Medical History" value={review.medicalHistory} wide />
        <Field label="Current Medications" value={review.currentMedications} />
        <Field label="Allergies" value={review.allergies} />
        <Field label="Vital Information" value={review.vitalInformation} wide />
      </CardContent>
    </Card>
  );
}

function MedicalDocuments({ review }: { review: MedicalReviewRecord }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Medical Documents</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {review.documents.map((document) => (
          <div key={`${document.category}-${document.fileName}`} className="rounded-md border bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-emerald-950">{document.category}</p>
                <p className="mt-1 text-sm text-muted-foreground">{document.fileName}</p>
              </div>
              <DocumentBadge status={document.status} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Uploaded: {document.uploadDate}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AiMedicalSummary({ review }: { review: MedicalReviewRecord }) {
  return (
    <Card className="border-yellow-200 bg-gradient-to-br from-white to-yellow-50">
      <CardHeader>
        <CardTitle>AI Medical Summary</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        <ListBlock title="Key Findings" items={review.aiSummary.keyFindings} />
        <Field label="Possible Diagnosis" value={review.aiSummary.possibleDiagnosis} />
        <ListBlock title="Red Flags" items={review.aiSummary.redFlags} danger />
        <ListBlock title="Missing Information" items={review.aiSummary.missingInformation} />
        <ListBlock title="Suggested Questions" items={review.aiSummary.suggestedQuestions} wide />
      </CardContent>
    </Card>
  );
}

function MissingDocuments({ review }: { review: MedicalReviewRecord }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Missing Documents Checklist</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {review.missingDocuments.map((item) => (
          <div key={item.item} className="flex items-center justify-between gap-3 rounded-md border bg-white p-3">
            <span className="text-sm font-medium text-emerald-950">{item.item}</span>
            <DocumentBadge status={item.status} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ClinicalRecommendation({ review }: { review: MedicalReviewRecord }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Clinical Recommendation</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <Field label="Suggested Treatment" value={review.clinicalRecommendation.suggestedTreatment} />
        <Field label="Suggested Specialty" value={review.clinicalRecommendation.suggestedSpecialty} />
        <Field label="Urgency" value={<PriorityBadge priority={review.clinicalRecommendation.urgency} />} />
        <Field label="Estimated Timeline" value={review.clinicalRecommendation.estimatedTimeline} />
      </CardContent>
    </Card>
  );
}

function DestinationRecommendation({ review }: { review: MedicalReviewRecord }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Destination Recommendation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {destinationOptions.map((country) => {
          const selected = review.destinationRecommendation.recommendedCountries.includes(country);
          return (
            <div key={country} className={selected ? "rounded-md border border-emerald-200 bg-emerald-50 p-3" : "rounded-md border bg-white p-3"}>
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-emerald-950">{country}</span>
                <Badge tone={selected ? "success" : "muted"}>{selected ? "Recommended" : "Option"}</Badge>
              </div>
            </div>
          );
        })}
        <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">{review.destinationRecommendation.reason}</p>
      </CardContent>
    </Card>
  );
}

function HospitalRecommendations({ review }: { review: MedicalReviewRecord }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hospital Recommendation</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {review.hospitalRecommendations.map((item) => (
          <div key={item.hospital} className="rounded-md border bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-emerald-950">{item.hospital}</p>
                <p className="mt-2 text-sm text-muted-foreground">{item.reason}</p>
              </div>
              <PriorityBadge priority={item.priority} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ReviewOutcome({ review }: { review: MedicalReviewRecord }) {
  return (
    <Card className="border-emerald-100">
      <CardHeader>
        <CardTitle>Medical Review Outcome</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border bg-emerald-950 p-4 text-white">
          <p className="text-sm text-emerald-100">Current outcome</p>
          <p className="mt-2 text-2xl font-semibold">{review.outcome}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewTimeline({ review }: { review: MedicalReviewRecord }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {review.timeline.map((event) => (
          <div key={`${event.date}-${event.time}-${event.action}`} className="relative pl-7">
            <span className="absolute left-0 top-2 h-3 w-3 rounded-full bg-emerald-600 ring-4 ring-emerald-100" />
            <div className="rounded-md border bg-white p-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium text-emerald-950">{event.action}</p>
                  <p className="text-sm text-muted-foreground">{event.notes}</p>
                </div>
                <p className="text-xs text-muted-foreground">{event.date} {event.time} | {event.user}</p>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">Evidence: {event.evidence}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function InternalNotes({ review }: { review: MedicalReviewRecord }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Internal Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <NoteBlock label="Reviewer Notes" value={review.internalNotes.reviewerNotes} />
        <NoteBlock label="Coordinator Notes" value={review.internalNotes.coordinatorNotes} />
        <NoteBlock label="Manager Notes" value={review.internalNotes.managerNotes} />
      </CardContent>
    </Card>
  );
}

function QuickActions({ review, onNavigate }: { review: MedicalReviewRecord; onNavigate: (view: AppView) => void }) {
  const actions = [
    { label: "Request Missing Documents", icon: <FileQuestion className="h-4 w-4" /> },
    { label: "Assign Reviewer", icon: <UserCheck className="h-4 w-4" /> },
    { label: "Generate AI Summary", icon: <Bot className="h-4 w-4" /> },
    { label: "Approve Review", icon: <BadgeCheck className="h-4 w-4" /> },
    { label: "Send Hospital-Ready Package", icon: <Send className="h-4 w-4" /> },
    { label: "Return to Lead Team", icon: <MessageSquareReply className="h-4 w-4" /> },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="secondary"
            type="button"
            onClick={
              action.label === "Send Hospital-Ready Package"
                ? () => onNavigate({ name: "case-profile", caseId: review.caseId })
                : undefined
            }
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

function FuturePlaceholders() {
  return (
    <Card>
      <CardContent className="flex flex-wrap gap-2 p-3">
        {futurePlaceholders.map((item) => (
          <button
            key={item}
            className="cursor-not-allowed rounded-md border bg-slate-50 px-3 py-2 text-sm text-muted-foreground"
            disabled
            type="button"
          >
            {item} <span className="ml-2 text-[10px] uppercase tracking-wide">Future</span>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

function BannerFact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-md border border-white/15 bg-white/10 p-3">
      <p className="text-xs font-medium uppercase text-emerald-100">{label}</p>
      <div className="mt-1 font-medium text-white">{value}</div>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-md bg-muted p-3">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-medium text-emerald-950">{value}</div>
    </div>
  );
}

function Field({ label, value, wide }: { label: string; value: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "md:col-span-2" : undefined}>
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm text-emerald-950">{value}</div>
    </div>
  );
}

function ListBlock({ title, items, danger, wide }: { title: string; items: string[]; danger?: boolean; wide?: boolean }) {
  return (
    <div className={wide ? "lg:col-span-2" : undefined}>
      <p className="text-xs font-medium uppercase text-muted-foreground">{title}</p>
      <div className="mt-2 space-y-2">
        {items.map((item) => (
          <div key={item} className="rounded-md border bg-white p-2 text-sm text-emerald-950">
            <span className={danger ? "text-rose-700" : undefined}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NoteBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-white p-3">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm text-muted-foreground">{value}</p>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: MedicalReviewRecord["priority"] }) {
  const tone = priority === "Urgent" ? "danger" : priority === "High" ? "warning" : priority === "Medium" ? "gold" : "muted";
  return <Badge tone={tone}>{priority}</Badge>;
}

function StatusBadge({ status }: { status: MedicalReviewRecord["status"] }) {
  const tone =
    status === "Completed" || status === "Ready for Referral"
      ? "success"
      : status === "Under Review"
        ? "info"
        : status === "Waiting for Documents"
          ? "warning"
          : "muted";
  return <Badge tone={tone}>{status}</Badge>;
}

function DocumentBadge({ status }: { status: "Received" | "Missing" | "Requested" }) {
  const tone = status === "Received" ? "success" : status === "Requested" ? "warning" : "danger";
  return <Badge tone={tone}>{status}</Badge>;
}
