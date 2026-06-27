import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Bot,
  ClipboardCheck,
  DollarSign,
  FileCheck2,
  FileQuestion,
  FileSearch,
  Gauge,
  Hospital,
  MessageSquare,
  Send,
  ShieldAlert,
  Stethoscope,
  UserCheck,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import type { AppView } from "../../app/App";
import type {
  ChecklistStatus,
  ClinicalPriority,
  ClinicalReviewRecord,
  ClinicalStatus,
  UrgencyLevel,
} from "../../types/clinicalDecision";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

type ClinicalProps = {
  reviews: ClinicalReviewRecord[];
  review: ClinicalReviewRecord;
  onNavigate: (view: AppView) => void;
};

const futurePlaceholders = [
  "AI OCR",
  "AI Medical Model",
  "MDT Tumor Board",
  "Radiology AI",
  "Pathology AI",
  "Clinical Guidelines",
  "Risk Score",
  "Travel Fitness Score",
  "Air Ambulance Workflow",
];

const clinicalQueueStages = [
  "Emergency",
  "Waiting Documents",
  "AI Draft Ready",
  "Internal Review",
  "Clinical Lead Approval",
  "Patient Opinion Sent",
  "Hospital Package Ready",
  "Waiting Hospital MSO",
  "Completed",
] as const;

const revenueBySpecialty: Record<string, number> = {
  "Cardiac surgery": 42000,
  Oncology: 36000,
};

const specialtyRequiredDocuments: Record<string, string[]> = {
  "Brain Surgery": ["MRI Report", "MRI DICOM", "Neurosurgeon Notes", "Previous Surgery", "Blood Tests", "Passport", "Consent"],
  "Cardiac surgery": ["Echo", "ECG", "Angiography", "DICOM", "Blood Tests", "Passport", "Consent"],
  Oncology: ["Pathology", "Immunohistochemistry", "PET CT", "MRI", "CT", "Blood Tests", "Passport", "Consent"],
};

type QueueSortKey = "priority" | "caseId" | "patientName" | "country" | "treatmentRequested" | "assignedReviewer" | "reviewTimeHours" | "stage";
type OperationalChecklistStatus = "Missing" | "Received" | "Requested" | "Verified" | "Validated" | "Rejected" | "Not Applicable";
type OperationalDocumentItem = {
  item: string;
  status: OperationalChecklistStatus;
  dateReceived: string;
  reviewer: string;
  requestRecipient: string;
  requestStatus: string;
  requestedDate: string;
  reminderCount: number;
  expectedDate: string;
  notes: string;
};

export function ClinicalDecisionDashboard({
  reviews,
  onNavigate,
}: Omit<ClinicalProps, "review">) {
  const [selectedReviewId, setSelectedReviewId] = useState(reviews[0]?.id ?? "");
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [sortKey, setSortKey] = useState<QueueSortKey>("priority");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const workload = buildReviewerWorkload(reviews);
  const countryWork = buildCountryWorkload(reviews);
  const revenueWaiting = reviews
    .filter((item) => isRevenueWaiting(item))
    .reduce((sum, item) => sum + estimateRevenue(item), 0);
  const aiDraftsGenerated = reviews.filter((item) => item.aiDraftStatus !== "Not Generated").length;
  const aiDraftsCorrected = reviews.filter((item) => item.aiDraftStatus === "Corrected").length;
  const aiDraftsApproved = reviews.filter((item) => item.aiDraftStatus === "Approved").length;
  const aiApprovalRate = aiDraftsGenerated > 0 ? Math.round((aiDraftsApproved / aiDraftsGenerated) * 100) : 0;
  const metrics = {
    pending: reviews.filter((item) => item.status === "Documents Incomplete").length,
    waitingDocuments: reviews.filter((item) => item.status === "Waiting for Documents").length,
    aiDrafts: reviews.filter((item) => item.aiDraftStatus !== "Not Generated").length,
    internalReview: reviews.filter((item) => item.internalReviewStatus === "Required" || item.internalReviewStatus === "In Review").length,
    preliminarySent: reviews.filter((item) => item.status === "Preliminary Opinion Sent").length,
    readyPackage: reviews.filter((item) => item.status === "Ready for Hospital Submission").length,
    msoRequested: reviews.filter((item) => item.status === "Hospital Review Requested").length,
    emergency: reviews.filter((item) => item.status === "Emergency Escalation" || item.urgency === "Emergency").length,
    lowBenefit: reviews.filter((item) => item.status === "Not Recommended for Travel").length,
    averageTime: Math.round(reviews.reduce((sum, item) => sum + item.reviewTimeHours, 0) / reviews.length),
    readyForInternalReview: reviews.filter((item) => item.aiDraftStatus !== "Not Generated" && item.internalReviewStatus === "Required").length,
    waitingMso: reviews.filter((item) => item.status === "Hospital Review Requested" || item.msoTracker.some((mso) => mso.status === "Open")).length,
  };
  const filteredQueue = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return [...reviews]
      .filter((item) => {
        const stage = queueStageForReview(item);
        const matchesSearch = normalizedSearch
          ? [item.caseId, item.patientName, item.country, item.treatmentRequested, item.assignedReviewer, item.specialty]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch)
          : true;
        const matchesPriority = priorityFilter ? item.priority === priorityFilter : true;
        const matchesStage = stageFilter ? stage === stageFilter : true;
        return matchesSearch && matchesPriority && matchesStage;
      })
      .sort((a, b) => compareQueueRows(a, b, sortKey, sortDirection));
  }, [priorityFilter, reviews, searchTerm, sortDirection, sortKey, stageFilter]);
  const selectedReview = reviews.find((item) => item.id === selectedReviewId) ?? filteredQueue[0] ?? reviews[0];
  const selectedChecklist = selectedReview ? buildSpecialtyChecklist(selectedReview) : [];
  const readinessScore = selectedReview ? calculateClinicalReadinessScore(selectedReview, selectedChecklist) : 0;
  const selectedMissingDocuments = selectedChecklist.filter((item) => item.status === "Missing" || item.status === "Rejected" || item.status === "Requested");

  function toggleSort(nextKey: QueueSortKey) {
    if (sortKey === nextKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      return;
    }
    setSortKey(nextKey);
    setSortDirection(nextKey === "reviewTimeHours" || nextKey === "priority" ? "desc" : "asc");
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Clinical Decision Center"
        title="Clinical Decision Dashboard"
        description="Clinical workflow hub for document completeness, AI-assisted preliminary opinions, internal validation, hospital case packages, and hospital MSO tracking."
        actions={
          <>
            <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "clinical-review-queue" })}>
              <FileSearch className="h-4 w-4" />
              Open Queue
            </Button>
            <Button type="button" onClick={() => onNavigate({ name: "clinical-review-workspace", reviewId: reviews[0]?.id ?? "MRV-2026-000001" })}>
              <Stethoscope className="h-4 w-4" />
              Review Workspace
            </Button>
          </>
        }
      />

      <RuleNotice />

      <section className="rounded-xl border border-emerald-950/10 bg-emerald-950 p-4 text-white shadow-sm sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-yellow-200">Today&apos;s Clinical Work</p>
            <h3 className="mt-1 text-xl font-semibold">Command center priorities</h3>
          </div>
          <p className="text-sm text-emerald-100">Focus on clinical blockers that delay patient decisions, hospital packages, and revenue.</p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <CommandMetric icon={<AlertTriangle className="h-4 w-4" />} label="Emergency Cases" value={metrics.emergency} tone="danger" />
          <CommandMetric icon={<FileQuestion className="h-4 w-4" />} label="Waiting Documents" value={metrics.waitingDocuments} tone="warning" />
          <CommandMetric icon={<UserCheck className="h-4 w-4" />} label="Ready for Internal Review" value={metrics.readyForInternalReview} tone="info" />
          <CommandMetric icon={<FileCheck2 className="h-4 w-4" />} label="Hospital Package Ready" value={metrics.readyPackage} tone="success" />
          <CommandMetric icon={<Hospital className="h-4 w-4" />} label="Waiting Hospital MSO" value={metrics.waitingMso} tone="gold" />
          <CommandMetric icon={<DollarSign className="h-4 w-4" />} label="Revenue Waiting on Clinical Review" value={formatMoney(revenueWaiting)} tone="gold" />
        </div>
      </section>

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_520px]">
        <Card>
          <CardHeader className="border-b">
            <div className="space-y-3">
              <div>
                <CardTitle>Clinical Priority Queue</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Search, filter, and process clinical reviews.</p>
              </div>
              <div className="grid gap-2 md:grid-cols-[minmax(260px,1fr)_180px_240px]">
                <Input
                  placeholder="Search case, patient, country, treatment"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
                <Select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
                  <option value="">Priority: All</option>
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </Select>
                <Select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)}>
                  <option value="">Stage: All</option>
                  {clinicalQueueStages.map((stage) => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[520px] overflow-auto">
              <Table className="min-w-[1480px]">
                <TableHeader className="sticky top-0 z-10 bg-emerald-50 shadow-sm">
                  <TableRow>
                    <SortableHead label="Priority" sortKey="priority" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} />
                    <SortableHead label="Case ID" sortKey="caseId" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} />
                    <SortableHead label="Patient" sortKey="patientName" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} />
                    <SortableHead label="Country" sortKey="country" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} />
                    <SortableHead label="Treatment" sortKey="treatmentRequested" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} />
                    <SortableHead label="Assigned Reviewer" sortKey="assignedReviewer" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} />
                    <SortableHead label="Waiting Time" sortKey="reviewTimeHours" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} />
                    <SortableHead label="Current Stage" sortKey="stage" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} />
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQueue.map((item) => {
                    const stage = queueStageForReview(item);
                    const isSelected = selectedReview?.id === item.id;
                    return (
                      <TableRow key={item.id} className={isSelected ? "bg-emerald-50/80 hover:bg-emerald-50" : undefined}>
                        <TableCell><PriorityBadge priority={item.priority} /></TableCell>
                        <TableCell className="font-medium text-emerald-950">{item.caseId}</TableCell>
                        <TableCell>{item.patientName}</TableCell>
                        <TableCell>{item.country}</TableCell>
                        <TableCell>{item.treatmentRequested}</TableCell>
                        <TableCell>{item.assignedReviewer}</TableCell>
                        <TableCell>{item.reviewTimeHours}h</TableCell>
                        <TableCell><Badge tone={stage === "Emergency" ? "danger" : stage === "Waiting Documents" ? "warning" : "info"}>{stage}</Badge></TableCell>
                        <TableCell>
                          <QueueActionButtons
                            isSelected={isSelected}
                            onNavigate={onNavigate}
                            onSelect={() => setSelectedReviewId(item.id)}
                            review={item}
                            stage={stage}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-col gap-2 border-t bg-slate-50 px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>{filteredQueue.length} cases shown. Pagination placeholder for future large queues.</span>
              <span>Sticky header enabled for daily case processing.</span>
            </div>
          </CardContent>
        </Card>

        {selectedReview ? (
          <WorkspacePreviewPanel
            missingDocuments={selectedMissingDocuments}
            onNavigate={onNavigate}
            readinessScore={readinessScore}
            review={selectedReview}
          />
        ) : null}
      </div>

      <div className="grid gap-4 2xl:grid-cols-[1fr_1fr_0.9fr]">
        <SummaryCard title="Clinical Workload">
          <div className="space-y-3">
            {workload.map((item) => (
              <div key={item.name} className="rounded-lg border bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-emerald-950">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.reviews} reviews | {item.urgent} urgent cases</p>
                  </div>
                  <Badge tone={item.status === "At capacity" ? "warning" : "success"}>{item.status}</Badge>
                </div>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                  <AlertFact label="Reviews" value={item.reviews} />
                  <AlertFact label="Urgent" value={item.urgent} urgent={item.urgent > 0} />
                  <AlertFact label="Avg review time" value={`${item.averageTime}h`} />
                </div>
              </div>
            ))}
          </div>
        </SummaryCard>

        <SummaryCard title="Reviews by Country">
          <div className="space-y-3">
            {countryWork.map((item) => (
              <div key={item.country} className="rounded-lg border bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-emerald-950">{item.country}</p>
                  <Badge tone={item.emergency > 0 ? "danger" : item.waitingDocuments > 0 ? "warning" : "success"}>{item.reviewCount} reviews</Badge>
                </div>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-4">
                  <AlertFact label="Avg time" value={`${item.averageTime}h`} />
                  <AlertFact label="Waiting docs" value={item.waitingDocuments} urgent={item.waitingDocuments > 0} />
                  <AlertFact label="Emergency" value={item.emergency} urgent={item.emergency > 0} />
                  <AlertFact label="Revenue held" value={formatMoney(item.revenueWaiting)} />
                </div>
              </div>
            ))}
          </div>
        </SummaryCard>

        <SummaryCard title="AI Quality Tracking">
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
            <p className="text-sm font-semibold text-yellow-900">Future AI quality tracking</p>
            <p className="mt-1 text-xs text-yellow-800">Placeholder metrics for clinical governance. Human clinical approval remains required.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <MiniMetric icon={<Bot className="h-4 w-4" />} label="AI Drafts Generated" value={aiDraftsGenerated} />
            <MiniMetric icon={<FileSearch className="h-4 w-4" />} label="AI Drafts Corrected" value={aiDraftsCorrected} />
            <MiniMetric icon={<Gauge className="h-4 w-4" />} label="AI Approval Rate" value={`${aiApprovalRate}%`} />
            <MiniMetric icon={<BadgeCheck className="h-4 w-4" />} label="AI Accuracy Placeholder" value="Future" />
          </div>
        </SummaryCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Breakdown title="Reviews by Specialty" rows={countBy(reviews, "specialty")} />
        <Breakdown title="Reviews by Status" rows={countBy(reviews, "status")} />
      </div>
    </div>
  );
}

