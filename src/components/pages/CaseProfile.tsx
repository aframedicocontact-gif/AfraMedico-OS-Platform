import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  ClipboardList,
  FilePlus2,
  FileText,
  Hospital,
  MessageSquarePlus,
  Plane,
  ShieldAlert,
  Stethoscope,
  Upload,
  UserRound,
} from "lucide-react";
import { useMemo } from "react";
import type { ReactNode } from "react";
import type { AppView } from "../../app/App";
import type { CaseProfileRecord, MasterCaseStatus } from "../../types/caseProfile";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Select } from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

type CaseProfileProps = {
  caseProfile: CaseProfileRecord;
  caseProfiles: CaseProfileRecord[];
  onNavigate: (view: AppView) => void;
};

const workflowSteps = [
  "Lead",
  "Documents",
  "Medical Review",
  "Hospital Registration",
  "Hospital Quotes",
  "Decision",
  "Travel",
  "Treatment",
  "Completed",
];

const futureTabs = [
  "Medical Review",
  "Journey",
  "Communications",
  "Finance",
  "Travel",
  "Companions",
  "Analytics",
];

export function CaseProfile({ caseProfile, caseProfiles, onNavigate }: CaseProfileProps) {
  const patientCases = useMemo(() => {
    const related = caseProfiles.filter((item) => item.patientId === caseProfile.patientId);
    return related.length > 0 ? related : [caseProfile];
  }, [caseProfile, caseProfiles]);

  return (
    <div className="space-y-5">
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
        <PatientBanner caseProfile={caseProfile} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <CaseSwitcher
          activeCaseId={caseProfile.caseId}
          patientCases={patientCases}
          onNavigate={onNavigate}
        />
        <CaseProgressTracker currentStep={caseProfile.currentStep ?? inferStep(caseProfile.caseStatus)} />
      </div>

      <QuickActions />
      <FutureTabs />

      <div className="grid gap-4 xl:grid-cols-[1fr_390px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lifetime Partner</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Primary Partner" value={caseProfile.primaryPartner} />
                <Field label="Lifetime Partner Owner" value={caseProfile.lifetimePartnerOwner} />
                <Field label="First Referral Date" value={caseProfile.firstReferralDate} />
                <Field label="Ownership Status" value={<Badge tone="gold">{caseProfile.ownershipStatus}</Badge>} />
                <Field label="Commission Owner" value={caseProfile.commissionOwner} />
                <Field label="Admin Override Reason" value={caseProfile.adminOverrideReason} />
              </div>
              <ProfessionalTimeline items={caseProfile.partnerTimeline} compact />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Medical Review Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <Field label="Documents Received" value={caseProfile.medicalReview.documentsReceived} />
              <Field label="Medical Review Status" value={caseProfile.medicalReview.medicalReviewStatus} />
              <Field label="Medical Reviewer" value={caseProfile.medicalReview.medicalReviewer} />
              <Field label="Review Date" value={caseProfile.medicalReview.reviewDate} />
              <Field label="Medical Summary" value={caseProfile.medicalReview.medicalSummary} wide />
              <Field label="AI Summary Placeholder" value={caseProfile.medicalReview.aiSummaryPlaceholder} wide />
            </CardContent>
          </Card>

          <HospitalReferralsTable caseProfile={caseProfile} onNavigate={onNavigate} />
          <HospitalQuotesGrid caseProfile={caseProfile} />

          <Card>
            <CardHeader>
              <CardTitle>Case Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfessionalTimeline items={caseProfile.caseTimeline} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <TasksCard caseProfile={caseProfile} />
          <AttachedFilesCard caseProfile={caseProfile} />
          <InternalNotesCard caseProfile={caseProfile} />
          <AuditTrailCard caseProfile={caseProfile} />
        </div>
      </div>
    </div>
  );
}

