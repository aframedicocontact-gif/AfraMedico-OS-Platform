import { ArrowLeft, ClipboardList, FileSearch, Mail, Plane, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState, type FormEvent } from "react";
import type { AppView } from "../../app/App";
import {
  callingCodeOptions,
  countryOptions,
  getCountryOptionByName,
  nationalityOptions,
} from "../../data/countryDataset";
import {
  calculateLeadAge,
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
  phoneCountryCode: "+234",
  phoneLocalNumber: "",
  phone: "",
  whatsappCountryCode: "+234",
  whatsappLocalNumber: "",
  whatsapp: "",
  email: "",
  confirmEmail: "",
  emailVerified: "No",
  emailVerificationStatus: "Unverified",
  age: "",
  gender: "Female",
  preferredLanguage: "English",
  leadSource: "Website",
  interestedTreatment: "",
  medicalCondition: "",
  medicalHistory: "",
  urgency: "Medium",
  preferredDestination: "Türkiye",
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

const preferredLanguages = [
  "English",
  "French",
  "Spanish",
  "Arabic",
  "Persian (Farsi)",
  "Turkish",
  "Hindi",
  "Urdu",
  "Russian",
  "Chinese",
  "German",
  "Italian",
  "Portuguese",
];

const commonTreatments = [
  "Brain Surgery",
  "Cancer Treatment",
  "Oncology",
  "Cardiac Surgery",
  "IVF",
  "Orthopedics",
  "Robotic Surgery",
  "Neurosurgery",
  "Neurology",
  "Transplant",
  "Dental",
  "Hair Transplant",
  "Bariatric Surgery",
  "Plastic Surgery",
  "Ophthalmology",
  "Rehabilitation",
  "Diagnostics",
];

function buildInternationalNumber(countryCode: string, localNumber: string) {
  const cleanLocal = localNumber.replace(/\D/g, "");
  return countryCode && cleanLocal ? `${countryCode} ${cleanLocal}` : "";
}

export function AddLead({ existingLeads, onLeadCreated, onNavigate }: AddLeadProps) {
  const [form, setForm] = useState<CreateLeadInput>(() => ({
    ...defaultLeadInput,
    patientId: "Generated on save",
  }));
  const [errors, setErrors] = useState<string[]>([]);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [savedDuplicateWarning, setSavedDuplicateWarning] = useState("");
  const [saving, setSaving] = useState(false);
  const duplicateResult = useMemo(
    () => findLeadDuplicates(form, existingLeads),
    [existingLeads, form],
  );

  function updateField<Key extends keyof CreateLeadInput>(key: Key, value: CreateLeadInput[Key]) {
    setForm((current) => {
      const next = { ...current, [key]: value };

      if (key === "dateOfBirth") {
        next.age = String(calculateLeadAge(String(value)) || "");
      }

      if (key === "country") {
        const country = getCountryOptionByName(String(value));
        if (country) {
          next.nationality = current.nationality || country.nationality;
          next.phoneCountryCode = current.phoneCountryCode || country.callingCode;
          next.whatsappCountryCode = current.whatsappCountryCode || country.callingCode;
        }
      }

      if (key === "phoneCountryCode" || key === "phoneLocalNumber") {
        next.phone = buildInternationalNumber(next.phoneCountryCode, next.phoneLocalNumber);
      }

      if (key === "whatsappCountryCode" || key === "whatsappLocalNumber") {
        next.whatsapp = buildInternationalNumber(next.whatsappCountryCode, next.whatsappLocalNumber);
      }

      if (key === "email" || key === "confirmEmail") {
        const email = String(next.email).trim();
        const confirmEmail = String(next.confirmEmail).trim();
        const matched = Boolean(email && confirmEmail && email.toLowerCase() === confirmEmail.toLowerCase());
        next.emailVerified = matched ? "Yes" : "No";
        next.emailVerificationStatus = matched ? "Verified" : confirmEmail ? "Mismatch" : "Unverified";
      }

      return next;
    });
    setErrors([]);
    setInvalidFields([]);
    setSavedDuplicateWarning("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    const validation = validateLeadInput(form);
    const nextInvalidFields = [
      !form.patientName.trim() ? "patientName" : "",
      !form.country.trim() ? "country" : "",
      !form.dateOfBirth.trim() ? "dateOfBirth" : "",
      !form.interestedTreatment.trim() ? "interestedTreatment" : "",
      !form.phone.trim() && !form.phoneLocalNumber.trim() ? "phone" : "",
      !form.email.trim() ? "email" : "",
      !form.confirmEmail.trim() ? "confirmEmail" : "",
      form.email.trim() && form.confirmEmail.trim() && form.email.trim().toLowerCase() !== form.confirmEmail.trim().toLowerCase() ? "confirmEmail" : "",
      form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ? "email" : "",
      form.preferredDestination.trim() && !countryOptions.some((country) => country.name.toLowerCase() === form.preferredDestination.trim().toLowerCase()) ? "preferredDestination" : "",
    ].filter(Boolean);

    if (!validation.valid) {
      setErrors(validation.errors);
      setInvalidFields(nextInvalidFields);
      return;
    }

    setSaving(true);
    const result = await createLead(form, existingLeads);
    setSaving(false);
    if (!result.lead) {
      setErrors([result.error ?? "Unable to save Lead."]);
      return;
    }
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
            <Field label="Patient ID" placeholder="PAT-000001" value={form.patientId} onChange={() => undefined} readOnly />
            <Field label="Patient Name" placeholder="Amina Yusuf" value={form.patientName} onChange={(value) => updateField("patientName", value)} required invalid={invalidFields.includes("patientName")} />
            <Field label="Date of Birth" placeholder="1984-03-14" type="date" value={form.dateOfBirth} onChange={(value) => updateField("dateOfBirth", value)} required invalid={invalidFields.includes("dateOfBirth")} />
            <DatalistField label="Country" listId="country-options" placeholder="Nigeria" value={form.country} onChange={(value) => updateField("country", value)} required invalid={invalidFields.includes("country")} options={countryOptions.map((country) => country.name)} />
            <Field label="City" placeholder="Lagos" value={form.city} onChange={(value) => updateField("city", value)} />
            <DatalistField label="Nationality" listId="nationality-options" placeholder="Nigerian" value={form.nationality} onChange={(value) => updateField("nationality", value)} options={nationalityOptions} />
            <Field label="Age" placeholder="Calculated from DOB" type="number" value={form.age} onChange={() => undefined} readOnly />
            <SelectField label="Gender" value={form.gender} onChange={(value) => updateField("gender", value)}>
              <option>Female</option>
              <option>Male</option>
              <option>Other</option>
            </SelectField>
            <DatalistField label="Preferred Language" listId="language-options" placeholder="English" value={form.preferredLanguage} onChange={(value) => updateField("preferredLanguage", value)} options={preferredLanguages} />
          </FormSection>

          <FormSection icon={<Mail className="h-4 w-4" />} title="Contact and Source">
            <PhoneField label="Phone" code={form.phoneCountryCode} localNumber={form.phoneLocalNumber} onCodeChange={(value) => updateField("phoneCountryCode", value)} onLocalNumberChange={(value) => updateField("phoneLocalNumber", value)} invalid={invalidFields.includes("phone")} required />
            <PhoneField label="WhatsApp" code={form.whatsappCountryCode} localNumber={form.whatsappLocalNumber} onCodeChange={(value) => updateField("whatsappCountryCode", value)} onLocalNumberChange={(value) => updateField("whatsappLocalNumber", value)} />
            <Field label="Primary Email" placeholder="patient@example.com" type="email" value={form.email} onChange={(value) => updateField("email", value)} required invalid={invalidFields.includes("email")} />
            <Field label="Confirm Email" placeholder="patient@example.com" type="email" value={form.confirmEmail} onChange={(value) => updateField("confirmEmail", value)} required invalid={invalidFields.includes("confirmEmail")} />
            <Field label="Email Verified" placeholder="Derived" value={form.emailVerified} onChange={() => undefined} readOnly />
            <Field label="Verification Status" placeholder="Derived" value={form.emailVerificationStatus} onChange={() => undefined} readOnly />
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
            <DatalistField label="Interested Treatment" listId="treatment-options" placeholder="Cancer Treatment" value={form.interestedTreatment} onChange={(value) => updateField("interestedTreatment", value)} required invalid={invalidFields.includes("interestedTreatment")} options={commonTreatments} />
            <Field label="Medical Condition" placeholder="Brief condition summary" value={form.medicalCondition} onChange={(value) => updateField("medicalCondition", value)} />
            <SelectField label="Urgency" value={form.urgency} onChange={(value) => updateField("urgency", value as CreateLeadInput["urgency"])}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Urgent</option>
            </SelectField>
            <DatalistField label="Preferred Destination" listId="destination-options" placeholder="Turkey" value={form.preferredDestination} onChange={(value) => updateField("preferredDestination", value)} invalid={invalidFields.includes("preferredDestination")} options={countryOptions.map((country) => country.name)} />
            <Field label="Referral Partner" placeholder="Optional partner name" value={form.referralPartner} onChange={(value) => updateField("referralPartner", value)} />
            <Field label="Hospital" placeholder="Pending selection" value={form.hospital} onChange={(value) => updateField("hospital", value)} />
            <TextareaField label="Medical History" placeholder="Chief complaint, symptoms, diagnosis, previous treatments, current medications, past surgeries, chronic diseases, allergies, family history, smoking, alcohol, and other clinical notes..." value={form.medicalHistory} onChange={(value) => updateField("medicalHistory", value)} />
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
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Lead"}
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
  invalid,
  label,
  onChange,
  placeholder,
  readOnly,
  required,
  type = "text",
  value,
}: {
  invalid?: boolean;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  readOnly?: boolean;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-medium">{label}{required ? " *" : ""}</span>
      <Input
        className={[readOnly ? "bg-muted/40 text-muted-foreground" : "", invalid ? "border-red-400 bg-red-50" : ""].filter(Boolean).join(" ")}
        placeholder={placeholder}
        readOnly={readOnly}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function DatalistField({
  invalid,
  label,
  listId,
  onChange,
  options,
  placeholder,
  required,
  value,
}: {
  invalid?: boolean;
  label: string;
  listId: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  required?: boolean;
  value: string;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-medium">{label}{required ? " *" : ""}</span>
      <Input
        className={invalid ? "border-red-400 bg-red-50" : undefined}
        list={listId}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </label>
  );
}

function PhoneField({
  code,
  invalid,
  label,
  localNumber,
  onCodeChange,
  onLocalNumberChange,
  required,
}: {
  code: string;
  invalid?: boolean;
  label: string;
  localNumber: string;
  onCodeChange: (value: string) => void;
  onLocalNumberChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-medium">{label}{required ? " *" : ""}</span>
      <div className="grid grid-cols-[140px_1fr] gap-2">
        <Input className={invalid ? "border-red-400 bg-red-50" : undefined} list={`${label.toLowerCase()}-calling-codes`} value={code} onChange={(event) => onCodeChange(event.target.value)} placeholder="+234" />
        <Input className={invalid ? "border-red-400 bg-red-50" : undefined} value={localNumber} onChange={(event) => onLocalNumberChange(event.target.value)} placeholder="Local number only" inputMode="tel" />
      </div>
      <datalist id={`${label.toLowerCase()}-calling-codes`}>
        {callingCodeOptions.map((option) => (
          <option key={`${option.label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </datalist>
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