export function ClinicalReviewQueue({ reviews, onNavigate }: Omit<ClinicalProps, "review">) {
  return (
    <div className="space-y-5">
      <BackButton onClick={() => onNavigate({ name: "clinical-decision-dashboard" })} />
      <PageHeader
        eyebrow="Clinical Decision Center"
        title="Review Queue"
        description="Prioritize clinical reviews by status, specialty, country, priority, urgency, reviewer, and SLA deadline."
      />

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-3 xl:grid-cols-6">
          {["Status", "Specialty", "Country", "Priority", "Urgency", "Assigned Reviewer"].map((label) => (
            <Select key={label} defaultValue="">
              <option value="">{label}: All</option>
            </Select>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table className="min-w-[1500px]">
            <TableHeader>
              <TableRow className="bg-emerald-50/70">
                <TableHead>Medical Review ID</TableHead>
                <TableHead>Case ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Treatment</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Document Status</TableHead>
                <TableHead>AI Draft Status</TableHead>
                <TableHead>Internal Review Status</TableHead>
                <TableHead>Assigned Reviewer</TableHead>
                <TableHead>Submitted Date</TableHead>
                <TableHead>SLA Deadline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-emerald-950">{item.id}</TableCell>
                  <TableCell>{item.caseId}</TableCell>
                  <TableCell>{item.patientName}</TableCell>
                  <TableCell>{item.country}</TableCell>
                  <TableCell>{item.treatmentRequested}</TableCell>
                  <TableCell>{item.specialty}</TableCell>
                  <TableCell><PriorityBadge priority={item.priority} /></TableCell>
                  <TableCell><UrgencyBadge urgency={item.urgency} /></TableCell>
                  <TableCell>{item.documentStatus}</TableCell>
                  <TableCell>{item.aiDraftStatus}</TableCell>
                  <TableCell>{item.internalReviewStatus}</TableCell>
                  <TableCell>{item.assignedReviewer}</TableCell>
                  <TableCell>{item.submittedDate}</TableCell>
                  <TableCell>{item.slaDeadline}</TableCell>
                  <TableCell><StatusBadge status={item.status} /></TableCell>
                  <TableCell>
                    <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "clinical-review-workspace", reviewId: item.id })}>
                      Open
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function ClinicalReviewWorkspace({ review, onNavigate }: ClinicalProps) {
  return (
    <div className="space-y-5">
      <BackButton onClick={() => onNavigate({ name: "clinical-review-queue" })} />
      <ClinicalHeader review={review} onNavigate={onNavigate} />
      <RuleNotice />
      <QuickActions review={review} onNavigate={onNavigate} />
      <CommunicationBadges review={review} />

      <div className="grid gap-4 xl:grid-cols-[1fr_390px]">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Clinical Profile</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field label="Patient Summary" value={review.clinicalProfile.patientSummary} wide />
              <Field label="Case Summary" value={review.clinicalProfile.caseSummary} wide />
              <Field label="Medical Problem" value={review.clinicalProfile.medicalProblem} />
              <Field label="Chief Complaint" value={review.clinicalProfile.chiefComplaint} />
              <Field label="Diagnosis / Suspected Diagnosis" value={review.clinicalProfile.diagnosis} />
              <Field label="Medical History" value={review.clinicalProfile.medicalHistory} />
              <Field label="Current Treatment" value={review.clinicalProfile.currentTreatment} />
              <Field label="Medications" value={review.clinicalProfile.medications} />
              <Field label="Allergies" value={review.clinicalProfile.allergies} />
              <Field label="Comorbidities" value={review.clinicalProfile.comorbidities} />
              <Field label="Functional Status" value={review.clinicalProfile.functionalStatus} />
              <Field label="Travel Fitness" value={review.clinicalProfile.travelFitness} />
            </CardContent>
          </Card>
          <TimelineCard review={review} />
        </div>
        <div className="space-y-4">
          <ReviewNav review={review} onNavigate={onNavigate} />
          <AuditTrail review={review} />
        </div>
      </div>
    </div>
  );
}

export function DocumentCompletenessReview({ review, onNavigate }: ClinicalProps) {
  return (
    <DetailPage title="Document Completeness Review" review={review} onNavigate={onNavigate}>
      <Card>
        <CardHeader><CardTitle>Specialty-Based Checklist</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table className="min-w-[1100px]">
            <TableHeader>
              <TableRow className="bg-emerald-50/70">
                <TableHead>Category</TableHead>
                <TableHead>Checklist Item</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Requested Date</TableHead>
                <TableHead>Request Recipient</TableHead>
                <TableHead>Copied Partner</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {review.checklist.map((item) => (
                <TableRow key={`${item.category}-${item.item}`}>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="font-medium text-emerald-950">{item.item}</TableCell>
                  <TableCell><ChecklistBadge status={item.status} /></TableCell>
                  <TableCell>{item.lastRequestedDate}</TableCell>
                  <TableCell>{item.requestRecipient}</TableCell>
                  <TableCell>{item.copiedPartner ? "Yes" : "No"}</TableCell>
                  <TableCell>{item.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <ActionBar labels={["Request Missing Documents", "Notify Patient / Family", "Copy Partner", "Mark as Complete"]} />
    </DetailPage>
  );
}

export function PreliminaryMedicalOpinion({ review, onNavigate }: ClinicalProps) {
  return (
    <DetailPage title="Preliminary Medical Opinion" review={review} onNavigate={onNavigate}>
      <Card className="border-yellow-200 bg-gradient-to-br from-white to-yellow-50">
        <CardHeader><CardTitle>AI Draft and Clinical Lead Review</CardTitle></CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <Field label="AI Draft Summary" value={review.preliminaryOpinion.aiDraftSummary} wide />
          <ListBlock title="Key Findings" items={review.preliminaryOpinion.keyFindings} />
          <Field label="Possible Diagnosis" value={review.preliminaryOpinion.possibleDiagnosis} />
          <ListBlock title="Red Flags" items={review.preliminaryOpinion.redFlags} danger />
          <ListBlock title="Missing Information" items={review.preliminaryOpinion.missingInformation} />
          <ListBlock title="Suggested Questions" items={review.preliminaryOpinion.suggestedQuestions} />
          <Field label="Travel Suitability" value={review.preliminaryOpinion.travelSuitability} />
          <Field label="Local Treatment Recommendation" value={review.preliminaryOpinion.localTreatmentRecommendation} />
          <Field label="Emergency Recommendation" value={review.preliminaryOpinion.emergencyRecommendation} />
          <Field label="Clinical Lead Review" value={review.preliminaryOpinion.clinicalLeadReview} />
          <Field label="Correction Notes" value={review.preliminaryOpinion.correctionNotes} />
          <Field label="Approval Status" value={<Badge tone="gold">{review.preliminaryOpinion.approvalStatus}</Badge>} />
          <Field label="Patient-facing Preliminary Opinion" value={review.preliminaryOpinion.patientFacingOpinion} wide />
          <Field label="Disclaimer" value={review.preliminaryOpinion.disclaimer} wide />
        </CardContent>
      </Card>
    </DetailPage>
  );
}

export function HospitalCasePackage({ review, onNavigate }: ClinicalProps) {
  return (
    <DetailPage title="Hospital Case Package" review={review} onNavigate={onNavigate}>
      <Card>
        <CardHeader><CardTitle>Hospital Submission Package</CardTitle></CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <Field label="Medical Summary" value={review.hospitalPackage.medicalSummary} />
          <Field label="Clinical Case Summary" value={review.hospitalPackage.clinicalCaseSummary} />
          <Field label="Case Brief" value={review.hospitalPackage.caseBrief} wide />
          <ListBlock title="Documents Included" items={review.hospitalPackage.documentsIncluded} />
          <ListBlock title="Clinical Questions for Hospital" items={review.hospitalPackage.clinicalQuestions} />
          <Field label="Requested Specialist Review" value={review.hospitalPackage.requestedSpecialistReview} />
          <Field label="Requested Treatment Plan" value={review.hospitalPackage.requestedTreatmentPlan} />
          <Field label="Requested Estimated Cost" value={review.hospitalPackage.requestedEstimatedCost} />
          <Field label="Requested Length of Stay" value={review.hospitalPackage.requestedLengthOfStay} />
          <Field label="Urgency" value={<UrgencyBadge urgency={review.hospitalPackage.urgency} />} />
          <Field label="Notes to Hospital" value={review.hospitalPackage.notesToHospital} wide />
          <ListBlock title="Selected Hospitals" items={review.hospitalPackage.selectedHospitals.length ? review.hospitalPackage.selectedHospitals : ["None selected"]} />
          <Field label="Submission Status" value={review.hospitalPackage.submissionStatus} />
        </CardContent>
      </Card>
    </DetailPage>
  );
}

export function HospitalMsoTracker({ review, onNavigate }: ClinicalProps) {
  return (
    <DetailPage title="Hospital MSO Tracker" review={review} onNavigate={onNavigate}>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table className="min-w-[1250px]">
            <TableHeader>
              <TableRow className="bg-emerald-50/70">
                <TableHead>Hospital</TableHead>
                <TableHead>Hospital Referral ID</TableHead>
                <TableHead>Hospital Case ID</TableHead>
                <TableHead>Specialist</TableHead>
                <TableHead>Submission Date</TableHead>
                <TableHead>Response Deadline</TableHead>
                <TableHead>MSO Status</TableHead>
                <TableHead>Treatment Plan Received</TableHead>
                <TableHead>Estimated Cost Received</TableHead>
                <TableHead>Length of Stay</TableHead>
                <TableHead>Quote ID</TableHead>
                <TableHead>Next Follow-up</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {review.msoTracker.length ? review.msoTracker.map((item) => (
                <TableRow key={`${item.hospital}-${item.hospitalReferralId}`}>
                  <TableCell className="font-medium text-emerald-950">{item.hospital}</TableCell>
                  <TableCell>{item.hospitalReferralId}</TableCell>
                  <TableCell>{item.hospitalCaseId}</TableCell>
                  <TableCell>{item.specialist}</TableCell>
                  <TableCell>{item.submissionDate}</TableCell>
                  <TableCell>{item.responseDeadline}</TableCell>
                  <TableCell>{item.msoStatus}</TableCell>
                  <TableCell>{item.treatmentPlanReceived ? "Yes" : "No"}</TableCell>
                  <TableCell>{item.estimatedCostReceived ? "Yes" : "No"}</TableCell>
                  <TableCell>{item.lengthOfStay}</TableCell>
                  <TableCell>{item.quoteId}</TableCell>
                  <TableCell>{item.nextFollowUp}</TableCell>
                  <TableCell><Badge tone={item.status === "Complete" ? "success" : "warning"}>{item.status}</Badge></TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell className="py-8 text-center text-muted-foreground" colSpan={13}>
                    No hospital MSO requests yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DetailPage>
  );
}

function ClinicalHeader({ review, onNavigate }: { review: ClinicalReviewRecord; onNavigate: (view: AppView) => void }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 p-5 text-white">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm font-medium text-yellow-200">Clinical Decision Center</p>
            <h2 className="mt-1 text-3xl font-semibold">{review.patientName}</h2>
            <p className="mt-2 text-sm text-emerald-100">{review.id} | {review.caseId} | {review.treatmentRequested}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge status={review.status} />
              <PriorityBadge priority={review.priority} />
              <UrgencyBadge urgency={review.urgency} />
            </div>
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-2 xl:min-w-[560px]">
            <BannerFact label="Patient ID" value={review.patientId} />
            <BannerFact label="Specialty" value={review.specialty} />
            <BannerFact label="Assigned Reviewer" value={review.assignedReviewer} />
            <BannerFact label="SLA Deadline" value={review.slaDeadline} />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 p-4">
        <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "case-profile", caseId: "CASE-1001-CARDIAC" })}>
          Case Link
        </Button>
        <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "clinical-document-review", reviewId: review.id })}>Documents</Button>
        <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "preliminary-medical-opinion", reviewId: review.id })}>Preliminary Opinion</Button>
        <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "hospital-case-package", reviewId: review.id })}>Hospital Package</Button>
        <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "hospital-mso-tracker", reviewId: review.id })}>MSO Tracker</Button>
      </div>
    </div>
  );
}

