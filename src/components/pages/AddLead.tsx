import { ArrowLeft, ClipboardList, FileSearch, Mail, Plane, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState, type FormEvent } from "react";
import type { AppView } from "../../app/App";
import {
  createLead,
  findLeadDuplicates,
  validateLeadInput,
  type CreateLeadInput,
} from "../../services/leadService";
import type { Lead } from "../../types/lead";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Select } from "../ui/select";

type AddLeadProps = {
  existingLeads: Lead[];
  onLeadCreated: (lead: Lead) => void;
  onNavigate: (view: AppView) => void;
};

const defaultLeadInput: CreateLeadInput = {
  patientId: "",
  patientName: "",
  dateOfBirth: "",
  country: "",
  city: "",
  nationality: "",
  phone: "",
  whatsapp: "",
  email: "",
  age: "",
  gender: "Female",
  preferredLanguage: "English",
  leadSource: "Website",
  interestedTreatment: "",
  medicalCondition: "",
  urgency: "Medium",
  preferredDestination: "Turkey",
  referralPartner: "",
  hospital: "",
  caseId: "",
  assignedCoordinator: "",
  caseStatus: "Active",
  currentStatus: "New",
  documentsReceived: "No",
  medicalReviewStatus: "Not Started",
  hospitalQuoteStatus: "Not Requested",
  estimatedTreatmentCost: "",
  expectedTravelDate: "",
  priority: "Medium",
  lastContact: new Date().toISOString().slice(0, 10),
  nextFollowUp: "",
  internalNotes: "",
};