function PatientBanner({ caseProfile }: { caseProfile: CaseProfileRecord }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="border-b bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 p-5 text-white">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/12 text-2xl font-semibold">
              {caseProfile.photoInitials}
            </div>
            <div>
              <p className="text-sm font-medium text-yellow-200">Case Workspace</p>
              <h2 className="mt-1 text-3xl font-semibold">{caseProfile.patientName}</h2>
              <p className="mt-2 text-sm text-emerald-100">
                {caseProfile.patientId} | {caseProfile.caseId} | {caseProfile.treatmentRequested}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <CaseStatusBadge status={caseProfile.caseStatus} />
                <Badge tone="gold">{caseProfile.priority}</Badge>
                <BooleanBadge label="Returning Patient" value={caseProfile.returningPatient} />
                {caseProfile.vipFlag ? <Badge tone="gold">VIP</Badge> : null}
                {caseProfile.riskFlag ? <Badge tone="warning">{caseProfile.riskFlag}</Badge> : null}
              </div>
            </div>
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-2 xl:min-w-[520px]">
            <BannerFact label="Coordinator" value={caseProfile.coordinator} />
            <BannerFact label="Lead Source" value={caseProfile.leadSource ?? "Not set"} />
            <BannerFact label="Referral Partner" value={caseProfile.referralPartner ?? caseProfile.primaryPartner} />
            <BannerFact label="Commission Owner" value={caseProfile.commissionOwner} />
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <InfoPill icon={<UserRound className="h-4 w-4" />} label="Age / Gender" value={`${caseProfile.age} / ${caseProfile.gender}`} />
        <InfoPill icon={<Plane className="h-4 w-4" />} label="Country" value={caseProfile.country} />
        <InfoPill icon={<BadgeCheck className="h-4 w-4" />} label="Language" value={caseProfile.preferredLanguage ?? "Not set"} />
        <InfoPill icon={<CalendarClock className="h-4 w-4" />} label="Passport" value={caseProfile.passportStatus ?? "Not set"} />
        <InfoPill icon={<FileText className="h-4 w-4" />} label="Phone" value={caseProfile.phone ?? "Not set"} />
        <InfoPill icon={<MessageSquarePlus className="h-4 w-4" />} label="WhatsApp" value={caseProfile.whatsapp ?? "Not set"} />
        <InfoPill icon={<FileText className="h-4 w-4" />} label="Email" value={caseProfile.email ?? "Not set"} />
        <InfoPill icon={<Hospital className="h-4 w-4" />} label="Destination" value={caseProfile.destinationCountry} />
        <InfoPill icon={<Stethoscope className="h-4 w-4" />} label="Condition" value={caseProfile.medicalCondition} wide />
        <InfoPill icon={<ShieldAlert className="h-4 w-4" />} label="Lifetime Partner Owner" value={caseProfile.lifetimePartnerOwner} wide />
      </div>
    </div>
  );
}

