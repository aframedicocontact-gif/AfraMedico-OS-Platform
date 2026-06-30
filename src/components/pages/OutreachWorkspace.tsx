import { ArrowLeft, CalendarDays, FileText, Mail, NotebookPen, Phone, Plus, UsersRound } from "lucide-react";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import type { AppView } from "../../app/App";
import { recordLocalCommunication, outreachIntegrationAdapters } from "../../services/communicationService";
import {
  addOutreachContact,
  addOutreachDocument,
  addOutreachMeeting,
  addOutreachNote,
  addOutreachTask,
  getOutreachWorkspace,
  updatePartnershipStage,
} from "../../services/outreachService";
import { calculateRelationshipScores } from "../../services/relationshipService";
import type { Organization } from "../../types/organization";
import type {
  CommunicationType,
  OutreachPriority,
  OutreachTab,
  OutreachTaskStatus,
  PartnershipStage,
  PreferredCommunication,
} from "../../types/outreach";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { AiOutreachAssistant } from "../outreach/AiOutreachAssistant";
import { ExternalFieldLink } from "../common/ExternalFieldLink";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

type OutreachWorkspaceProps = {
  organization: Organization;
  onNavigate: (view: AppView) => void;
};

const tabs: OutreachTab[] = ["Overview", "Contacts", "Communications", "Tasks", "Meetings", "Documents", "Notes", "AI Assistant", "History"];
const stages: PartnershipStage[] = [
  "Discovered",
  "Qualified",
  "Contacted",
  "Meeting Scheduled",
  "Proposal Sent",
  "Negotiating",
  "Agreement Signed",
  "Active Partner",
  "Inactive",
];

export function OutreachWorkspace({ organization, onNavigate }: OutreachWorkspaceProps) {
  const [workspace, setWorkspace] = useState(() => getOutreachWorkspace(organization));
  const [activeTab, setActiveTab] = useState<OutreachTab>("Overview");
  const scores = useMemo(() => calculateRelationshipScores(organization, workspace), [organization, workspace]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Button
            variant="ghost"
            className="-ml-3 mb-2"
            type="button"
            onClick={() => onNavigate({ name: "organization-details", organizationId: organization.id })}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to organization
          </Button>
          <p className="text-sm font-medium text-primary">Outreach & Relationship Center</p>
          <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">{organization.name}</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Manage contacts, communications, follow-ups, meetings, notes, documents, and partnership progress.
          </p>
        </div>
        <Card className="w-full lg:w-[360px]">
          <CardContent className="p-4">
            <label className="text-xs font-medium uppercase text-muted-foreground">Partnership Pipeline</label>
            <Select
              className="mt-2"
              value={workspace.partnershipStage}
              onChange={(event) => setWorkspace(updatePartnershipStage(workspace, event.target.value as PartnershipStage))}
            >
              {stages.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </Select>
          </CardContent>
        </Card>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white p-2 shadow-sm">
        <div className="flex min-w-max gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={
                activeTab === tab
                  ? "rounded-md bg-emerald-950 px-3 py-2 text-sm font-medium text-white"
                  : "rounded-md px-3 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-50"
              }
              type="button"
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "Overview" ? (
        <OverviewTab organization={organization} scores={scores} workspace={workspace} />
      ) : null}
      {activeTab === "Contacts" ? (
        <ContactsTab workspace={workspace} onChange={setWorkspace} />
      ) : null}
      {activeTab === "Communications" ? (
        <CommunicationsTab workspace={workspace} onChange={setWorkspace} />
      ) : null}
      {activeTab === "Tasks" ? (
        <TasksTab workspace={workspace} onChange={setWorkspace} />
      ) : null}
      {activeTab === "Meetings" ? (
        <MeetingsTab workspace={workspace} onChange={setWorkspace} />
      ) : null}
      {activeTab === "Documents" ? (
        <DocumentsTab workspace={workspace} onChange={setWorkspace} />
      ) : null}
      {activeTab === "Notes" ? (
        <NotesTab workspace={workspace} onChange={setWorkspace} />
      ) : null}
      {activeTab === "AI Assistant" ? (
        <AiOutreachAssistant organization={organization} />
      ) : null}
      {activeTab === "History" ? (
        <HistoryTab workspace={workspace} />
      ) : null}
    </div>
  );
}

