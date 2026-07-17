import { ArrowLeft, BadgeDollarSign, Building2, ClipboardList, Mail, Stethoscope } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ReferralPartnerNav } from "../referrals/referralUi";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Select } from "../ui/select";

export function AddPartner() {
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <ReferralPartnerNav current="directory" />

      <div>
        <Button
          variant="ghost"
          className="-ml-3 mb-2"
          type="button"
          onClick={() => navigate("/referrals/directory")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <p className="text-sm font-medium text-primary">Referral Partner CRM</p>
        <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">Add Partner</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Prototype intake form for partner referral channels. Nothing is saved yet.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <FormSection icon={<Building2 className="h-4 w-4" />} title="Partner Information">
            <Field label="Organization Name" placeholder="Lagos Executive Clinic" />
            <Field label="Contact Person" placeholder="Dr. Adaeze Okonkwo" />
            <Field label="Country" placeholder="Nigeria" />
            <Field label="City" placeholder="Lagos" />
            <SelectField label="Partner Type" defaultValue="Physicians">
              <option>Physicians</option>
              <option>Specialist Clinics</option>
              <option>Diagnostic Centers</option>
              <option>NGOs</option>
              <option>HMOs / Insurance</option>
              <option>Travel Agencies</option>
              <option>Medical Facilitators</option>
              <option>Corporate Organizations</option>
            </SelectField>
            <Field label="Website" placeholder="https://example.org" />
          </FormSection>

          <FormSection icon={<Stethoscope className="h-4 w-4" />} title="Referral Focus">
            <Field label="Specialties" placeholder="Cardiology, oncology, diagnostics" />
            <Field label="Treatments Referred" placeholder="Cardiac surgery, IVF, oncology" />
            <SelectField label="Referral Status" defaultValue="Prospect">
              <option>Prospect</option>
              <option>Contacted</option>
              <option>Meeting Scheduled</option>
              <option>Negotiation</option>
              <option>Agreement Signed</option>
              <option>Active Referrer</option>
              <option>Inactive</option>
            </SelectField>
            <SelectField label="Agreement Status" defaultValue="Not Started">
              <option>Not Started</option>
              <option>Draft Sent</option>
              <option>Under Review</option>
              <option>Signed</option>
              <option>Paused</option>
            </SelectField>
          </FormSection>

          <FormSection icon={<Mail className="h-4 w-4" />} title="Contact Channels">
            <Field label="Phone" placeholder="+234 800 000 0000" />
            <Field label="Email" placeholder="partner@example.org" />
            <Field label="WhatsApp" placeholder="+234 800 000 0000" />
            <Field label="Last Contact" placeholder="2026-06-25" />
            <Field label="Next Follow-up" placeholder="2026-07-01" />
          </FormSection>

          <FormSection icon={<BadgeDollarSign className="h-4 w-4" />} title="Commercial Model">
            <SelectField label="Commission Model" defaultValue="Case-by-case">
              <option>Flat referral fee</option>
              <option>Percentage of net revenue</option>
              <option>No commission</option>
              <option>Case-by-case</option>
            </SelectField>
            <Field label="Patients Referred" placeholder="0" />
            <Field label="Estimated Revenue" placeholder="0" />
          </FormSection>

          <FormSection icon={<ClipboardList className="h-4 w-4" />} title="Notes">
            <TextareaField label="Notes" placeholder="Partner fit, patient type, risk, agreement notes, next action..." />
          </FormSection>
        </div>

        <Card className="h-fit border-emerald-100 bg-emerald-50/50">
          <CardHeader>
            <CardTitle>Prototype Behavior</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>This form validates referral partner intake before backend work begins.</p>
            <div className="rounded-md border bg-white p-3">
              <p className="font-medium text-emerald-950">Frontend-only</p>
              <p className="mt-1">Buttons return to the directory; no data is saved.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button type="button" onClick={() => navigate("/referrals/directory")}>
                Preview complete
              </Button>
              <Button variant="secondary" type="button" onClick={() => navigate("/referrals/directory")}>
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