function CaseSwitcher({
  activeCaseId,
  patientCases,
  onNavigate,
}: {
  activeCaseId: string;
  patientCases: CaseProfileRecord[];
  onNavigate: (view: AppView) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Case Switcher</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select
          value={activeCaseId}
          onChange={(event) => onNavigate({ name: "case-profile", caseId: event.target.value })}
        >
          {patientCases.map((item) => (
            <option key={item.caseId} value={item.caseId}>
              {item.caseId} - {item.treatmentRequested} - {item.caseStatus.toUpperCase()}
            </option>
          ))}
        </Select>
        <div className="space-y-2">
          {patientCases.map((item) => (
            <div
              key={item.caseId}
              className={
                item.caseId === activeCaseId
                  ? "rounded-md border border-emerald-300 bg-emerald-50 p-3"
                  : "rounded-md border bg-white p-3"
              }
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-emerald-950">{item.caseId}</p>
                  <p className="text-sm text-muted-foreground">{item.treatmentRequested}</p>
                </div>
                <CaseStatusBadge status={item.caseStatus} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CaseProgressTracker({ currentStep }: { currentStep: string }) {
  const currentIndex = Math.max(workflowSteps.indexOf(currentStep), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Case Progress Tracker</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-[920px] items-start">
            {workflowSteps.map((step, index) => {
              const isComplete = index < currentIndex;
              const isCurrent = index === currentIndex;
              return (
                <div key={step} className="flex flex-1 items-start">
                  <div className="flex min-w-[96px] flex-col items-center text-center">
                    <div
                      className={
                        isComplete
                          ? "flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white"
                          : isCurrent
                            ? "flex h-9 w-9 items-center justify-center rounded-full bg-yellow-400 text-sm font-semibold text-emerald-950 ring-4 ring-yellow-100"
                            : "flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-500"
                      }
                    >
                      {index + 1}
                    </div>
                    <p className={isCurrent ? "mt-2 text-xs font-semibold text-emerald-950" : "mt-2 text-xs text-muted-foreground"}>
                      {step}
                    </p>
                  </div>
                  {index < workflowSteps.length - 1 ? (
                    <div className={isComplete ? "mt-4 h-0.5 flex-1 bg-emerald-500" : "mt-4 h-0.5 flex-1 bg-slate-200"} />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HospitalReferralsTable({
  caseProfile,
  onNavigate,
}: {
  caseProfile: CaseProfileRecord;
  onNavigate: (view: AppView) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hospital Referrals</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table className="min-w-[1120px]">
          <TableHeader>
            <TableRow className="bg-emerald-50/70">
              <TableHead>Hospital</TableHead>
              <TableHead>Coordinator</TableHead>
              <TableHead>Registration Status</TableHead>
              <TableHead>Hospital Case ID</TableHead>
              <TableHead>Quote Status</TableHead>
              <TableHead>Last Contact</TableHead>
              <TableHead>Next Follow-up</TableHead>
              <TableHead>Response Time</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {caseProfile.hospitalReferrals.length ? (
              caseProfile.hospitalReferrals.map((referral) => (
                <TableRow key={`${referral.hospital}-${referral.hospitalCaseId}`}>
                  <TableCell className="font-medium">{referral.hospital}</TableCell>
                  <TableCell>{referral.coordinator}</TableCell>
                  <TableCell>{referral.registrationStatus}</TableCell>
                  <TableCell>{referral.hospitalCaseId}</TableCell>
                  <TableCell>{referral.quoteStatus}</TableCell>
                  <TableCell>{referral.lastContact ?? "Not logged"}</TableCell>
                  <TableCell>{referral.nextFollowUp ?? referral.expectedResponse}</TableCell>
                  <TableCell>{referral.responseTime ?? "Pending"}</TableCell>
                  <TableCell>
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => onNavigate({ name: "hospital-referrals" })}
                    >
                      Open Referral
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                  No hospital referrals yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function HospitalQuotesGrid({ caseProfile }: { caseProfile: CaseProfileRecord }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hospital Quotes</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-2">
        {caseProfile.hospitalQuotes.length ? (
          caseProfile.hospitalQuotes.map((quote) => (
            <div key={`${quote.hospital}-${quote.quoteDate}`} className="rounded-md border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-emerald-950">{quote.hospital}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{quote.doctor}</p>
                </div>
                <Badge tone={quote.status === "Received" || quote.status === "Sent to Patient" || quote.status === "Accepted" ? "success" : "gold"}>
                  {quote.status}
                </Badge>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Quoted Cost" value={quote.quotedCost ? `${formatCurrency(quote.quotedCost)} ${quote.currency}` : "Pending"} />
                <Field label="Estimated Stay" value={quote.estimatedStay} />
                <Field label="Validity Date" value={quote.validityDate ?? "Pending"} />
                <Field label="Response Deadline" value={quote.responseDeadline ?? "Pending"} />
                <Field label="Coordinator" value={quote.coordinator ?? "Not assigned"} />
                <Field label="Patient Decision" value={quote.patientDecision ?? "Pending"} />
                <Field label="Notes" value={quote.notes} wide />
              </div>
              <Button className="mt-4" variant="secondary" type="button">
                Accept Placeholder
              </Button>
            </div>
          ))
        ) : (
          <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
            No hospital quotes yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActions() {
  const actions = [
    { label: "Request Medical Review", icon: <Stethoscope className="h-4 w-4" /> },
    { label: "Early Hospital Registration", icon: <Hospital className="h-4 w-4" /> },
    { label: "Add Hospital Referral", icon: <FilePlus2 className="h-4 w-4" /> },
    { label: "Request Detailed Quote", icon: <FileText className="h-4 w-4" /> },
    { label: "Upload Documents", icon: <Upload className="h-4 w-4" /> },
    { label: "Add Timeline Event", icon: <MessageSquarePlus className="h-4 w-4" /> },
    { label: "Create Task", icon: <ClipboardList className="h-4 w-4" /> },
    { label: "Create New Case", icon: <FilePlus2 className="h-4 w-4" /> },
    { label: "Open Patient Workspace", icon: <UserRound className="h-4 w-4" /> },
    { label: "Assign Coordinator", icon: <BadgeCheck className="h-4 w-4" /> },
    { label: "Request Second Opinion", icon: <Stethoscope className="h-4 w-4" /> },
    { label: "Send to AI Medical Review", icon: <ShieldAlert className="h-4 w-4" /> },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        {actions.map((action) => (
          <Button key={action.label} variant="secondary" type="button">
            {action.icon}
            {action.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

function FutureTabs() {
  return (
    <Card>
      <CardContent className="flex flex-wrap gap-2 p-3">
        {futureTabs.map((tab) => (
          <button
            key={tab}
            className="cursor-not-allowed rounded-md border bg-slate-50 px-3 py-2 text-sm text-muted-foreground"
            disabled
            type="button"
          >
            {tab} <span className="ml-2 text-[10px] uppercase tracking-wide">Coming Soon</span>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

function TasksCard({ caseProfile }: { caseProfile: CaseProfileRecord }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {caseProfile.tasks.map((task) => (
          <div key={`${task.title}-${task.dueDate}`} className="rounded-md border bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-emerald-950">{task.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {task.owner} | Due {task.dueDate}
                </p>
              </div>
              <Badge tone={task.status === "Due" ? "warning" : "muted"}>{task.status}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AttachedFilesCard({ caseProfile }: { caseProfile: CaseProfileRecord }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attached Files</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {caseProfile.attachedFiles.map((file) => (
          <div key={`${file.type}-${file.name}`} className="rounded-md border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-emerald-950">{file.type}</p>
                <p className="text-sm text-muted-foreground">{file.name}</p>
              </div>
              <Badge tone={file.verified ? "success" : "warning"}>{file.verified ? "Verified" : "Needs Review"}</Badge>
            </div>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <Field label="Category" value={file.category ?? file.type} />
              <Field label="Upload Date" value={file.uploadDate ?? file.date} />
              <Field label="OCR Status" value={file.ocrStatus ?? "Pending"} />
              <Field label="AI Extracted" value={file.aiExtracted ? "Yes" : "No"} />
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" type="button">Preview</Button>
              <Button variant="secondary" type="button">Download</Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function InternalNotesCard({ caseProfile }: { caseProfile: CaseProfileRecord }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Internal Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <NoteBlock label="Coordinator Notes" value={caseProfile.internalNotes.coordinatorNotes} />
        <NoteBlock label="Medical Notes" value={caseProfile.internalNotes.medicalNotes} />
        <NoteBlock label="Administrative Notes" value={caseProfile.internalNotes.administrativeNotes} />
      </CardContent>
    </Card>
  );
}

function AuditTrailCard({ caseProfile }: { caseProfile: CaseProfileRecord }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Trail</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {caseProfile.auditTrail.map((event) => (
          <div key={`${event.date}-${event.time}-${event.action}`} className="rounded-md border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-emerald-950">{event.action}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {event.date} {event.time} | {event.user}
                </p>
              </div>
              <Badge tone="muted">Logged</Badge>
            </div>
            <div className="mt-3 grid gap-2 text-sm">
              <Field label="Old Value" value={event.oldValue ?? "Not recorded"} />
              <Field label="New Value" value={event.newValue ?? "Not recorded"} />
              <Field label="Reason" value={event.reason} />
              <Field label="Evidence" value={event.evidence} />
            </div>
          </div>
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

function InfoPill({
  icon,
  label,
  value,
  wide,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "rounded-md bg-muted p-3 lg:col-span-2" : "rounded-md bg-muted p-3"}>
      <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-emerald-950">{value}</div>
    </div>
  );
}

function Field({ label, value, wide }: { label: string; value: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2 md:col-span-3" : undefined}>
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}

function ProfessionalTimeline({
  items,
  compact,
}: {
  items: Array<{ date: string; time?: string; user?: string; title: string; action?: string; evidence?: string; notes?: string; detail: string }>;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "space-y-2" : "space-y-4"}>
      {items.map((item) => (
        <div key={`${item.date}-${item.time}-${item.title}`} className="relative pl-7">
          <span className="absolute left-0 top-2 h-3 w-3 rounded-full bg-emerald-600 ring-4 ring-emerald-100" />
          <span className="absolute bottom-[-18px] left-[5px] top-6 w-px bg-emerald-100" />
          <div className="rounded-md border bg-white p-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-medium">{item.action ?? item.title}</p>
                <p className="text-sm text-muted-foreground">{item.title}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {item.date} {item.time ?? ""} {item.user ? `| ${item.user}` : ""}
              </p>
            </div>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <Field label="Evidence" value={item.evidence ?? "Not attached"} />
              <Field label="Notes" value={item.notes ?? item.detail} />
            </div>
          </div>
        </div>
      ))}
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

function BooleanBadge({ label, value }: { label: string; value?: boolean }) {
  return <Badge tone={value ? "success" : "muted"}>{label}: {value ? "Yes" : "No"}</Badge>;
}

function CaseStatusBadge({ status }: { status: MasterCaseStatus }) {
  const tone =
    status === "Active" || status === "Treatment Approved"
      ? "success"
      : status === "Reopened" || status === "Waiting Quotes" || status === "Travel Planned"
        ? "gold"
        : status === "Lost"
          ? "danger"
          : status === "Waiting Documents" || status === "Under Treatment" || status === "Recovery"
            ? "info"
            : "muted";

  return <Badge tone={tone}>{status}</Badge>;
}

function inferStep(status: MasterCaseStatus) {
  if (status === "Closed") return "Completed";
  if (status === "Waiting Documents") return "Documents";
  if (status === "Waiting Quotes") return "Hospital Quotes";
  if (status === "Treatment Approved") return "Decision";
  if (status === "Travel Planned") return "Travel";
  if (status === "Under Treatment" || status === "Recovery") return "Treatment";
  return "Lead";
}

function formatCurrency(value: number) {
  if (!value) {
    return "Pending";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