function OverviewTab({
  organization,
  scores,
  workspace,
}: {
  organization: Organization;
  scores: ReturnType<typeof calculateRelationshipScores>;
  workspace: ReturnType<typeof getOutreachWorkspace>;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader>
          <CardTitle>Relationship Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Metric label="Relationship Score" value={scores.relationshipScore} />
          <Metric label="Response Score" value={scores.responseScore} />
          <Metric label="Partnership Potential" value={scores.partnershipPotential} />
          <Metric label="Referral Potential" value={scores.referralPotential} />
          <Metric label="Strategic Value" value={scores.strategicValue} />
          <Metric label="Authority DR" value={organization.domainRating} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Workspace Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <SummaryLine label="Stage" value={workspace.partnershipStage} />
          <SummaryLine label="Contacts" value={workspace.contacts.length} />
          <SummaryLine label="Communications" value={workspace.communications.length} />
          <SummaryLine label="Open Tasks" value={workspace.tasks.filter((task) => task.status !== "Completed").length} />
          <SummaryLine label="Updated" value={workspace.updatedAt} />
        </CardContent>
      </Card>
    </div>
  );
}

function ContactsTab({ workspace, onChange }: WorkspaceTabProps) {
  const [form, setForm] = useState({
    fullName: "",
    position: "",
    department: "",
    email: "",
    phone: "",
    linkedin: "",
    decisionMaker: false,
    preferredCommunication: "Email" as PreferredCommunication,
    status: "New" as const,
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.fullName.trim()) return;
    onChange(addOutreachContact(workspace, form));
    setForm({ ...form, fullName: "", position: "", email: "", phone: "", linkedin: "" });
  }

  return (
    <WorkspaceSection
      title="Contacts"
      icon={<UsersRound className="h-4 w-4" />}
      form={
        <form className="grid gap-3 lg:grid-cols-4" onSubmit={submit}>
          <Input placeholder="Full Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <Input placeholder="Position" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
          <Input placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input placeholder="LinkedIn" value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} />
          <Select value={form.preferredCommunication} onChange={(e) => setForm({ ...form, preferredCommunication: e.target.value as PreferredCommunication })}>
            <option>Email</option>
            <option>Phone</option>
            <option>WhatsApp</option>
            <option>LinkedIn</option>
          </Select>
          <label className="flex items-center gap-2 text-sm">
            <input checked={form.decisionMaker} type="checkbox" onChange={(e) => setForm({ ...form, decisionMaker: e.target.checked })} />
            Decision Maker
          </label>
          <Button className="lg:col-span-4" type="submit"><Plus className="h-4 w-4" />Add Contact</Button>
        </form>
      }
    >
      <Table className="min-w-[1000px]">
        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Position</TableHead><TableHead>Department</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>LinkedIn</TableHead><TableHead>Decision Maker</TableHead><TableHead>Preferred</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
        <TableBody>{workspace.contacts.map((contact) => <TableRow key={contact.id}><TableCell>{contact.fullName}</TableCell><TableCell>{contact.position}</TableCell><TableCell>{contact.department}</TableCell><TableCell><ExternalFieldLink type="email" value={contact.email} /></TableCell><TableCell>{contact.phone || "Not found"}</TableCell><TableCell><ExternalFieldLink type="linkedin" value={contact.linkedin} /></TableCell><TableCell>{contact.decisionMaker ? "Yes" : "No"}</TableCell><TableCell>{contact.preferredCommunication}</TableCell><TableCell><Badge tone="info">{contact.status}</Badge></TableCell></TableRow>)}</TableBody>
      </Table>
    </WorkspaceSection>
  );
}

function CommunicationsTab({ workspace, onChange }: WorkspaceTabProps) {
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), type: "Email" as CommunicationType, subject: "", summary: "", outcome: "", nextAction: "" });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.subject.trim()) return;
    onChange(recordLocalCommunication(workspace, form));
    setForm({ ...form, subject: "", summary: "", outcome: "", nextAction: "" });
  }

  return (
    <WorkspaceSection title="Communications" icon={<Mail className="h-4 w-4" />} form={<CommunicationForm form={form} setForm={setForm} onSubmit={submit} />}>
      <Table className="min-w-[900px]">
        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Subject</TableHead><TableHead>Summary</TableHead><TableHead>Outcome</TableHead><TableHead>Next Action</TableHead></TableRow></TableHeader>
        <TableBody>{workspace.communications.map((item) => <TableRow key={item.id}><TableCell>{item.date}</TableCell><TableCell>{item.type}</TableCell><TableCell>{item.subject}</TableCell><TableCell>{item.summary}</TableCell><TableCell>{item.outcome}</TableCell><TableCell>{item.nextAction}</TableCell></TableRow>)}</TableBody>
      </Table>
      <div className="mt-4 flex flex-wrap gap-2">{outreachIntegrationAdapters.map((adapter) => <Badge key={adapter.provider} tone="muted">{adapter.provider} future</Badge>)}</div>
    </WorkspaceSection>
  );
}

