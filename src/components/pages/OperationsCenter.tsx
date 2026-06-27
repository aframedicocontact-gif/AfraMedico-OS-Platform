import {
  ArrowRightLeft,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  Clock3,
  ListChecks,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import type { AppView } from "../../app/App";
import type {
  Department,
  DepartmentDashboard,
  Handoff,
  OperationsCase,
  OperationsData,
  OperationsPriority,
  OwnershipTransfer,
  WorkItem,
  WorkItemStatus,
} from "../../types/operations";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

type OperationsCenterProps = {
  data: OperationsData;
  page:
    | "dashboard"
    | "workboard"
    | "ownership"
    | "role-matrix"
    | "work-items"
    | "handoffs"
    | "department-dashboard";
  onNavigate: (view: AppView) => void;
};

const operationPages: Array<{ label: string; view: AppView }> = [
  { label: "Dashboard", view: { name: "operations-dashboard" } },
  { label: "Department Workboard", view: { name: "operations-workboard" } },
  { label: "Case Ownership", view: { name: "operations-ownership" } },
  { label: "Role Matrix", view: { name: "operations-role-matrix" } },
  { label: "Work Item Engine", view: { name: "operations-work-items" } },
  { label: "Handoff Center", view: { name: "operations-handoffs" } },
  { label: "Department Dashboard", view: { name: "operations-department-dashboard" } },
];

export function OperationsCenter({ data, page, onNavigate }: OperationsCenterProps) {
  return (
    <div className="space-y-6">
      <OperationsHeader page={page} onNavigate={onNavigate} />
      {page === "dashboard" ? <OperationsDashboard data={data} onNavigate={onNavigate} /> : null}
      {page === "workboard" ? <DepartmentWorkboard data={data} /> : null}
      {page === "ownership" ? <CaseOwnership transfers={data.ownershipTransfers} cases={data.cases} /> : null}
      {page === "role-matrix" ? <RoleMatrix data={data} /> : null}
      {page === "work-items" ? <WorkItemEngine workItems={data.workItems} onNavigate={onNavigate} /> : null}
      {page === "handoffs" ? <HandoffCenter handoffs={data.handoffs} /> : null}
      {page === "department-dashboard" ? <DepartmentDashboards dashboards={data.departmentDashboards} departments={data.departments} /> : null}
    </div>
  );
}

function OperationsHeader({ page, onNavigate }: Pick<OperationsCenterProps, "page" | "onNavigate">) {
  const title = pageTitle(page);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Operations & Role Management Framework</p>
          <h2 className="mt-1 text-2xl font-semibold text-emerald-950 sm:text-3xl">{title}</h2>
          <p className="mt-2 max-w-4xl text-sm text-muted-foreground">
            Track responsible departments, current owners, next owners, handoffs, role permissions, and work item accountability for every active case.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => onNavigate({ name: "operations-work-items" })}>
            <ListChecks className="h-4 w-4" />
            Open Work Items
          </Button>
          <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "operations-handoffs" })}>
            <ArrowRightLeft className="h-4 w-4" />
            Handoffs
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border bg-white p-2 shadow-sm">
        <div className="flex min-w-max gap-2">
          {operationPages.map((item) => (
            <Button
              key={item.label}
              className={currentPageName(page) === item.view.name ? "" : "bg-white text-emerald-950 ring-1 ring-border hover:bg-emerald-50"}
              type="button"
              variant={currentPageName(page) === item.view.name ? "primary" : "ghost"}
              onClick={() => onNavigate(item.view)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

function OperationsDashboard({ data, onNavigate }: { data: OperationsData; onNavigate: (view: AppView) => void }) {
  const casesByOwner = groupCount(data.cases, "currentOwner");
  const casesByDepartment = groupCount(data.cases, "currentDepartment");
  const waitingHandoffs = data.cases.filter((item) => item.waitingHandoff).length;
  const overdueTasks = data.workItems.filter((item) => item.status !== "Completed" && item.dueDate <= "2026-06-26").length;
  const emergencyTasks = data.workItems.filter((item) => item.priority === "Critical").length;
  const casesWithoutOwner = data.cases.filter((item) => item.ownerMissing || !item.currentOwner).length;
  const averageProcessingTime = Math.round(data.cases.reduce((sum, item) => sum + item.processingTimeHours, 0) / data.cases.length);
  const upcomingDeadlines = data.workItems.filter((item) => item.status !== "Completed").slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<BriefcaseBusiness />} label="Cases by Department" value={data.cases.length} helper="Active owned cases" />
        <MetricCard icon={<UserCheck />} label="Cases Waiting Handoff" value={waitingHandoffs} helper="Transfers requiring acceptance" tone="warning" />
        <MetricCard icon={<Clock3 />} label="Overdue Tasks" value={overdueTasks} helper="Need same-day attention" tone="danger" />
        <MetricCard icon={<BadgeCheck />} label="Average Processing Time" value={`${averageProcessingTime}h`} helper="Across active cases" tone="gold" />
        <MetricCard icon={<ListChecks />} label="Emergency Tasks" value={emergencyTasks} helper="Critical operational work" tone="danger" />
        <MetricCard icon={<Users />} label="Department Workload" value={data.departments.reduce((sum, department) => sum + department.activeTasks, 0)} helper="Open tasks across teams" />
        <MetricCard icon={<ShieldCheck />} label="Cases Without Owner" value={casesWithoutOwner} helper="Global rule: must remain zero" tone={casesWithoutOwner > 0 ? "danger" : "success"} />
        <MetricCard icon={<Clock3 />} label="Upcoming Deadlines" value={upcomingDeadlines.length} helper="Next visible due dates" tone="info" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Cases by Department</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {casesByDepartment.map((item) => (
              <ProgressRow key={item.label} label={item.label} value={item.count} max={data.cases.length} />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cases by Owner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {casesByOwner.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-md border bg-slate-50 px-3 py-2">
                <OwnerBadge owner={item.label} />
                <span className="text-sm font-semibold text-emerald-950">{item.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Upcoming Deadlines</CardTitle>
            <p className="text-sm text-muted-foreground">Work items that need operational attention next.</p>
          </div>
          <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "operations-work-items" })}>View all work items</Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow className="bg-emerald-50/70">
                  <TableHead>Task</TableHead>
                  <TableHead>Case</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingDeadlines.map((item) => (
                  <TableRow key={item.taskId}>
                    <TableCell>
                      <div className="font-medium text-emerald-950">{item.taskId}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </TableCell>
                    <TableCell>{item.caseId}</TableCell>
                    <TableCell><DepartmentBadge department={item.department} /></TableCell>
                    <TableCell><OwnerBadge owner={item.owner} /></TableCell>
                    <TableCell>{item.dueDate}</TableCell>
                    <TableCell><PriorityBadge priority={item.priority} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DepartmentWorkboard({ data }: { data: OperationsData }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {data.departments.map((department) => (
        <Card key={department.department}>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>{department.department}</CardTitle>
                <p className="text-sm text-muted-foreground">Lead: {department.lead}</p>
              </div>
              <DepartmentBadge department={department.department} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <MiniStat label="Current Cases" value={department.currentCases} />
              <MiniStat label="Active Tasks" value={department.activeTasks} />
              <MiniStat label="Urgent Tasks" value={department.urgentTasks} tone="danger" />
              <MiniStat label="Waiting Tasks" value={department.waitingTasks} tone="warning" />
              <MiniStat label="Completed Today" value={department.completedToday} tone="success" />
              <MiniStat label="Average SLA" value={department.averageSla} tone="gold" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CaseOwnership({ transfers, cases }: { transfers: OwnershipTransfer[]; cases: OperationsCase[] }) {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Active Ownership Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-[1150px]">
              <TableHeader>
                <TableRow className="bg-emerald-50/70">
                  <TableHead>Patient</TableHead>
                  <TableHead>Case</TableHead>
                  <TableHead>Current Department</TableHead>
                  <TableHead>Current Owner</TableHead>
                  <TableHead>Previous Owner</TableHead>
                  <TableHead>Next Department</TableHead>
                  <TableHead>Next Owner</TableHead>
                  <TableHead>Next Required Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.map((item) => (
                  <TableRow key={item.caseId}>
                    <TableCell className="font-medium text-emerald-950">{item.patientName}</TableCell>
                    <TableCell>{item.caseId}</TableCell>
                    <TableCell><DepartmentBadge department={item.currentDepartment} /></TableCell>
                    <TableCell><OwnerBadge owner={item.currentOwner} /></TableCell>
                    <TableCell>{item.previousOwner}</TableCell>
                    <TableCell><DepartmentBadge department={item.nextDepartment} /></TableCell>
                    <TableCell><OwnerBadge owner={item.nextOwner} /></TableCell>
                    <TableCell className="max-w-80">{item.nextRequiredAction}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        {transfers.map((transfer) => (
          <Card key={transfer.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{transfer.patient}</CardTitle>
                  <p className="text-sm text-muted-foreground">{transfer.caseId}</p>
                </div>
                <Badge tone={transfer.receivedBy === "Pending" ? "warning" : "success"}>{transfer.receivedBy === "Pending" ? "Awaiting Receipt" : "Received"}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Current Department" value={transfer.currentDepartment} />
                <Field label="Current Owner" value={transfer.currentOwner} />
                <Field label="Previous Owner" value={transfer.previousOwner} />
                <Field label="Next Owner" value={`${transfer.nextOwner} (${transfer.nextDepartment})`} />
                <Field label="Transfer Date" value={transfer.transferDate} />
                <Field label="Approved By" value={transfer.approvedBy} />
                <Field label="Received By" value={transfer.receivedBy} />
                <Field label="Transfer Reason" value={transfer.transferReason} />
              </div>
              <Timeline events={transfer.ownershipTimeline} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function RoleMatrix({ data }: { data: OperationsData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Matrix</CardTitle>
        <p className="text-sm text-muted-foreground">Visual-only permission planning for future role-based access control.</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="min-w-[1500px]">
            <TableHeader>
              <TableRow className="bg-emerald-50/70">
                <TableHead className="sticky left-0 z-10 bg-emerald-50">Permission</TableHead>
                {data.roleMatrix.roles.map((role) => (
                  <TableHead key={role} className="text-center">{role}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.roleMatrix.permissions.map((permission) => (
                <TableRow key={permission.permission}>
                  <TableCell className="sticky left-0 z-10 bg-white font-medium text-emerald-950">{permission.permission}</TableCell>
                  {data.roleMatrix.roles.map((role) => (
                    <TableCell key={role} className="text-center">
                      {permission.roles.includes(role) ? (
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200">
                          <Check className="h-4 w-4" />
                        </span>
                      ) : (
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-300 ring-1 ring-slate-200">-</span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function WorkItemEngine({ workItems, onNavigate }: { workItems: WorkItem[]; onNavigate: (view: AppView) => void }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<ListChecks />} label="Open Work Items" value={workItems.filter((item) => item.status !== "Completed").length} helper="Owned operational activities" />
        <MetricCard icon={<Clock3 />} label="Blocked or Waiting" value={workItems.filter((item) => item.status === "Blocked" || item.status === "Waiting").length} helper="Need escalation or follow-up" tone="warning" />
        <MetricCard icon={<ShieldCheck />} label="Critical Priority" value={workItems.filter((item) => item.priority === "Critical").length} helper="Highest operational risk" tone="danger" />
        <MetricCard icon={<UserCheck />} label="No Owner" value={workItems.filter((item) => !item.owner).length} helper="Global rule: must remain zero" tone="success" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Work Item Engine</CardTitle>
          <p className="text-sm text-muted-foreground">Every operational activity has an owner, priority, due date, status, related module, and action path.</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-[1400px]">
              <TableHeader>
                <TableRow className="bg-emerald-50/70">
                  <TableHead>Task ID</TableHead>
                  <TableHead>Case ID</TableHead>
                  <TableHead>Patient ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Related Module</TableHead>
                  <TableHead>Related Hospital</TableHead>
                  <TableHead>Related Partner</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workItems.map((item) => (
                  <TableRow key={item.taskId}>
                    <TableCell className="font-medium text-emerald-950">{item.taskId}</TableCell>
                    <TableCell>{item.caseId}</TableCell>
                    <TableCell>{item.patientId}</TableCell>
                    <TableCell><DepartmentBadge department={item.department} /></TableCell>
                    <TableCell><OwnerBadge owner={item.owner} /></TableCell>
                    <TableCell><PriorityBadge priority={item.priority} /></TableCell>
                    <TableCell>{item.dueDate}</TableCell>
                    <TableCell><StatusBadge status={item.status} /></TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="max-w-96">{item.description}</TableCell>
                    <TableCell>{item.relatedModule}</TableCell>
                    <TableCell>{item.relatedHospital}</TableCell>
                    <TableCell>{item.relatedPartner}</TableCell>
                    <TableCell>
                      <div className="flex min-w-max gap-2">
                        <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "case-profile", caseId: item.caseId })}>Open</Button>
                        <Button variant="ghost" type="button">Assign</Button>
                        <Button variant="ghost" type="button">Complete</Button>
                        <Button variant="ghost" type="button">Escalate</Button>
                        <Button variant="ghost" type="button">Transfer</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {workItems.map((item) => (
          <TaskCard key={item.taskId} item={item} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
}

function HandoffCenter({ handoffs }: { handoffs: Handoff[] }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {handoffs.map((handoff) => (
        <HandoffCard key={handoff.id} handoff={handoff} />
      ))}
    </div>
  );
}

function DepartmentDashboards({ dashboards, departments }: { dashboards: DepartmentDashboard[]; departments: OperationsData["departments"] }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {dashboards.map((dashboard) => {
        const workload = departments.find((department) => department.department === dashboard.department);
        return (
          <Card key={dashboard.department}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{dashboard.department}</CardTitle>
                  <p className="text-sm text-muted-foreground">{dashboard.focus}</p>
                </div>
                <DepartmentBadge department={dashboard.department} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {dashboard.metrics.map((metric) => (
                  <MiniStat key={metric.label} label={metric.label} value={metric.value} />
                ))}
              </div>
              {workload ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  <MiniStat label="Active Tasks" value={workload.activeTasks} />
                  <MiniStat label="Urgent" value={workload.urgentTasks} tone="danger" />
                  <MiniStat label="Average SLA" value={workload.averageSla} tone="gold" />
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function TaskCard({ item, onNavigate }: { item: WorkItem; onNavigate: (view: AppView) => void }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{item.taskId}</CardTitle>
            <p className="text-sm text-muted-foreground">{item.patientName} | {item.caseId}</p>
          </div>
          <PriorityBadge priority={item.priority} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{item.description}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Department" value={item.department} />
          <Field label="Owner" value={item.owner} />
          <Field label="Status" value={item.status} />
          <Field label="Due" value={item.dueDate} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "case-profile", caseId: item.caseId })}>Open</Button>
          <Button variant="ghost" type="button">Assign</Button>
          <Button variant="ghost" type="button">Complete</Button>
          <Button variant="ghost" type="button">Escalate</Button>
          <Button variant="ghost" type="button">Transfer</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function HandoffCard({ handoff }: { handoff: Handoff }) {
  const state = handoff.rejected ? "Rejected" : handoff.accepted ? "Accepted" : "Pending";
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{handoff.id}</CardTitle>
            <p className="text-sm text-muted-foreground">{handoff.fromDepartment} to {handoff.toDepartment}</p>
          </div>
          <Badge tone={state === "Accepted" ? "success" : state === "Rejected" ? "danger" : "warning"}>{state}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="From User" value={handoff.fromUser} />
          <Field label="To User" value={handoff.toUser} />
          <Field label="Reason" value={handoff.reason} />
          <Field label="Timestamp" value={handoff.timestamp} />
          <Field label="Accepted" value={handoff.accepted ? "Yes" : "No"} />
          <Field label="Rejected" value={handoff.rejected ? "Yes" : "No"} />
          <Field label="Notes" value={handoff.notes} />
        </div>
        <Timeline events={handoff.auditTrail} />
      </CardContent>
    </Card>
  );
}

function MetricCard({ icon, label, value, helper, tone = "success" }: { icon: React.ReactNode; label: string; value: number | string; helper: string; tone?: "success" | "warning" | "danger" | "gold" | "info" }) {
  const iconTone = {
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-rose-50 text-rose-700",
    gold: "bg-yellow-50 text-yellow-700",
    info: "bg-sky-50 text-sky-700",
  }[tone];

  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-5">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconTone}`}>
          <span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-950">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value, tone = "info" }: { label: string; value: number | string; tone?: "info" | "success" | "warning" | "danger" | "gold" }) {
  const border = {
    info: "border-sky-100 bg-sky-50/60",
    success: "border-emerald-100 bg-emerald-50/70",
    warning: "border-amber-100 bg-amber-50/70",
    danger: "border-rose-100 bg-rose-50/70",
    gold: "border-yellow-100 bg-yellow-50/70",
  }[tone];

  return (
    <div className={`rounded-md border p-3 ${border}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-emerald-950">{value}</p>
    </div>
  );
}

function ProgressRow({ label, value, max }: { label: string; value: number; max: number }) {
  const percent = Math.round((value / Math.max(max, 1)) * 100);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-emerald-950">{label}</span>
        <span className="text-muted-foreground">{value} cases</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-600" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function DepartmentBadge({ department }: { department: Department }) {
  const tone = department === "Clinical" ? "success" : department === "Finance" ? "gold" : department === "Travel" ? "info" : department === "Executive" ? "danger" : "muted";
  return <Badge tone={tone}>{department}</Badge>;
}

function OwnerBadge({ owner }: { owner: string }) {
  return <Badge tone={owner ? "info" : "danger"}>{owner || "No Owner"}</Badge>;
}

function PriorityBadge({ priority }: { priority: OperationsPriority }) {
  const tone = priority === "Critical" ? "danger" : priority === "High" ? "warning" : priority === "Medium" ? "gold" : "muted";
  return <Badge tone={tone}>{priority}</Badge>;
}

function StatusBadge({ status }: { status: WorkItemStatus }) {
  const tone = status === "Completed" ? "success" : status === "Blocked" || status === "Escalated" ? "danger" : status === "Waiting" ? "warning" : "info";
  return <Badge tone={tone}>{status}</Badge>;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-slate-50 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-emerald-950">{value}</p>
    </div>
  );
}

function Timeline({ events }: { events: Array<{ timestamp: string; user: string; action: string; notes: string }> }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-emerald-950">Audit Trail</p>
      {events.map((event) => (
        <div key={`${event.timestamp}-${event.action}`} className="border-l-2 border-emerald-200 pl-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{event.timestamp}</span>
            <span>|</span>
            <span>{event.user}</span>
          </div>
          <p className="mt-1 text-sm font-medium text-emerald-950">{event.action}</p>
          <p className="text-sm text-muted-foreground">{event.notes}</p>
        </div>
      ))}
    </div>
  );
}

function groupCount<T extends Record<string, unknown>>(items: T[], key: keyof T) {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    const value = String(item[key]);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });
  return Array.from(counts.entries()).map(([label, count]) => ({ label, count }));
}

function pageTitle(page: OperationsCenterProps["page"]) {
  const titles: Record<OperationsCenterProps["page"], string> = {
    dashboard: "Operations Dashboard",
    workboard: "Department Workboard",
    ownership: "Case Ownership",
    "role-matrix": "Role Matrix",
    "work-items": "Work Item Engine",
    handoffs: "Handoff Center",
    "department-dashboard": "Department Dashboard",
  };
  return titles[page];
}

function currentPageName(page: OperationsCenterProps["page"]): AppView["name"] {
  const names: Record<OperationsCenterProps["page"], AppView["name"]> = {
    dashboard: "operations-dashboard",
    workboard: "operations-workboard",
    ownership: "operations-ownership",
    "role-matrix": "operations-role-matrix",
    "work-items": "operations-work-items",
    handoffs: "operations-handoffs",
    "department-dashboard": "operations-department-dashboard",
  };
  return names[page];
}
