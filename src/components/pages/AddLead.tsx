import { ArrowLeft, ClipboardList, FileSearch, Mail, Plane, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import type { AppView } from "../../app/App";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Select } from "../ui/select";

type AddLeadProps = {
  onNavigate: (view: AppView) => void;
};

export function AddLead({ onNavigate }: AddLeadProps) {
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
        <p className="text-sm font-medium text-primary">Lead Management</p>
        <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">Add New Lead</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Prototype intake form for potential patients. Nothing is saved yet.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <FormSection icon={<UserRound className="h-4 w-4" />} title="Patient Details">
            <Field label="Patient ID" placeholder="PAT-1009" />
            <Field label="Patient Name" placeholder="Amina Yusuf" />
            <Field label="Date of Birth" placeholder="1984-03-14" />
            <Field label="Country" placeholder="Nigeria" />
            <Field label="City" placeholder="Lagos" />
            <Field label="Nationality" placeholder="Nigerian" />
            <Field label="Age" placeholder="42" />
            <SelectField label="Gender" defaultValue="Female">
              <option>Female</option>
              <option>Male</option>
              <option>Other</option>
            </SelectField>
            <Field label="Preferred Language" placeholder="English" />
          </FormSection>

          <FormSection icon={<Mail className="h-4 w-4" />} title="Contact and Source">
            <Field label="Phone" placeholder="+234 800 000 0000" />
            <Field label="WhatsApp" placeholder="+234 800 000 0000" />
            <Field label="Email" placeholder="patient@example.com" />
            <SelectField label="Lead Source" defaultValue="Website">
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
            <Field label="Interested Treatment" placeholder="Cardiac surgery" />
            <Field label="Medical Condition" placeholder="Brief condition summary" />
            <SelectField label="Urgency" defaultValue="Medium">
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Urgent</option>
            </SelectField>
            <Field label="Preferred Destination" placeholder="Turkey" />
            <Field label="Referral Partner" placeholder="Optional partner name" />
            <Field label="Hospital" placeholder="Pending selection" />
          </FormSection>

          <FormSection icon={<Plane className="h-4 w-4" />} title="Pipeline and Travel">
            <Field label="Case ID" placeholder="CASE-1009-CARDIAC" />
            <Field label="Assigned Coordinator" placeholder="Maya" />
            <SelectField label="Case Status" defaultValue="Active">
              <option>Active</option>
              <option>Closed</option>
              <option>Reopened</option>
              <option>Future</option>
              <option>Lost</option>
            </SelectField>
            <SelectField label="Current Status" defaultValue="New">
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
            <SelectField label="Documents Received" defaultValue="No">
              <option>No</option>
              <option>Yes</option>
            </SelectField>
            <SelectField label="Medical Review Status" defaultValue="Not Started">
              <option>Not Started</option>
              <option>Pending Documents</option>
              <option>In Review</option>
              <option>Completed</option>
            </SelectField>
            <SelectField label="Hospital Quote Status" defaultValue="Not Requested">
              <option>Not Requested</option>
              <option>Requested</option>
              <option>Received</option>
              <option>Sent to Patient</option>
            </SelectField>
            <Field label="Estimated Treatment Cost" placeholder="15000" />
            <Field label="Expected Travel Date" placeholder="2026-08-01" />
            <SelectField label="Priority" defaultValue="Medium">
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Urgent</option>
            </SelectField>
          </FormSection>

          <FormSection icon={<ClipboardList className="h-4 w-4" />} title="Follow-up and Notes">
            <Field label="Last Contact" placeholder="2026-06-25" />
            <Field label="Next Follow-up" placeholder="2026-06-28" />
            <TextareaField label="Internal Notes" placeholder="Patient concerns, financial context, family decision maker, document gaps..." />
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
              <p className="mt-1">Buttons return to the lead directory; no data is saved.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button type="button" onClick={() => onNavigate({ name: "lead-directory" })}>
                Preview complete
              </Button>
              <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "lead-directory" })}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
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

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      <Input placeholder={placeholder} />
    </label>
  );
}

function SelectField({ label, defaultValue, children }: { label: string; defaultValue: string; children: ReactNode }) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      <Select defaultValue={defaultValue}>{children}</Select>
    </label>
  );
}

function TextareaField({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="space-y-1.5 md:col-span-2">
      <span className="text-sm font-medium">{label}</span>
      <textarea
        className="min-h-28 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        placeholder={placeholder}
      />
    </label>
  );
}