function TasksTab({ workspace, onChange }: WorkspaceTabProps) {
  const [form, setForm] = useState({ title: "", assignedTo: "Growth", dueDate: new Date().toISOString().slice(0, 10), priority: "Medium" as OutreachPriority, status: "Open" as OutreachTaskStatus, reminder: "1 day before" });
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim()) return;
    onChange(addOutreachTask(workspace, form));
    setForm({ ...form, title: "" });
  }
  return <WorkspaceSection title="Tasks" icon={<Phone className="h-4 w-4" />} form={<TaskForm form={form} setForm={setForm} onSubmit={submit} />}><Table className="min-w-[800px]"><TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Assigned To</TableHead><TableHead>Due Date</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead>Reminder</TableHead></TableRow></TableHeader><TableBody>{workspace.tasks.map((task) => <TableRow key={task.id}><TableCell>{task.title}</TableCell><TableCell>{task.assignedTo}</TableCell><TableCell>{task.dueDate}</TableCell><TableCell><PriorityBadge value={task.priority} /></TableCell><TableCell>{task.status}</TableCell><TableCell>{task.reminder}</TableCell></TableRow>)}</TableBody></Table></WorkspaceSection>;
}

function MeetingsTab({ workspace, onChange }: WorkspaceTabProps) {
  const [title, setTitle] = useState("");
  function addMeeting() {
    if (!title.trim()) return;
    onChange(addOutreachMeeting(workspace, { date: new Date().toISOString().slice(0, 10), title, attendees: "To confirm", outcome: "Planned", nextAction: "Prepare agenda" }));
    setTitle("");
  }
  return <SimpleList title="Meetings" icon={<CalendarDays className="h-4 w-4" />} value={title} onChange={setTitle} onAdd={addMeeting} placeholder="Meeting title" rows={workspace.meetings.map((item) => [item.date, item.title, item.attendees, item.outcome, item.nextAction])} headers={["Date", "Title", "Attendees", "Outcome", "Next Action"]} />;
}

function DocumentsTab({ workspace, onChange }: WorkspaceTabProps) {
  const [title, setTitle] = useState("");
  function addDocument() {
    if (!title.trim()) return;
    onChange(addOutreachDocument(workspace, { title, documentType: "Partnership", status: "Draft", updatedAt: new Date().toISOString().slice(0, 10) }));
    setTitle("");
  }
  return <SimpleList title="Documents" icon={<FileText className="h-4 w-4" />} value={title} onChange={setTitle} onAdd={addDocument} placeholder="Document title" rows={workspace.documents.map((item) => [item.title, item.documentType, item.status, item.updatedAt])} headers={["Title", "Type", "Status", "Updated"]} />;
}

function NotesTab({ workspace, onChange }: WorkspaceTabProps) {
  const [note, setNote] = useState("");
  function addNote() {
    if (!note.trim()) return;
    onChange(addOutreachNote(workspace, { author: "Growth", note }));
    setNote("");
  }
  return <WorkspaceSection title="Notes" icon={<NotebookPen className="h-4 w-4" />} form={<div className="space-y-3"><textarea className="min-h-24 w-full rounded-md border p-3 text-sm" placeholder="Relationship note" value={note} onChange={(event) => setNote(event.target.value)} /><Button type="button" onClick={addNote}><Plus className="h-4 w-4" />Add Note</Button></div>}><div className="space-y-3">{workspace.notes.map((item) => <div key={item.id} className="rounded-md border bg-white p-3"><div className="flex justify-between gap-3 text-sm"><strong>{item.author}</strong><span className="text-muted-foreground">{item.date}</span></div><p className="mt-2 text-sm text-muted-foreground">{item.note}</p></div>)}</div></WorkspaceSection>;
}