function DetailPage({ title, review, onNavigate, children }: { title: string; review: ClinicalReviewRecord; onNavigate: (view: AppView) => void; children: ReactNode }) {
  return (
    <div className="space-y-5">
      <BackButton onClick={() => onNavigate({ name: "clinical-review-workspace", reviewId: review.id })} />
      <PageHeader eyebrow="Clinical Decision Center" title={title} description={`${review.patientName} | ${review.id} | ${review.caseId}`} />
      <CommunicationBadges review={review} />
      {children}
    </div>
  );
}

function QuickActions({ review, onNavigate }: { review: ClinicalReviewRecord; onNavigate: (view: AppView) => void }) {
  const actions = [
    ["Request Missing Documents", () => onNavigate({ name: "clinical-document-review", reviewId: review.id })],
    ["Generate AI Draft", () => onNavigate({ name: "preliminary-medical-opinion", reviewId: review.id })],
    ["Assign Reviewer", undefined],
    ["Approve Preliminary Opinion", () => onNavigate({ name: "preliminary-medical-opinion", reviewId: review.id })],
    ["Send Preliminary Opinion to Patient", () => onNavigate({ name: "preliminary-medical-opinion", reviewId: review.id })],
    ["Create Hospital Case Package", () => onNavigate({ name: "hospital-case-package", reviewId: review.id })],
    ["Send Package to Hospital", () => onNavigate({ name: "hospital-mso-tracker", reviewId: review.id })],
    ["Escalate Emergency", undefined],
    ["Mark Low-Benefit Travel", undefined],
    ["Return to Case Workspace", () => onNavigate({ name: "case-profile", caseId: "CASE-1001-CARDIAC" })],
  ] as const;

  return (
    <Card>
      <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {actions.map(([label, onClick]) => (
          <Button key={label} variant="secondary" type="button" onClick={onClick}>
            {label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

function ReviewNav({ review, onNavigate }: { review: ClinicalReviewRecord; onNavigate: (view: AppView) => void }) {
  const links = [
    ["Document Completeness Review", "clinical-document-review"],
    ["Preliminary Medical Opinion", "preliminary-medical-opinion"],
    ["Hospital Case Package", "hospital-case-package"],
    ["Hospital MSO Tracker", "hospital-mso-tracker"],
  ] as const;
  return (
    <Card>
      <CardHeader><CardTitle>Clinical Work Areas</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {links.map(([label, name]) => (
          <Button key={name} className="w-full justify-start" variant="secondary" type="button" onClick={() => onNavigate({ name, reviewId: review.id } as AppView)}>
            {label}
          </Button>
        ))}
        <div className="flex flex-wrap gap-2 pt-2">
          {futurePlaceholders.map((item) => (
            <button key={item} className="cursor-not-allowed rounded-md border bg-slate-50 px-2 py-1 text-xs text-muted-foreground" disabled type="button">
              {item}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RuleNotice() {
  return (
    <Card className="border-emerald-200 bg-emerald-50/70">
      <CardContent className="p-4">
        <p className="font-semibold text-emerald-950">Clinical workflow rule</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Early Hospital Registration may happen before Medical Review to protect commission rights. Clinical Decision Center is required before a full clinical package or detailed quote request.
        </p>
      </CardContent>
    </Card>
  );
}

function CommunicationBadges({ review }: { review: ClinicalReviewRecord }) {
  const items = [
    ["Patient notified", review.communication.patientNotified],
    ["Family notified", review.communication.familyNotified],
    ["Partner copied", review.communication.partnerCopied],
    ["Hospital contacted", review.communication.hospitalContacted],
    ["Internal reviewer assigned", review.communication.internalReviewerAssigned],
    ["Clinical lead approved", review.communication.clinicalLeadApproved],
  ] as const;
  return (
    <Card>
      <CardContent className="flex flex-wrap gap-2 p-3">
        {items.map(([label, value]) => (
          <Badge key={label} tone={value ? "success" : "muted"}>{label}</Badge>
        ))}
      </CardContent>
    </Card>
  );
}

function TimelineCard({ review }: { review: ClinicalReviewRecord }) {
  return (
    <Card>
      <CardHeader><CardTitle>Clinical Timeline</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {review.timeline.map((event) => (
          <div key={`${event.timestamp}-${event.action}`} className="rounded-md border bg-white p-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-medium text-emerald-950">{event.action}</p>
              <span className="text-xs text-muted-foreground">{event.timestamp} | {event.user}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{event.notes}</p>
            <p className="mt-1 text-xs text-muted-foreground">Evidence: {event.evidence}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AuditTrail({ review }: { review: ClinicalReviewRecord }) {
  return (
    <Card>
      <CardHeader><CardTitle>Audit Trail</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {review.auditTrail.map((event) => (
          <div key={`${event.timestamp}-${event.action}`} className="rounded-md border bg-white p-3">
            <p className="font-medium text-emerald-950">{event.action}</p>
            <p className="mt-1 text-xs text-muted-foreground">{event.timestamp} | {event.user}</p>
            <div className="mt-3 grid gap-2 text-sm">
              <Field label="Old Value" value={event.oldValue} />
              <Field label="New Value" value={event.newValue} />
              <Field label="Reason" value={event.reason} />
              <Field label="Evidence" value={event.evidence} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function QueueActionButtons({
  isSelected,
  onNavigate,
  onSelect,
  review,
  stage,
}: {
  isSelected: boolean;
  onNavigate: (view: AppView) => void;
  onSelect: () => void;
  review: ClinicalReviewRecord;
  stage: (typeof clinicalQueueStages)[number];
}) {
  const actions = stageActions(stage);

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant={isSelected ? "primary" : "secondary"} type="button" onClick={onSelect}>
        Select
      </Button>
      {actions.map((action) => (
        <Button
          key={action}
          variant={action === "Open Workspace" ? "primary" : "secondary"}
          type="button"
          onClick={() => {
            if (action === "Open Workspace") {
              onNavigate({ name: "clinical-review-workspace", reviewId: review.id });
              return;
            }
            onSelect();
          }}
        >
          {action}
        </Button>
      ))}
    </div>
  );
}

function stageActions(stage: (typeof clinicalQueueStages)[number]) {
  if (stage === "Waiting Documents") return ["Request Documents", "Open Workspace"];
  if (stage === "AI Draft Ready") return ["Review AI Draft", "Open Workspace"];
  if (stage === "Hospital Package Ready") return ["Build Hospital Package", "Open Workspace"];
  if (stage === "Waiting Hospital MSO") return ["Build Hospital Package", "Open Workspace"];
  if (stage === "Emergency") return ["Escalate Emergency", "Open Workspace"];
  if (stage === "Internal Review" || stage === "Clinical Lead Approval") return ["Review AI Draft", "Open Workspace"];
  if (stage === "Patient Opinion Sent") return ["Build Hospital Package", "Open Workspace"];
  return ["Open Workspace"];
}

function WorkspacePreviewPanel({
  missingDocuments,
  onNavigate,
  readinessScore,
  review,
}: {
  missingDocuments: OperationalDocumentItem[];
  onNavigate: (view: AppView) => void;
  readinessScore: number;
  review: ClinicalReviewRecord;
}) {
  const stage = queueStageForReview(review);
  const hospitalRegistrationStatus = review.msoTracker.some((item) => item.hospitalCaseId !== "Pending")
    ? "Registration active"
    : "Early registration available";
  const checklist = buildSpecialtyChecklist(review);
  const validationStatus = clinicalValidationStatus(review);
  const opinionStatus = patientOpinionStatus(review);
  const packageStatus = hospitalPackageStatus(review);
  const ethicalReview = ethicalReviewSummary(review);
  const clinicalRecommendation = clinicalRecommendationSummary(review);
  const workflowStage = workflowStageForReview(review);

  return (
    <Card className="2xl:sticky 2xl:top-24">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Clinical Workspace Preview</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{review.patientName} | {review.caseId}</p>
          </div>
          <ReadinessRing score={readinessScore} />
        </div>
      </CardHeader>
      <CardContent className="max-h-[calc(100vh-8rem)] space-y-4 overflow-y-auto pt-5">
        <div className="grid gap-2 rounded-lg border bg-slate-50 p-3 text-sm sm:grid-cols-3 2xl:grid-cols-1">
          <Field label="Patient ID" value={review.patientId} />
          <Field label="Case ID" value={review.caseId} />
          <Field label="Medical Review ID" value={review.id} />
        </div>
        <Field label="Patient Summary" value={review.clinicalProfile.patientSummary} />
        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
          <Field label="Clinical Status" value={<StatusBadge status={review.status} />} />
          <Field label="Urgency" value={<UrgencyBadge urgency={review.urgency} />} />
          <Field label="Current Stage" value={<Badge tone="info">{workflowStage}</Badge>} />
          <Field label="Hospital Registration Status" value={hospitalRegistrationStatus} />
          <Field label="Partner" value={review.communication.partnerCopied ? "Referral partner copied" : "No partner copied"} />
          <Field label="Coordinator" value={review.auditTrail[0]?.user ?? "Clinical coordination"} />
        </div>

        <ClinicalReadinessPanel readinessScore={readinessScore} review={review} />

        <PreviewSection
          title="Document Completeness Workspace"
          badge={missingDocuments.length > 0 ? `${missingDocuments.length} gaps` : "Complete"}
          tone={missingDocuments.length > 0 ? "warning" : "success"}
        >
          <div className="space-y-2">
            {checklist.map((item) => (
              <div key={item.item} className="rounded-md border bg-white p-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-emerald-950">{item.item}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.notes}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Date received: {item.dateReceived} | Reviewer: {item.reviewer}</p>
                  </div>
                  <OperationalChecklistBadge status={item.status} />
                </div>
                <div className="mt-2">
                  <Button variant="secondary" type="button">Request</Button>
                </div>
              </div>
            ))}
          </div>
        </PreviewSection>

        <PreviewSection
          title="Missing Document Requests"
          badge={missingDocuments.length > 0 ? "Action needed" : "No open requests"}
          tone={missingDocuments.length > 0 ? "warning" : "success"}
        >
          <p className="mb-3 rounded-md border border-emerald-100 bg-emerald-50 p-2 text-xs text-emerald-900">
            AfraMedico communicates directly with the patient whenever possible while automatically informing the referral partner.
          </p>
          <div className="space-y-2">
            {(missingDocuments.length > 0 ? missingDocuments : checklist.filter((item) => item.status === "Verified" || item.status === "Validated").slice(0, 2)).map((item) => (
              <div key={`${item.item}-request`} className="rounded-md border bg-white p-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-emerald-950">{item.item}</p>
                  <Badge tone={item.status === "Missing" || item.status === "Requested" ? "warning" : "success"}>{item.requestStatus}</Badge>
                </div>
                <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                  <span>Recipient: {item.requestRecipient}</span>
                  <span>Referral Partner: CC</span>
                  <span>Requested: {item.requestedDate}</span>
                  <span>Reminders: {item.reminderCount}</span>
                  <span>Expected: {item.expectedDate}</span>
                  <span>Notes: {item.notes}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Button variant="secondary" type="button">Request Missing Documents</Button>
            <Button variant="secondary" type="button">Notify Patient / Family</Button>
            <Button variant="secondary" type="button">Copy Partner</Button>
            <Button variant="secondary" type="button">Mark Received</Button>
          </div>
        </PreviewSection>

        <PreviewSection title="AI Clinical Draft" badge="Internal draft only" tone="gold">
          <p className="rounded-md border border-yellow-200 bg-yellow-50 p-2 text-xs font-medium text-yellow-900">
            Internal draft only - not sent directly to patient.
          </p>
          <div className="mt-3 grid gap-3">
            <Field label="Clinical Summary" value={review.preliminaryOpinion.aiDraftSummary} />
            <Field label="Diagnosis" value={review.preliminaryOpinion.possibleDiagnosis} />
            <Field label="Key Findings" value={review.preliminaryOpinion.keyFindings.join(", ")} />
            <Field label="Red Flags" value={review.preliminaryOpinion.redFlags.join(", ")} />
            <Field label="Urgency" value={review.urgency} />
            <Field label="Suggested Specialties" value={review.hospitalPackage.requestedSpecialistReview} />
            <Field label="Suggested Destination Countries" value={suggestedDestinationCountries(review).join(", ")} />
            <Field label="Suggested Hospitals" value={review.hospitalPackage.selectedHospitals.join(", ")} />
            <Field label="Clinical Questions for Hospital" value={review.hospitalPackage.clinicalQuestions.join(", ")} />
            <Field label="Confidence Level" value={aiConfidenceLevel(review)} />
            <Field label="AI Draft Version" value={`${review.id}-DRAFT-01`} />
            <Field label="Reviewer Notes" value={review.preliminaryOpinion.correctionNotes} />
            <Field label="Human Validation Required" value={review.communication.clinicalLeadApproved ? "Completed" : "Required"} />
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {["Generate Draft", "Edit Draft", "Approve Draft", "Reject Draft"].map((label) => (
              <Button key={label} variant={label === "Approve Draft" ? "primary" : "secondary"} type="button">{label}</Button>
            ))}
          </div>
        </PreviewSection>

        <PreviewSection title="Internal Validation & Clinical Lead Approval" badge={validationStatus} tone={validationStatus === "Approved" ? "success" : validationStatus === "Rejected" ? "danger" : "warning"}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Reviewer" value={review.assignedReviewer} />
            <Field label="Clinical Lead" value={review.clinicalLead} />
            <Field label="Approval Status" value={validationStatus} />
            <Field label="Approved Date" value={review.communication.clinicalLeadApproved ? review.auditTrail[0]?.timestamp ?? "Approved" : "Pending"} />
            <Field label="Correction Notes" value={review.preliminaryOpinion.correctionNotes} />
            <Field label="Decision" value={review.preliminaryOpinion.clinicalLeadReview} />
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {["Approve", "Needs Correction", "Escalate", "Second Reviewer", "Emergency", "Ethics Review", "Clinical Governance"].map((item) => (
              <Button key={item} variant={item === "Approve" ? "primary" : "secondary"} type="button">{item}</Button>
            ))}
          </div>
        </PreviewSection>

        <PreviewSection title="Hospital Package Builder" badge={packageStatus} tone={packageStatus === "Ready" || packageStatus === "Sent" || packageStatus === "MSO Received" ? "success" : "warning"}>
          <div className="grid gap-2">
            {["Referral Letter", "Medical Summary", "Imaging", "Pathology", "Lab Results", "Timeline", "Questions for Hospital"].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-md border bg-white p-2 text-sm">
                <span className="font-medium text-emerald-950">{item}</span>
                <Badge tone={review.hospitalPackage.documentsIncluded.length > 0 ? "success" : "warning"}>{review.hospitalPackage.documentsIncluded.length > 0 ? "Included" : "Pending"}</Badge>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Field label="Package Readiness %" value={`${hospitalPackageScore(review)}%`} />
            <ProgressBar value={hospitalPackageScore(review)} />
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <Button variant="secondary" type="button">Preview Package</Button>
            <Button variant="secondary" type="button">Download Package</Button>
            <Button type="button">Mark Ready</Button>
            <Button variant="secondary" type="button">Send to Hospital Placeholder</Button>
          </div>
        </PreviewSection>

        <PreviewSection title="Hospital MSO Tracking" badge={msoOverallStatus(review)} tone={msoOverallStatus(review) === "Completed" || msoOverallStatus(review) === "MSO Received" ? "success" : "warning"}>
          <div className="space-y-2">
            {review.msoTracker.map((item) => (
              <div key={item.hospitalReferralId} className="rounded-md border bg-white p-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-emerald-950">{item.hospital}</p>
                  <Badge tone={msoDisplayStatus(item.msoStatus) === "MSO Received" || msoDisplayStatus(item.msoStatus) === "Completed" ? "success" : "warning"}>{msoDisplayStatus(item.msoStatus)}</Badge>
                </div>
                <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                  <span>Specialist: {item.specialist}</span>
                  <span>Requested: {item.submissionDate}</span>
                  <span>Deadline: {item.responseDeadline}</span>
                  <span>Clarification: {item.status === "Open" ? "Awaiting Clarification" : "Completed"}</span>
                  <span>Invoice: {item.estimatedCostReceived ? "Invoice Received" : "Pending"}</span>
                  <span>Questions: {item.treatmentPlanReceived ? "Answered" : "Under Review"}</span>
                </div>
              </div>
            ))}
          </div>
        </PreviewSection>

        <PreviewSection title="Clinical Recommendation" badge={clinicalRecommendation.outcome} tone={clinicalRecommendation.tone}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Reason" value={clinicalRecommendation.reason} />
            <Field label="Benefits" value={clinicalRecommendation.benefits} />
            <Field label="Risks" value={clinicalRecommendation.risks} />
            <Field label="Reviewer" value={review.assignedReviewer} />
            <Field label="Date" value={review.auditTrail[0]?.timestamp ?? review.submittedDate} />
          </div>
        </PreviewSection>

        <PreviewSection title="Patient Preliminary Opinion" badge={opinionStatus} tone={opinionStatus === "Sent" ? "success" : opinionStatus === "Returned for Revision" ? "warning" : "info"}>
          <Field label="Patient-Friendly Opinion" value={review.preliminaryOpinion.patientFacingOpinion} />
          <p className="mt-3 rounded-md border bg-slate-50 p-2 text-xs text-muted-foreground">
            This is NOT the final hospital opinion. The final recommendation will be provided after review by the selected hospital.
          </p>
          <p className="mt-2 rounded-md border bg-slate-50 p-2 text-xs text-muted-foreground">
            {review.preliminaryOpinion.disclaimer}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <Button variant="secondary" type="button">Preview Patient Version</Button>
            <Button type="button">Approve for Patient</Button>
            <Button variant="secondary" type="button">Mark as Sent</Button>
          </div>
        </PreviewSection>

        <PreviewSection title="Ethical Travel Review" badge={ethicalReview.recommendation} tone={ethicalReview.benefit === "Very Low" || ethicalReview.benefit === "Low" ? "warning" : "success"}>
          <div className="mb-3 flex flex-wrap gap-2">
            {(ethicalReview.benefit === "Very Low" || ethicalReview.benefit === "Low") ? <Badge tone="warning">Low Benefit Travel</Badge> : null}
            {review.urgency === "Emergency" ? <Badge tone="danger">Emergency</Badge> : null}
            {ethicalReview.recommendation === "Local Treatment First" || ethicalReview.recommendation === "Travel Not Recommended" ? <Badge tone="gold">Local Care Recommended</Badge> : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Expected Clinical Benefit" value={ethicalReview.benefit} />
            <Field label="Travel Recommendation" value={ethicalReview.recommendation} />
            <Field label="Patient / Family Decision" value={ethicalReview.patientDecision} />
            <Field label="Reason" value={ethicalReview.reason} />
          </div>
        </PreviewSection>

        <div className="grid gap-2 border-t pt-4">
          <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "dashboard" })}>
            Open Mission Control
          </Button>
          <Button type="button" onClick={() => onNavigate({ name: "clinical-review-workspace", reviewId: review.id })}>
            Open Full Workspace
          </Button>
          <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "case-profile", caseId: review.caseId })}>
            Open Case Workspace
          </Button>
          <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-1">
            <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "hospital-referrals" })}>Hospital Referrals</Button>
            <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "case-profile", caseId: review.caseId })}>Hospital Quotes</Button>
            <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "referral-details", caseId: "PRC-001" })}>Referral Protection</Button>
            <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "clinical-document-review", reviewId: review.id })}>Documents</Button>
            <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "case-profile", caseId: review.caseId })}>Timeline</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ClinicalChecklistCard({
  checklist,
  readinessScore,
  review,
}: {
  checklist: Array<{ item: string; status: OperationalChecklistStatus; notes: string }>;
  readinessScore: number;
  review: ClinicalReviewRecord;
}) {
  const completionPercentage = Math.round((checklist.filter((item) => item.status === "Validated" || item.status === "Received").length / Math.max(checklist.length, 1)) * 100);

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Clinical Checklist</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{review.specialty} required documents and coordinator validation.</p>
          </div>
          <Badge tone={readinessScore >= 80 ? "success" : "warning"}>{completionPercentage}% complete</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[820px]">
            <TableHeader className="bg-emerald-50">
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Coordinator Notes</TableHead>
                <TableHead>Completion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checklist.map((item) => (
                <TableRow key={item.item}>
                  <TableCell className="font-medium text-emerald-950">{item.item}</TableCell>
                  <TableCell><OperationalChecklistBadge status={item.status} /></TableCell>
                  <TableCell className="text-muted-foreground">{item.notes}</TableCell>
                  <TableCell>
                    <ProgressBar value={item.status === "Validated" ? 100 : item.status === "Received" ? 70 : item.status === "Rejected" ? 20 : 0} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function AiClinicalDraftCard({ review }: { review: ClinicalReviewRecord }) {
  const draftSections = [
    ["Patient Summary", review.clinicalProfile.patientSummary],
    ["Clinical History", review.clinicalProfile.medicalHistory],
    ["Working Diagnosis", review.preliminaryOpinion.possibleDiagnosis],
    ["Urgency Assessment", `${review.urgency} | ${review.clinicalProfile.travelFitness}`],
    ["Possible Treatment Options", review.hospitalPackage.requestedTreatmentPlan],
    ["Missing Information", review.preliminaryOpinion.missingInformation.join(", ")],
    ["Clinical Risks", review.preliminaryOpinion.redFlags.join(", ")],
    ["Recommended Destination", review.hospitalPackage.selectedHospitals.join(", ")],
    ["Suggested Questions", review.preliminaryOpinion.suggestedQuestions.join(", ")],
    ["Coordinator Notes", review.hospitalPackage.notesToHospital],
  ];

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>AI Clinical Draft</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Internal-only draft. Never sent directly to patients.</p>
          </div>
          <Badge tone={review.aiDraftStatus === "Approved" ? "success" : review.aiDraftStatus === "Corrected" ? "warning" : "info"}>{review.aiDraftStatus}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <div className="grid gap-4 md:grid-cols-2">
          {draftSections.map(([label, value]) => (
            <Field key={label} label={label} value={value} wide={label === "Patient Summary" || label === "Clinical History"} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2 border-t pt-4">
          {["Generate Draft", "Edit Draft", "Approve Draft", "Reject Draft"].map((label) => (
            <Button key={label} variant={label === "Approve Draft" ? "primary" : "secondary"} type="button">{label}</Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function HumanValidationCard({ review }: { review: ClinicalReviewRecord }) {
  return (
    <Card>
      <CardHeader><CardTitle>Internal Clinical Validation</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Field label="Reviewer" value={review.assignedReviewer} />
        <Field label="Approval Status" value={review.preliminaryOpinion.approvalStatus} />
        <Field label="Comments" value={review.preliminaryOpinion.clinicalLeadReview} />
        <Field label="Required Corrections" value={review.preliminaryOpinion.correctionNotes} />
        <Field label="Final Approval" value={review.communication.clinicalLeadApproved ? <Badge tone="success">Approved</Badge> : <Badge tone="warning">Pending</Badge>} />
      </CardContent>
    </Card>
  );
}

function PatientOpinionCard({ review }: { review: ClinicalReviewRecord }) {
  const opinionStatus = review.status === "Preliminary Opinion Sent" ? "Sent" : review.preliminaryOpinion.approvalStatus === "Approved" ? "Approved" : "Draft";
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Patient Preliminary Opinion</CardTitle>
          <Badge tone={opinionStatus === "Sent" ? "success" : opinionStatus === "Approved" ? "info" : "warning"}>{opinionStatus}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-5">
        <Field label="Current Understanding" value={review.preliminaryOpinion.patientFacingOpinion} />
        <Field label="Possible Treatment" value={review.hospitalPackage.requestedTreatmentPlan} />
        <Field label="Important Disclaimer" value={review.preliminaryOpinion.disclaimer} />
        <Field label="Next Steps" value={review.preliminaryOpinion.missingInformation.length > 0 ? "Collect missing documents before hospital package is sent." : "Prepare hospital package and request specialist opinion."} />
      </CardContent>
    </Card>
  );
}

function HospitalPackageBuilderCard({ review }: { review: ClinicalReviewRecord }) {
  const packageItems = ["Referral Letter", "Medical Summary", "Documents", "Imaging", "Clinical Timeline", "Coordinator Notes"];
  const packageStatus = review.status === "Ready for Hospital Submission"
    ? "Ready"
    : review.status === "Hospital Review Requested"
      ? "Sent"
      : review.msoTracker.some((item) => item.msoStatus === "Received")
        ? "MSO Received"
        : "Building";

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Hospital Package Builder</CardTitle>
          <Badge tone={packageStatus === "Ready" || packageStatus === "Sent" || packageStatus === "MSO Received" ? "success" : "warning"}>{packageStatus}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <div className="grid gap-2 sm:grid-cols-2">
          {packageItems.map((item) => (
            <div key={item} className="flex items-center justify-between rounded-md border bg-white p-2 text-sm">
              <span className="font-medium text-emerald-950">{item}</span>
              <Badge tone="success">Included</Badge>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 border-t pt-4">
          {["Preview", "Generate PDF", "Send"].map((label) => (
            <Button key={label} variant="secondary" type="button">{label}</Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function EthicalReviewCard({ review }: { review: ClinicalReviewRecord }) {
  const veryLowBenefit = review.status === "Not Recommended for Travel";
  const expectedBenefit = veryLowBenefit ? "Very Low" : review.urgency === "Emergency" ? "Low" : review.priority === "Urgent" ? "Moderate" : "High";
  const recommendation = veryLowBenefit ? "Travel Not Recommended" : review.urgency === "Emergency" ? "Local Treatment First" : review.status === "Waiting for Documents" ? "Delay" : "Proceed";

  return (
    <Card className="border-yellow-200">
      <CardHeader><CardTitle>Ethical Review</CardTitle></CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <Field label="Travel Benefit Assessment" value={<Badge tone={expectedBenefit === "Very Low" || expectedBenefit === "Low" ? "warning" : "success"}>{expectedBenefit}</Badge>} />
        <Field label="Alternative Local Treatment" value={veryLowBenefit || review.urgency === "Emergency" ? "Yes" : "No"} />
        <Field label="Urgency" value={<UrgencyBadge urgency={review.urgency} />} />
        <Field label="Travel Recommendation" value={recommendation} />
        <Field label="Patient Decision" value={veryLowBenefit ? "Continue Anyway" : "Pending"} />
        <Field label="History" value="Decision preserved in clinical timeline and audit history placeholder." />
      </CardContent>
    </Card>
  );
}

function ClinicalReadinessCard({ readinessScore, review }: { readinessScore: number; review: ClinicalReviewRecord }) {
  const ready = readinessScore >= 80;
  const components = [
    ["Document Completeness", documentCompletenessScore(buildSpecialtyChecklist(review))],
    ["Clinical Validation", validationScore(review)],
    ["AI Draft", aiDraftScore(review)],
    ["Human Approval", review.communication.clinicalLeadApproved ? 100 : 0],
    ["Hospital Package", hospitalPackageScore(review)],
  ] as const;

  return (
    <Card className={ready ? "border-emerald-200" : "border-amber-200"}>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Clinical Readiness Score</CardTitle>
          <ReadinessRing score={readinessScore} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Badge tone={ready ? "success" : "warning"}>{ready ? "Ready for Hospital Submission" : "Needs More Information"}</Badge>
        {components.map(([label, value]) => (
          <div key={label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium uppercase text-muted-foreground">{label}</span>
              <span className="font-semibold text-emerald-950">{value}%</span>
            </div>
            <ProgressBar value={value} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PreviewSection({
  badge,
  children,
  title,
  tone,
}: {
  badge: ReactNode;
  children: ReactNode;
  title: string;
  tone: "default" | "muted" | "success" | "warning" | "danger" | "info" | "gold";
}) {
  return (
    <section className="rounded-lg border bg-white p-3">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-emerald-950">{title}</h3>
        <Badge tone={tone}>{badge}</Badge>
      </div>
      {children}
    </section>
  );
}

function ClinicalReadinessPanel({ readinessScore, review }: { readinessScore: number; review: ClinicalReviewRecord }) {
  const ready = readinessScore >= 80;
  const components = [
    ["Documents", documentCompletenessScore(buildSpecialtyChecklist(review))],
    ["Clinical Review", clinicalReviewScore(review)],
    ["Validation", validationScore(review)],
    ["Package", hospitalPackageScore(review)],
    ["Hospital Questions", hospitalQuestionsScore(review)],
    ["MSO", msoScore(review)],
  ] as const;

  return (
    <PreviewSection
      badge={ready ? "Ready for Hospital Submission" : "Needs More Information"}
      title="Clinical Readiness Score"
      tone={ready ? "success" : "warning"}
    >
      <div className="mb-3 flex items-center gap-3">
        <ReadinessRing score={readinessScore} />
        <p className="text-sm text-muted-foreground">
          Visual score based on documents, clinical review, validation, package readiness, hospital questions, and MSO progress.
        </p>
      </div>
      <div className="space-y-2">
        {components.map(([label, value]) => (
          <div key={label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium uppercase text-muted-foreground">{label}</span>
              <span className="font-semibold text-emerald-950">{value}%</span>
            </div>
            <ProgressBar value={value} />
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-md border bg-white p-2">
        <Field label="Readiness Level" value={ready ? "Ready for Quotation" : "Needs More Information"} />
        <Field label="Next Required Action" value={readinessNextAction(review)} />
      </div>
    </PreviewSection>
  );
}

function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-medium text-primary">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

function CommandMetric({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  tone: "danger" | "warning" | "info" | "success" | "gold";
}) {
  const toneClass =
    tone === "danger"
      ? "border-rose-300/30 bg-rose-400/15 text-rose-100"
      : tone === "warning"
        ? "border-amber-300/30 bg-amber-300/15 text-amber-100"
        : tone === "success"
          ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
          : tone === "gold"
            ? "border-yellow-300/30 bg-yellow-300/15 text-yellow-100"
            : "border-cyan-300/30 bg-cyan-300/15 text-cyan-100";
  return (
    <div className={`rounded-lg border p-3 ${toneClass}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-md bg-white/10 p-2">{icon}</span>
        <span className="text-lg font-semibold text-white">{value}</span>
      </div>
      <p className="mt-3 min-h-10 text-sm font-medium">{label}</p>
    </div>
  );
}

function SortableHead({
  activeKey,
  direction,
  label,
  onSort,
  sortKey,
}: {
  activeKey: QueueSortKey;
  direction: "asc" | "desc";
  label: string;
  onSort: (key: QueueSortKey) => void;
  sortKey: QueueSortKey;
}) {
  const active = activeKey === sortKey;
  return (
    <TableHead>
      <button className="flex items-center gap-1 text-left font-medium" type="button" onClick={() => onSort(sortKey)}>
        {label}
        <span className={active ? "text-emerald-800" : "text-muted-foreground"}>{active ? (direction === "asc" ? "↑" : "↓") : "↕"}</span>
      </button>
    </TableHead>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <Card className="border-emerald-100">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-md bg-emerald-50 p-2 text-emerald-800">{icon}</span>
          <span className="text-xl font-semibold text-emerald-950">{value}</span>
        </div>
        <p className="mt-4 min-h-10 text-sm font-medium text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function ReadinessRing({ score }: { score: number }) {
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-emerald-200 bg-white text-lg font-semibold text-emerald-950">
      {score}%
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div className={value >= 80 ? "h-full rounded-full bg-emerald-600" : value >= 50 ? "h-full rounded-full bg-yellow-500" : "h-full rounded-full bg-rose-500"} style={{ width: `${Math.max(0, Math.min(value, 100))}%` }} />
    </div>
  );
}

function MiniMetric({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-md bg-emerald-50 p-2 text-emerald-800">{icon}</span>
        <span className="font-semibold text-emerald-950">{value}</span>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function AlertFact({ label, value, urgent }: { label: string; value: ReactNode; urgent?: boolean }) {
  return (
    <div className={urgent ? "rounded-md border border-rose-100 bg-rose-50 p-2" : "rounded-md border bg-slate-50 p-2"}>
      <p className="text-[11px] font-medium uppercase text-muted-foreground">{label}</p>
      <div className={urgent ? "mt-1 text-sm font-semibold text-rose-800" : "mt-1 text-sm font-semibold text-emerald-950"}>{value}</div>
    </div>
  );
}

function SummaryCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

function Breakdown({ title, rows }: { title: string; rows: Array<{ label: string; count: number }> }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between rounded-md border bg-white p-3">
            <span className="text-sm font-medium text-emerald-950">{row.label}</span>
            <Badge tone="muted">{row.count}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
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

function ListBlock({ title, items, danger }: { title: string; items: string[]; danger?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-muted-foreground">{title}</p>
      <div className="mt-2 space-y-2">
        {items.map((item) => (
          <div key={item} className={danger ? "rounded-md border border-rose-100 bg-rose-50 p-2 text-sm text-rose-800" : "rounded-md border bg-white p-2 text-sm text-emerald-950"}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionBar({ labels }: { labels: string[] }) {
  return (
    <Card>
      <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        {labels.map((label) => (
          <Button key={label} variant="secondary" type="button">{label}</Button>
        ))}
      </CardContent>
    </Card>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" className="-ml-3" type="button" onClick={onClick}>
      <ArrowLeft className="h-4 w-4" />
      Back
    </Button>
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

function PriorityBadge({ priority }: { priority: ClinicalPriority }) {
  const tone = priority === "Urgent" ? "danger" : priority === "High" ? "warning" : priority === "Medium" ? "gold" : "muted";
  return <Badge tone={tone}>{priority}</Badge>;
}

function UrgencyBadge({ urgency }: { urgency: UrgencyLevel }) {
  const tone = urgency === "Emergency" ? "danger" : urgency === "Urgent" ? "warning" : urgency === "Soon" ? "gold" : "muted";
  return <Badge tone={tone}>{urgency}</Badge>;
}

function StatusBadge({ status }: { status: ClinicalStatus }) {
  const tone = status === "Ready for Hospital Submission" || status === "Final Recommendation Sent" || status === "Hospital Opinion Received"
    ? "success"
    : status === "Emergency Escalation" || status === "Not Recommended for Travel"
      ? "danger"
      : status === "Waiting for Documents" || status === "Internal Review Required"
        ? "warning"
        : "info";
  return <Badge tone={tone}>{status}</Badge>;
}

function ChecklistBadge({ status }: { status: ChecklistStatus }) {
  const tone = status === "Received" ? "success" : status === "Requested" ? "warning" : status === "Missing" ? "danger" : "muted";
  return <Badge tone={tone}>{status}</Badge>;
}

function OperationalChecklistBadge({ status }: { status: OperationalChecklistStatus }) {
  const tone = status === "Validated" || status === "Verified" ? "success" : status === "Received" ? "info" : status === "Rejected" ? "danger" : status === "Not Applicable" ? "muted" : "warning";
  return <Badge tone={tone}>{status}</Badge>;
}

function countBy<T extends ClinicalReviewRecord>(items: T[], key: keyof T) {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    const value = String(item[key]);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });
  return Array.from(counts.entries()).map(([label, count]) => ({ label, count }));
}

function compareQueueRows(a: ClinicalReviewRecord, b: ClinicalReviewRecord, key: QueueSortKey, direction: "asc" | "desc") {
  const priorityRank: Record<ClinicalPriority, number> = { Low: 1, Medium: 2, High: 3, Urgent: 4 };
  const getValue = (review: ClinicalReviewRecord) => {
    if (key === "priority") return priorityRank[review.priority];
    if (key === "stage") return queueStageForReview(review);
    return review[key];
  };
  const first = getValue(a);
  const second = getValue(b);
  const result = typeof first === "number" && typeof second === "number"
    ? first - second
    : String(first).localeCompare(String(second));
  return direction === "asc" ? result : -result;
}

function buildSpecialtyChecklist(review: ClinicalReviewRecord) {
  const requiredDocuments = Array.from(new Set([
    ...(specialtyRequiredDocuments[review.specialty] ?? specialtyRequiredDocuments[review.treatmentRequested] ?? []),
    "MRI Report",
    "MRI DICOM",
    "CT Scan",
    "PET Scan",
    "Pathology Report",
    "Histology Slides",
    "Laboratory Tests",
    "Operative Report",
    "Discharge Summary",
    "Passport",
    "Consent",
    "Insurance",
  ]));

  return requiredDocuments.map((documentName) => {
    const match = review.checklist.find((item) => documentMatches(item.item, documentName));
    const status = mapChecklistStatus(match?.status, review, documentName);
    return {
      item: documentName,
      status,
      dateReceived: status === "Verified" || status === "Validated" || status === "Received" ? match?.lastRequestedDate ?? review.submittedDate : "Pending",
      reviewer: status === "Missing" || status === "Requested" ? "Coordinator" : review.assignedReviewer,
      requestRecipient: match?.requestRecipient ?? requestRecipientForDocument(documentName),
      requestStatus: status === "Missing" ? "Not Requested" : status === "Requested" ? "Requested" : "Closed",
      requestedDate: match?.lastRequestedDate ?? review.submittedDate,
      reminderCount: status === "Missing" ? 0 : status === "Requested" ? 1 : 0,
      expectedDate: status === "Missing" || status === "Requested" ? expectedDocumentDate(review.submittedDate) : "Received",
      notes: match?.notes ?? `Required for ${review.specialty} clinical package.`,
    };
  });
}

function documentMatches(source: string, target: string) {
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normalizedSource = normalize(source);
  const normalizedTarget = normalize(target);
  return normalizedSource.includes(normalizedTarget) || normalizedTarget.includes(normalizedSource);
}

function mapChecklistStatus(status: ChecklistStatus | undefined, review: ClinicalReviewRecord, documentName: string): OperationalChecklistStatus {
  if (!status) {
    if (documentName === "Insurance") return "Not Applicable";
    return "Missing";
  }
  if (status === "Received") {
    return review.internalReviewStatus === "Approved" || review.communication.clinicalLeadApproved ? "Verified" : "Received";
  }
  if (status === "Not Applicable") return "Not Applicable";
  if (status === "Missing") return "Missing";
  if (status === "Requested") return "Requested";
  return "Missing";
}

function calculateClinicalReadinessScore(review: ClinicalReviewRecord, checklist: Array<{ status: OperationalChecklistStatus }>) {
  const parts = [
    documentCompletenessScore(checklist),
    clinicalReviewScore(review),
    validationScore(review),
    hospitalPackageScore(review),
    hospitalQuestionsScore(review),
    msoScore(review),
  ];
  return Math.round(parts.reduce((sum, value) => sum + value, 0) / parts.length);
}

function documentCompletenessScore(checklist: Array<{ status: OperationalChecklistStatus }>) {
  const points = checklist.reduce((sum, item) => {
    if (item.status === "Validated" || item.status === "Verified") return sum + 1;
    if (item.status === "Received") return sum + 0.7;
    if (item.status === "Not Applicable") return sum + 1;
    if (item.status === "Requested") return sum + 0.25;
    if (item.status === "Rejected") return sum + 0.2;
    return sum;
  }, 0);
  return Math.round((points / Math.max(checklist.length, 1)) * 100);
}

function validationScore(review: ClinicalReviewRecord) {
  if (review.internalReviewStatus === "Approved") return 100;
  if (review.internalReviewStatus === "In Review") return 60;
  if (review.internalReviewStatus === "Required") return 35;
  return 0;
}

function aiDraftScore(review: ClinicalReviewRecord) {
  if (review.aiDraftStatus === "Approved") return 100;
  if (review.aiDraftStatus === "Corrected") return 80;
  if (review.aiDraftStatus === "Generated") return 60;
  if (review.aiDraftStatus === "Returned for Revision") return 30;
  return 0;
}

function hospitalPackageScore(review: ClinicalReviewRecord) {
  if (review.status === "Hospital Review Requested" || review.status === "Hospital Opinion Received" || review.status === "Final Recommendation Sent") return 100;
  if (review.status === "Ready for Hospital Submission") return 90;
  if (review.hospitalPackage.submissionStatus.toLowerCase().includes("ready")) return 80;
  if (review.hospitalPackage.documentsIncluded.length > 0) return 45;
  return 0;
}

function clinicalReviewScore(review: ClinicalReviewRecord) {
  return Math.round((aiDraftScore(review) + validationScore(review)) / 2);
}

function hospitalQuestionsScore(review: ClinicalReviewRecord) {
  if (review.hospitalPackage.clinicalQuestions.length >= 3) return 100;
  if (review.hospitalPackage.clinicalQuestions.length > 0) return 70;
  return 25;
}

function msoScore(review: ClinicalReviewRecord) {
  if (review.msoTracker.length === 0) return 20;
  const complete = review.msoTracker.filter((item) => item.msoStatus === "Received" || item.status === "Complete").length;
  return Math.round((complete / review.msoTracker.length) * 100);
}

function patientOpinionScore(review: ClinicalReviewRecord) {
  const status = patientOpinionStatus(review);
  if (status === "Sent") return 100;
  if (status === "Approved") return 80;
  if (status === "Returned for Revision") return 35;
  return 20;
}

function patientOpinionStatus(review: ClinicalReviewRecord): "Draft" | "Approved" | "Sent" | "Returned for Revision" {
  if (review.status === "Preliminary Opinion Sent") return "Sent";
  if (review.preliminaryOpinion.approvalStatus === "Approved") return "Approved";
  if (review.preliminaryOpinion.approvalStatus === "Returned" || review.aiDraftStatus === "Returned for Revision") return "Returned for Revision";
  return "Draft";
}

function clinicalValidationStatus(review: ClinicalReviewRecord): "Pending Review" | "Corrections Required" | "Approved" | "Rejected" {
  if (review.status === "Not Recommended for Travel" && review.communication.clinicalLeadApproved) return "Approved";
  if (review.internalReviewStatus === "Approved" || review.communication.clinicalLeadApproved) return "Approved";
  if (review.internalReviewStatus === "Returned" || review.aiDraftStatus === "Returned for Revision") return "Corrections Required";
  if (review.status === "Not Recommended for Travel") return "Rejected";
  return "Pending Review";
}

function hospitalPackageStatus(review: ClinicalReviewRecord): "Draft" | "Building" | "Ready" | "Sent" | "MSO Received" {
  if (review.msoTracker.some((item) => item.msoStatus === "Received")) return "MSO Received";
  if (review.status === "Hospital Review Requested") return "Sent";
  if (review.status === "Ready for Hospital Submission" || review.hospitalPackage.submissionStatus.toLowerCase().includes("ready")) return "Ready";
  if (review.hospitalPackage.documentsIncluded.length > 0) return "Building";
  return "Draft";
}

function ethicalReviewSummary(review: ClinicalReviewRecord) {
  const veryLowBenefit = review.status === "Not Recommended for Travel";
  const benefit = veryLowBenefit ? "Very Low" : review.urgency === "Emergency" ? "Low" : review.priority === "Urgent" ? "Moderate" : "High";
  const recommendation = veryLowBenefit ? "Travel Not Recommended" : review.urgency === "Emergency" ? "Local Treatment First" : review.status === "Waiting for Documents" ? "Delay" : "Proceed";
  return {
    benefit,
    recommendation,
    patientDecision: veryLowBenefit ? "Continue Anyway" : "Pending",
    reason: veryLowBenefit ? review.preliminaryOpinion.emergencyRecommendation : review.preliminaryOpinion.travelSuitability,
  };
}

function requestRecipientForDocument(documentName: string) {
  const normalized = documentName.toLowerCase();
  if (normalized.includes("pathology") || normalized.includes("histology") || normalized.includes("operative") || normalized.includes("discharge")) {
    return "Family Contact";
  }
  if (normalized.includes("passport") || normalized.includes("consent") || normalized.includes("insurance")) {
    return "Patient";
  }
  return "Patient";
}

function expectedDocumentDate(submittedDate: string) {
  const date = new Date(`${submittedDate}T09:00:00`);
  if (Number.isNaN(date.getTime())) return "Pending";
  date.setDate(date.getDate() + 3);
  return date.toISOString().slice(0, 10);
}

function suggestedDestinationCountries(review: ClinicalReviewRecord) {
  if (review.specialty === "Oncology") return ["Turkey", "Germany", "India"];
  if (review.specialty === "Cardiac surgery") return ["Turkey", "India", "Thailand"];
  return ["Turkey", "Germany", "Thailand"];
}

function aiConfidenceLevel(review: ClinicalReviewRecord) {
  const documentScore = documentCompletenessScore(buildSpecialtyChecklist(review));
  if (review.aiDraftStatus === "Approved" && documentScore >= 75) return "High";
  if (review.aiDraftStatus === "Corrected" || documentScore >= 55) return "Medium";
  return "Low";
}

function workflowStageForReview(review: ClinicalReviewRecord) {
  if (review.status === "Waiting for Documents" || review.status === "Documents Incomplete") return "Missing Documents Management";
  if (review.aiDraftStatus === "Generated" || review.aiDraftStatus === "Corrected") return "AI Clinical Draft";
  if (review.internalReviewStatus === "Required" || review.internalReviewStatus === "In Review") return "Internal Clinical Validation";
  if (review.communication.clinicalLeadApproved && review.status !== "Ready for Hospital Submission") return "Clinical Lead Approval";
  if (review.status === "Ready for Hospital Submission") return "Hospital Package Builder";
  if (review.status === "Hospital Review Requested") return "Hospital MSO Request";
  if (review.status === "Hospital Opinion Received") return "Hospital MSO Received";
  if (review.status === "Final Recommendation Sent") return "Ready for Quotation";
  if (review.status === "Not Recommended for Travel") return "Clinical Recommendation";
  return "Document Completeness Review";
}

function msoDisplayStatus(status: string) {
  if (status === "Received") return "MSO Received";
  if (status === "Pending") return "Under Review";
  if (status === "Not Submitted") return "Requested";
  if (status === "Complete") return "Completed";
  return status || "Requested";
}

function msoOverallStatus(review: ClinicalReviewRecord) {
  if (review.msoTracker.length === 0) return "Requested";
  if (review.msoTracker.every((item) => item.status === "Complete" || item.msoStatus === "Received")) return "Completed";
  if (review.msoTracker.some((item) => item.msoStatus === "Received")) return "MSO Received";
  if (review.msoTracker.some((item) => item.status === "Open")) return "Awaiting Clarification";
  return "Under Review";
}

function clinicalRecommendationSummary(review: ClinicalReviewRecord): {
  outcome: string;
  reason: string;
  benefits: string;
  risks: string;
  tone: "default" | "muted" | "success" | "warning" | "danger" | "info" | "gold";
} {
  if (review.status === "Not Recommended for Travel") {
    return {
      outcome: review.urgency === "Emergency" ? "Seek Local Treatment First" : "Not Recommended for Travel",
      reason: review.preliminaryOpinion.localTreatmentRecommendation,
      benefits: "Avoids unsafe or low-benefit international travel while local stabilization is prioritized.",
      risks: review.preliminaryOpinion.redFlags.join(", ") || "Travel risk remains high.",
      tone: "warning",
    };
  }

  if (review.urgency === "Emergency") {
    return {
      outcome: "Travel After Local Stabilization",
      reason: review.preliminaryOpinion.emergencyRecommendation,
      benefits: "International care may be considered after the patient is stable enough for transfer.",
      risks: review.preliminaryOpinion.redFlags.join(", ") || "Emergency deterioration risk.",
      tone: "danger",
    };
  }

  if (review.priority === "Urgent") {
    return {
      outcome: "Travel Recommended with Urgency",
      reason: review.preliminaryOpinion.travelSuitability,
      benefits: "Specialist review abroad may help accelerate treatment planning.",
      risks: review.preliminaryOpinion.redFlags.join(", ") || "Urgent timeline requires close coordination.",
      tone: "gold",
    };
  }

  if (review.status === "Waiting for Documents") {
    return {
      outcome: "Observation Recommended",
      reason: "Clinical recommendation is pending until missing documents are received.",
      benefits: "Prevents premature hospital package submission.",
      risks: review.preliminaryOpinion.missingInformation.join(", ") || "Incomplete clinical record.",
      tone: "warning",
    };
  }

  return {
    outcome: "Travel Recommended",
    reason: review.preliminaryOpinion.travelSuitability,
    benefits: "Case appears suitable for hospital specialist review based on current documents.",
    risks: review.preliminaryOpinion.redFlags.join(", ") || "No major red flags recorded.",
    tone: "success",
  };
}

function readinessNextAction(review: ClinicalReviewRecord) {
  if (review.status === "Waiting for Documents" || review.status === "Documents Incomplete") return "Request missing documents and copy referral partner.";
  if (aiDraftScore(review) < 80) return "Generate or review AI clinical draft.";
  if (validationScore(review) < 80) return "Complete internal validation and clinical lead approval.";
  if (hospitalPackageScore(review) < 80) return "Build hospital submission package.";
  if (msoScore(review) < 100) return "Track hospital MSO request until response is received.";
  return "Ready for quotation workflow.";
}

function buildClinicalQueue(reviews: ClinicalReviewRecord[]) {
  const stages = clinicalQueueStages.reduce((acc, stage) => {
    acc[stage] = [];
    return acc;
  }, {} as Record<(typeof clinicalQueueStages)[number], ClinicalReviewRecord[]>);

  reviews.forEach((review) => {
    stages[queueStageForReview(review)].push(review);
  });

  return stages;
}

function queueStageForReview(review: ClinicalReviewRecord): (typeof clinicalQueueStages)[number] {
  if (review.urgency === "Emergency" || review.status === "Emergency Escalation") return "Emergency";
  if (review.status === "Waiting for Documents" || review.status === "Documents Incomplete") return "Waiting Documents";
  if (review.aiDraftStatus === "Generated" || review.aiDraftStatus === "Corrected") return "AI Draft Ready";
  if (review.internalReviewStatus === "In Review" || review.internalReviewStatus === "Required") return "Internal Review";
  if (review.internalReviewStatus === "Approved" && !review.communication.clinicalLeadApproved) return "Clinical Lead Approval";
  if (review.status === "Preliminary Opinion Sent" || review.status === "Preliminary Opinion Approved") return "Patient Opinion Sent";
  if (review.status === "Ready for Hospital Submission") return "Hospital Package Ready";
  if (review.status === "Hospital Review Requested") return "Waiting Hospital MSO";
  return "Completed";
}

function buildReviewerWorkload(reviews: ClinicalReviewRecord[]) {
  const grouped = new Map<string, ClinicalReviewRecord[]>();
  reviews.forEach((review) => {
    grouped.set(review.assignedReviewer, [...(grouped.get(review.assignedReviewer) ?? []), review]);
  });

  return Array.from(grouped.entries()).map(([name, items]) => {
    const urgent = items.filter((item) => item.priority === "Urgent" || item.urgency === "Emergency").length;
    const averageTime = Math.round(items.reduce((sum, item) => sum + item.reviewTimeHours, 0) / items.length);
    return {
      name,
      reviews: items.length,
      urgent,
      averageTime,
      status: urgent > 1 || items.length > 3 ? "At capacity" : "Available",
    };
  });
}

function buildCountryWorkload(reviews: ClinicalReviewRecord[]) {
  const grouped = new Map<string, ClinicalReviewRecord[]>();
  reviews.forEach((review) => {
    grouped.set(review.country, [...(grouped.get(review.country) ?? []), review]);
  });

  return Array.from(grouped.entries()).map(([country, items]) => ({
    country,
    reviewCount: items.length,
    averageTime: Math.round(items.reduce((sum, item) => sum + item.reviewTimeHours, 0) / items.length),
    waitingDocuments: items.filter((item) => item.status === "Waiting for Documents" || item.status === "Documents Incomplete").length,
    emergency: items.filter((item) => item.urgency === "Emergency" || item.status === "Emergency Escalation").length,
    revenueWaiting: items.filter((item) => isRevenueWaiting(item)).reduce((sum, item) => sum + estimateRevenue(item), 0),
  }));
}

function clinicalIssue(review: ClinicalReviewRecord) {
  if (review.urgency === "Emergency") return review.preliminaryOpinion.redFlags[0] ?? "Emergency review required";
  if (review.status === "Waiting for Documents") return review.preliminaryOpinion.missingInformation[0] ?? "Missing clinical documents";
  if (review.internalReviewStatus === "Required") return "Internal review required before patient opinion or hospital package";
  if (review.status === "Ready for Hospital Submission") return "Hospital package ready for submission";
  return review.documentStatus;
}

function isRevenueWaiting(review: ClinicalReviewRecord) {
  return (
    review.status === "Waiting for Documents" ||
    review.status === "Documents Incomplete" ||
    review.status === "Internal Review Required" ||
    review.internalReviewStatus === "Required" ||
    review.status === "Hospital Review Requested"
  );
}

function estimateRevenue(review: ClinicalReviewRecord) {
  return revenueBySpecialty[review.specialty] ?? 28000;
}

function formatMoney(value: number) {
  if (value >= 1000) return `$${Math.round(value / 1000)}k`;
  return `$${value}`;
}

function slaCountdown(value: string) {
  if (value === "Pending") return "Pending";
  const deadline = new Date(value.replace(" ", "T"));
  if (Number.isNaN(deadline.getTime())) return value;

  const referenceNow = new Date("2026-06-26T09:00:00");
  const hours = Math.round((deadline.getTime() - referenceNow.getTime()) / 36e5);
  if (hours < 0) return `Overdue ${Math.abs(hours)}h`;
  if (hours === 0) return "Due now";
  return `${hours}h left`;
}
