import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  ClipboardList,
  FileClock,
  FolderOpen,
  Link2,
  MessageSquare,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";
import type { AppView } from "../../app/App";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export type UnifiedTimelineEvent = {
  timestamp: string;
  user: string;
  department: string;
  status: string;
};

export type UnifiedTask = {
  title: string;
  owner: string;
  priority: string;
  deadline: string;
  status: string;
  module: string;
  relatedCase: string;
};

export type UnifiedCaseContext = {
  patientName: string;
  patientId: string;
  caseId: string;
  currentTreatment: string;
  country: string;
  priority: string;
  urgency: string;
  partner: string;
  assignedCoordinator: string;
  assignedClinicalReviewer: string;
  currentHospital: string;
  currentStage: string;
  clinicalReadinessScore: number;
  hospital: string;
  patientSummary: string;
  timelineSummary: string;
  openTasks: number;
  unreadCommunications: number;
  upcomingDeadlines: string[];
  badges: {
    emergency: boolean;
    vip: boolean;
    partnerProtected: boolean;
    duplicateFlag: boolean;
    lowBenefitTravel: boolean;
    pendingDocuments: boolean;
  };
  timeline: UnifiedTimelineEvent[];
  tasks: UnifiedTask[];
  reviewId?: string;
};

type UnifiedPatientContextProps = {
  context: UnifiedCaseContext;
  collapsed: boolean;
  currentView: AppView["name"];
  onNavigate: (view: AppView) => void;
  onToggleSidebar: () => void;
};

const journeyStages = [
  "Lead",
  "Referral Protection",
  "Clinical Decision",
  "Hospital Package",
  "Hospital MSO",
  "Quotation",
  "Patient Decision",
  "Travel Preparation",
  "Travel",
  "Treatment",
  "Discharge",
  "Follow-up",
] as const;