function HistoryTab({ workspace }: Pick<WorkspaceTabProps, "workspace">) {
  const timeline = [...workspace.history].sort((a, b) => b.date.localeCompare(a.date));
  return <WorkspaceSection title="Unified History" icon={<CalendarDays className="h-4 w-4" />}><div className="space-y-3">{timeline.map((item) => <div key={item.id} className="relative pl-6"><span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-600 ring-4 ring-emerald-100" /><div className="rounded-md border bg-white p-3"><div className="flex flex-wrap items-center justify-between gap-2"><strong>{item.title}</strong><Badge tone="muted">{item.type}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{item.date}</p><p className="mt-2 text-sm text-muted-foreground">{item.detail}</p></div></div>)}</div></WorkspaceSection>;
}

type WorkspaceTabProps = {
  workspace: ReturnType<typeof getOutreachWorkspace>;
  onChange: (workspace: ReturnType<typeof getOutreachWorkspace>) => void;
};

function WorkspaceSection({ title, icon, form, children }: { title: string; icon: ReactNode; form?: ReactNode; children: ReactNode }) {
  return <Card><CardHeader><CardTitle className="flex items-center gap-2">{icon}{title}</CardTitle></CardHeader><CardContent className="space-y-5">{form ? <div className="rounded-lg border bg-slate-50 p-4">{form}</div> : null}<div className="overflow-x-auto">{children}</div></CardContent></Card>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border bg-white p-4"><p className="text-xs font-medium uppercase text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold text-emerald-950">{value}</p><div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-emerald-600" style={{ width: `${value}%` }} /></div></div>;
}

function SummaryLine({ label, value }: { label: string; value: string | number }) {
  return <div className="flex justify-between gap-4 border-b pb-2 last:border-0"><span className="text-muted-foreground">{label}</span><strong className="text-right text-emerald-950">{value}</strong></div>;
}

function PriorityBadge({ value }: { value: OutreachPriority }) {
  return <Badge tone={value === "High" ? "danger" : value === "Medium" ? "warning" : "muted"}>{value}</Badge>;
}

function CommunicationForm({ form, setForm, onSubmit }: { form: { date: string; type: CommunicationType; subject: string; summary: string; outcome: string; nextAction: string }; setForm: (value: { date: string; type: CommunicationType; subject: string; summary: string; outcome: string; nextAction: string }) => void; onSubmit: (event: FormEvent) => void }) {
  return <form className="grid gap-3 lg:grid-cols-3" onSubmit={onSubmit}><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /><Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as CommunicationType })}>{["Email", "Phone", "WhatsApp", "LinkedIn", "Meeting", "Video Call", "Conference"].map((type) => <option key={type}>{type}</option>)}</Select><Input placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /><Input placeholder="Summary" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /><Input placeholder="Outcome" value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })} /><Input placeholder="Next Action" value={form.nextAction} onChange={(e) => setForm({ ...form, nextAction: e.target.value })} /><Button className="lg:col-span-3" type="submit"><Plus className="h-4 w-4" />Record Communication</Button></form>;
}

function TaskForm({ form, setForm, onSubmit }: { form: { title: string; assignedTo: string; dueDate: string; priority: OutreachPriority; status: OutreachTaskStatus; reminder: string }; setForm: (value: { title: string; assignedTo: string; dueDate: string; priority: OutreachPriority; status: OutreachTaskStatus; reminder: string }) => void; onSubmit: (event: FormEvent) => void }) {
  return <form className="grid gap-3 lg:grid-cols-3" onSubmit={onSubmit}><Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /><Input placeholder="Assigned To" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} /><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /><Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as OutreachPriority })}><option>High</option><option>Medium</option><option>Low</option></Select><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as OutreachTaskStatus })}><option>Open</option><option>In Progress</option><option>Waiting</option><option>Completed</option></Select><Input placeholder="Reminder" value={form.reminder} onChange={(e) => setForm({ ...form, reminder: e.target.value })} /><Button className="lg:col-span-3" type="submit"><Plus className="h-4 w-4" />Create Follow-up Task</Button></form>;
}

function SimpleList({ title, icon, value, onChange, onAdd, placeholder, rows, headers }: { title: string; icon: ReactNode; value: string; onChange: (value: string) => void; onAdd: () => void; placeholder: string; rows: string[][]; headers: string[] }) {
  return <WorkspaceSection title={title} icon={icon} form={<div className="flex flex-col gap-3 sm:flex-row"><Input placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} /><Button type="button" onClick={onAdd}><Plus className="h-4 w-4" />Add</Button></div>}><Table className="min-w-[720px]"><TableHeader><TableRow>{headers.map((header) => <TableHead key={header}>{header}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.map((row, index) => <TableRow key={`${row[0]}-${index}`}>{row.map((cell, cellIndex) => <TableCell key={`${cell}-${cellIndex}`}>{cell}</TableCell>)}</TableRow>)}</TableBody></Table></WorkspaceSection>;
}