export function AddLead({ existingLeads, onLeadCreated, onNavigate }: AddLeadProps) {
  const [form, setForm] = useState<CreateLeadInput>(defaultLeadInput);
  const [errors, setErrors] = useState<string[]>([]);
  const [savedDuplicateWarning, setSavedDuplicateWarning] = useState("");
  const duplicateResult = useMemo(
    () => findLeadDuplicates(form, existingLeads),
    [existingLeads, form],
  );

  function updateField<Key extends keyof CreateLeadInput>(key: Key, value: CreateLeadInput[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors([]);
    setSavedDuplicateWarning("");
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const validation = validateLeadInput(form);

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    const result = createLead(form, existingLeads);
    if (result.duplicateResult.hasDuplicate) {
      setSavedDuplicateWarning("Possible duplicate detected and saved for review.");
    }
    onLeadCreated(result.lead);
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
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
        <p className="text-sm font-medium text-primary">Lead Management</p>
        <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">Add New Lead</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Manual intake for potential patients. Saved leads appear immediately in the Lead Directory.
        </p>
      </div>

      {errors.length ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : null}

      {duplicateResult.hasDuplicate ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="warning">Possible duplicate</Badge>
            <span>
              Similar phone or email found for {duplicateResult.matches.map((lead) => lead.patientName).join(", ")}.
              Saving is still allowed.
            </span>
          </div>
        </div>
      ) : null}

      {savedDuplicateWarning ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {savedDuplicateWarning}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <FormSection icon={<UserRound className="h-4 w-4" />} title="Patient Details">
            <Field label="Patient ID" placeholder="PAT-1009" value={form.patientId} onChange={(value) => updateField("patientId", value)} />
            <Field label="Patient Name" placeholder="Amina Yusuf" value={form.patientName} onChange={(value) => updateField("patientName", value)} required />
            <Field label="Date of Birth" placeholder="1984-03-14" type="date" value={form.dateOfBirth} onChange={(value) => updateField("dateOfBirth", value)} />
            <Field label="Country" placeholder="Nigeria" value={form.country} onChange={(value) => updateField("country", value)} required />
            <Field label="City" placeholder="Lagos" value={form.city} onChange={(value) => updateField("city", value)} />
            <Field label="Nationality" placeholder="Nigerian" value={form.nationality} onChange={(value) => updateField("nationality", value)} />
            <Field label="Age" placeholder="42" type="number" value={form.age} onChange={(value) => updateField("age", value)} />
            <SelectField label="Gender" value={form.gender} onChange={(value) => updateField("gender", value)}>
              <option>Female</option>
              <option>Male</option>
              <option>Other</option>
            </SelectField>
            <Field label="Preferred Language" placeholder="English" value={form.preferredLanguage} onChange={(value) => updateField("preferredLanguage", value)} />
          </FormSection>

          <FormSection icon={<Mail className="h-4 w-4" />} title="Contact and Source">
            <Field label="Phone" placeholder="+234 800 000 0000" value={form.phone} onChange={(value) => updateField("phone", value)} />
            <Field label="WhatsApp" placeholder="+234 800 000 0000" value={form.whatsapp} onChange={(value) => updateField("whatsapp", value)} />
            <Field label="Email" placeholder="patient@example.com" type="email" value={form.email} onChange={(value) => updateField("email", value)} />
            <SelectField label="Lead Source" value={form.leadSource} onChange={(value) => updateField("leadSource", value as CreateLeadInput["leadSource"])}>
              <option>Website</option>
              <option>WhatsApp</option>
              <option>Facebook</option>
              <option>Instagram</option>
              <option>Google Search</option>
              <option>Google Ads</option>
              <option>YouTube</option>
              <option>Referral Partner</option>
              <option>Hospital</option>
              <option>Doctor</option>
              <option>NGO</option>
              <option>Conference</option>
              <option>University</option>
              <option>Phone Call</option>
              <option>Email</option>
              <option>Walk-in</option>
              <option>Other</option>
            </SelectField>
          </FormSection>

          <FormSection icon={<FileSearch className="h-4 w-4" />} title="Medical Need">
            <Field label="Interested Treatment" placeholder="Cardiac surgery" value={form.interestedTreatment} onChange={(value) => updateField("interestedTreatment", value)} required />
            <Field label="Medical Condition" placeholder="Brief condition summary" value={form.medicalCondition} onChange={(value) => updateField("medicalCondition", value)} />
            <SelectField label="Urgency" value={form.urgency} onChange={(value) => updateField("urgency", value as CreateLeadInput["urgency"])}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Urgent</option>
            </SelectField>
            <Field label="Preferred Destination" placeholder="Turkey" value={form.preferredDestination} onChange={(value) => updateField("preferredDestination", value)} />
            <Field label="Referral Partner" placeholder="Optional partner name" value={form.referralPartner} onChange={(value) => updateField("referralPartner", value)} />
            <Field label="Hospital" placeholder="Pending selection" value={form.hospital} onChange={(value) => updateField("hospital", value)} />
          </FormSection>

          <FormSection icon={<Plane className="h-4 w-4" />} title="Pipeline and Travel">
            <Field label="Case ID" placeholder="CASE-1009-CARDIAC" value={form.caseId} onChange={(value) => updateField("caseId", value)} />
            <Field label="Assigned Coordinator" placeholder="Maya" value={form.assignedCoordinator} onChange={(value) => updateField("assignedCoordinator", value)} />
            <SelectField label="Case Status" value={form.caseStatus} onChange={(value) => updateField("caseStatus", value as CreateLeadInput["caseStatus"])}>
              <option>Active</option>
              <option>Closed</option>
              <option>Reopened</option>
              <option>Future</option>
              <option>Lost</option>
            </SelectField>
            <SelectField label="Current Status" value={form.currentStatus} onChange={(value) => updateField("currentStatus", value as CreateLeadInput["currentStatus"])}>
              <option>New</option>
              <option>Contacted</option>
              <option>Medical Documents Requested</option>
              <option>Documents Received</option>
              <option>Medical Review</option>
              <option>Hospital Quotes Requested</option>
              <option>Hospital Quotes Received</option>
              <option>Patient Decision Pending</option>
              <option>Accepted</option>
              <option>Lost</option>
            </SelectField>
            <SelectField label="Documents Received" value={form.documentsReceived} onChange={(value) => updateField("documentsReceived", value as CreateLeadInput["documentsReceived"])}>
              <option>No</option>
              <option>Yes</option>
            </SelectField>
            <SelectField label="Medical Review Status" value={form.medicalReviewStatus} onChange={(value) => updateField("medicalReviewStatus", value as CreateLeadInput["medicalReviewStatus"])}>
              <option>Not Started</option>
              <option>Pending Documents</option>
              <option>In Review</option>
              <option>Completed</option>
            </SelectField>
            <SelectField label="Hospital Quote Status" value={form.hospitalQuoteStatus} onChange={(value) => updateField("hospitalQuoteStatus", value as CreateLeadInput["hospitalQuoteStatus"])}>
              <option>Not Requested</option>
              <option>Requested</option>
              <option>Received</option>
              <option>Sent to Patient</option>
            </SelectField>
            <Field label="Estimated Treatment Cost" placeholder="15000" type="number" value={form.estimatedTreatmentCost} onChange={(value) => updateField("estimatedTreatmentCost", value)} />
            <Field label="Expected Travel Date" placeholder="2026-08-01" type="date" value={form.expectedTravelDate} onChange={(value) => updateField("expectedTravelDate", value)} />
            <SelectField label="Priority" value={form.priority} onChange={(value) => updateField("priority", value as CreateLeadInput["priority"])}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Urgent</option>
            </SelectField>
          </FormSection>

          <FormSection icon={<ClipboardList className="h-4 w-4" />} title="Follow-up and Notes">
            <Field label="Last Contact" placeholder="2026-06-25" type="date" value={form.lastContact} onChange={(value) => updateField("lastContact", value)} />
            <Field label="Next Follow-up" placeholder="2026-06-28" type="date" value={form.nextFollowUp} onChange={(value) => updateField("nextFollowUp", value)} />
            <TextareaField label="Internal Notes" placeholder="Patient concerns, financial context, family decision maker, document gaps..." value={form.internalNotes} onChange={(value) => updateField("internalNotes", value)} />
          </FormSection>
        </div>

        <Card className="h-fit border-emerald-100 bg-emerald-50/50">
          <CardHeader>
            <CardTitle>Prototype Behavior</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>This intake validates the patient lead workflow before backend work begins.</p>
            <div className="rounded-md border bg-white p-3">
              <p className="font-medium text-emerald-950">Frontend-only</p>
              <p className="mt-1">Saved leads are stored in local development storage and appear in the lead directory.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button type="submit">
                Save Lead
              </Button>
              <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "lead-directory" })}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}

function FormSection({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="rounded-md bg-emerald-50 p-2 text-emerald-800">{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">{children}</CardContent>
    </Card>
  );
}

function Field({
  label,
  onChange,
  placeholder,
  required,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-medium">{label}{required ? " *" : ""}</span>
      <Input placeholder={placeholder} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectField({
  label,
  children,
  onChange,
  value,
}: {
  label: string;
  children: ReactNode;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      <Select value={value} onChange={(event) => onChange(event.target.value)}>{children}</Select>
    </label>
  );
}

function TextareaField({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="space-y-1.5 md:col-span-2">
      <span className="text-sm font-medium">{label}</span>
      <textarea
        className="min-h-28 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