export function PatientContextBar({ context }: { context: UnifiedCaseContext }) {
  const facts = [
    ["Patient", context.patientName],
    ["Patient ID", context.patientId],
    ["Case ID", context.caseId],
    ["Treatment", context.currentTreatment],
    ["Country", context.country],
    ["Partner", context.partner],
    ["Coordinator", context.assignedCoordinator],
    ["Reviewer", context.assignedClinicalReviewer],
    ["Hospital", context.currentHospital],
    ["Stage", context.currentStage],
  ];

  return (
    <Card className="max-w-full overflow-hidden border-emerald-100">
      <CardContent className="p-4">
        <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-950 text-sm font-semibold text-white">
              {initials(context.patientName)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-emerald-950">{context.patientName}</p>
              <div className="mt-1 flex flex-wrap gap-2">
                <PriorityBadge value={context.priority} />
                <UrgencyBadge value={context.urgency} />
                <Badge tone={context.clinicalReadinessScore >= 80 ? "success" : "warning"}>
                  Readiness {context.clinicalReadinessScore}%
                </Badge>
              </div>
            </div>
          </div>
          <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
            {facts.slice(1).map(([label, value]) => (
              <ContextFact key={label} label={label} value={value} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CaseHeader({ context }: { context: UnifiedCaseContext }) {
  const badges = [
    ["Emergency", context.badges.emergency, "danger"],
    ["VIP", context.badges.vip, "gold"],
    ["Partner Protected", context.badges.partnerProtected, "success"],
    ["Duplicate Flag", context.badges.duplicateFlag, "warning"],
    ["Low Benefit Travel", context.badges.lowBenefitTravel, "warning"],
    ["Pending Documents", context.badges.pendingDocuments, "info"],
  ] as const;

  return (
    <Card className="max-w-full overflow-hidden">
      <CardContent className="flex flex-col gap-3 p-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase text-muted-foreground">Case Header</p>
          <h2 className="mt-1 break-words text-lg font-semibold text-emerald-950">
            {context.patientName} | {context.caseId} | {context.currentTreatment}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {context.country} | {context.hospital} | {context.currentStage}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {badges.filter(([, active]) => active).map(([label, , tone]) => (
            <Badge key={label} tone={tone}>{label}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function CaseJourneyTracker({ context }: { context: UnifiedCaseContext }) {
  const currentIndex = journeyStages.findIndex((stage) => stage === context.currentStage);
  const stageIndex = currentIndex >= 0 ? currentIndex : 2;

  return (
    <Card className="max-w-full overflow-hidden">
      <CardContent className="max-w-full overflow-x-auto p-4">
        <div className="flex w-max min-w-full items-center gap-2">
          {journeyStages.map((stage, index) => {
            const completed = index < stageIndex;
            const current = index === stageIndex;
            const emergency = context.badges.emergency && current;
            return (
              <div key={stage} className="flex w-28 shrink-0 items-center gap-2">
                <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <div
                    className={
                      emergency
                        ? "flex h-8 w-8 items-center justify-center rounded-full bg-rose-600 text-white"
                        : completed
                          ? "flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white"
                          : current
                            ? "flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-emerald-950"
                            : "flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500"
                    }
                  >
                    {completed ? <CheckCircle2 className="h-4 w-4" /> : current ? <AlertTriangle className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
                  </div>
                  <span className="text-center text-xs font-medium text-emerald-950">{stage}</span>
                </div>
                {index < journeyStages.length - 1 ? <div className={completed ? "h-px w-6 bg-emerald-300" : "h-px w-6 bg-slate-200"} /> : null}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function NextActionPanel({ context }: { context: UnifiedCaseContext }) {
  return (
    <Card className="max-w-full overflow-hidden border-yellow-200 bg-yellow-50/40">
      <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <ClipboardList className="mt-0.5 h-5 w-5 text-yellow-700" />
          <div>
            <p className="text-xs font-medium uppercase text-yellow-900">Next Required Action</p>
            <p className="mt-1 font-semibold text-emerald-950">{nextRequiredAction(context)}</p>
          </div>
        </div>
        <Badge tone={context.badges.emergency ? "danger" : "gold"}>{context.currentStage}</Badge>
      </CardContent>
    </Card>
  );
}

export function RelatedModuleShortcuts({
  context,
  onNavigate,
}: {
  context: UnifiedCaseContext;
  onNavigate: (view: AppView) => void;
}) {
  const reviewId = context.reviewId ?? "MRV-2026-000001";
  const shortcuts: Array<{ label: string; view?: AppView }> = [
    { label: "Case Workspace", view: { name: "case-profile", caseId: context.caseId } },
    { label: "Clinical Decision", view: { name: "clinical-review-workspace", reviewId } },
    { label: "Hospital Referrals", view: { name: "hospital-referrals" } },
    { label: "Hospital Quotes", view: { name: "case-profile", caseId: context.caseId } },
    { label: "Referral Protection", view: { name: "referral-details", caseId: "PRC-001" } },
    { label: "Documents", view: { name: "clinical-document-review", reviewId } },
    { label: "Timeline", view: { name: "case-profile", caseId: context.caseId } },
    { label: "Tasks" },
    { label: "Communications" },
    { label: "Travel" },
    { label: "Finance" },
    { label: "Treatment Journey" },
    { label: "Follow-up" },
  ];

  return (
    <Card className="max-w-full overflow-hidden">
      <CardContent className="flex max-w-full gap-2 overflow-x-auto p-3">
        {shortcuts.map((shortcut) => (
          <Button
            key={shortcut.label}
            className="shrink-0"
            disabled={!shortcut.view}
            variant="secondary"
            type="button"
            onClick={shortcut.view ? () => onNavigate(shortcut.view as AppView) : undefined}
          >
            <Link2 className="h-4 w-4" />
            {shortcut.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

export function UnifiedTimeline({ events }: { events: UnifiedTimelineEvent[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Unified Timeline</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {events.slice(0, 6).map((event) => (
          <div key={`${event.timestamp}-${event.status}`} className="rounded-md border bg-white p-3">
            <p className="text-sm font-semibold text-emerald-950">{event.status}</p>
            <p className="mt-1 text-xs text-muted-foreground">{event.timestamp} | {event.user} | {event.department}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function UnifiedTaskPanel({ tasks }: { tasks: UnifiedTask[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Open Tasks</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {tasks.slice(0, 5).map((task) => (
          <div key={`${task.relatedCase}-${task.title}`} className="rounded-md border bg-white p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-emerald-950">{task.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{task.owner} | {task.module} | {task.deadline}</p>
              </div>
              <Badge tone={task.priority === "Urgent" ? "danger" : task.priority === "High" ? "warning" : "muted"}>{task.priority}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Open", "Complete", "Assign"].map((label) => (
                <Button key={label} variant="secondary" type="button">{label}</Button>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function RightCaseSidebar({
  collapsed,
  context,
  onToggle,
}: {
  collapsed: boolean;
  context: UnifiedCaseContext;
  onToggle: () => void;
}) {
  if (collapsed) {
    return (
      <aside className="hidden xl:block">
        <Button className="sticky top-24" variant="secondary" type="button" onClick={onToggle}>
          <ChevronLeft className="h-4 w-4" />
          Case Info
        </Button>
      </aside>
    );
  }

  return (
    <aside className="space-y-4 xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto">
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Case Intelligence</CardTitle>
            <Button variant="ghost" type="button" onClick={onToggle}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-5">
          <SidebarFact icon={<UserRound className="h-4 w-4" />} label="Patient Summary" value={context.patientSummary} />
          <SidebarFact icon={<Link2 className="h-4 w-4" />} label="Partner" value={context.partner} />
          <SidebarFact icon={<FolderOpen className="h-4 w-4" />} label="Hospital" value={context.hospital} />
          <SidebarFact icon={<UserRound className="h-4 w-4" />} label="Coordinator" value={context.assignedCoordinator} />
          <SidebarFact icon={<UserRound className="h-4 w-4" />} label="Reviewer" value={context.assignedClinicalReviewer} />
          <SidebarFact icon={<FileClock className="h-4 w-4" />} label="Clinical Readiness" value={`${context.clinicalReadinessScore}%`} />
          <SidebarFact icon={<CalendarClock className="h-4 w-4" />} label="Timeline Summary" value={context.timelineSummary} />
          <SidebarFact icon={<ClipboardList className="h-4 w-4" />} label="Open Tasks" value={context.openTasks} />
          <SidebarFact icon={<MessageSquare className="h-4 w-4" />} label="Unread Communications" value={context.unreadCommunications} />
        </CardContent>
      </Card>
      <UnifiedTaskPanel tasks={context.tasks} />
      <UnifiedTimeline events={context.timeline} />
      <Card>
        <CardHeader><CardTitle>Upcoming Deadlines</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {context.upcomingDeadlines.map((deadline) => (
            <div key={deadline} className="rounded-md border bg-white p-2 text-sm text-emerald-950">{deadline}</div>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}

export function UnifiedPatientFrame({
  children,
  context,
  currentView,
  onNavigate,
  onToggleSidebar,
  collapsed,
}: UnifiedPatientContextProps & { children: ReactNode }) {
  return (
    <div className="min-w-0 max-w-full space-y-4 overflow-x-hidden">
      <PatientContextBar context={context} />
      <CaseJourneyTracker context={context} />
      <NextActionPanel context={context} />
      <RelatedModuleShortcuts context={context} onNavigate={onNavigate} />
      <CaseHeader context={context} />
      <div className={collapsed ? "grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_140px]" : "grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]"}>
        <div className="min-w-0 overflow-x-hidden">{children}</div>
        <RightCaseSidebar collapsed={collapsed} context={context} onToggle={onToggleSidebar} />
      </div>
      <span className="sr-only">Current operational view: {currentView}</span>
    </div>
  );
}

function ContextFact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-md border bg-white px-3 py-2">
      <p className="text-[11px] font-medium uppercase text-muted-foreground">{label}</p>
      <div className="mt-1 truncate text-sm font-medium text-emerald-950">{value}</div>
    </div>
  );
}

function SidebarFact({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="rounded-md border bg-white p-3">
      <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-sm text-emerald-950">{value}</div>
    </div>
  );
}

function PriorityBadge({ value }: { value: string }) {
  const tone = value === "Urgent" ? "danger" : value === "High" ? "warning" : value === "Medium" ? "gold" : "muted";
  return <Badge tone={tone}>{value}</Badge>;
}

function UrgencyBadge({ value }: { value: string }) {
  const tone = value === "Emergency" ? "danger" : value === "Urgent" ? "warning" : value === "Soon" ? "gold" : "muted";
  return <Badge tone={tone}>{value}</Badge>;
}

function nextRequiredAction(context: UnifiedCaseContext) {
  if (context.badges.emergency) return "Escalate emergency review and confirm local safety guidance";
  if (context.badges.pendingDocuments) return "Request MRI DICOM / missing clinical documents";
  if (context.currentStage === "Clinical Decision" && context.clinicalReadinessScore < 80) return "Approve AI Draft or request corrections";
  if (context.currentStage === "Hospital Package") return "Send Hospital Package";
  if (context.currentStage === "Hospital MSO") return "Wait for Hospital MSO";
  if (context.currentStage === "Quotation") return "Send quotation and collect patient decision";
  if (context.currentStage === "Travel Preparation") return "Issue invitation letter";
  if (context.currentStage === "Travel") return "Book flight and arrange airport pickup";
  if (context.currentStage === "Follow-up") return "Schedule follow-up";
  return "Review current case and advance next workflow step";
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
