import { ArrowLeft, ClipboardList, Globe2, Mail, SearchCheck } from "lucide-react";
import type { ReactNode } from "react";
import type { AppView } from "../../app/App";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Select } from "../ui/select";

type AddOrganizationProps = {
  onNavigate: (view: AppView) => void;
};

export function AddOrganization({ onNavigate }: AddOrganizationProps) {
  return (
    <div className="space-y-5">
      <div>
        <Button
          variant="ghost"
          className="-ml-3 mb-2"
          type="button"
          onClick={() => onNavigate({ name: "organizations" })}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <p className="text-sm font-medium text-primary">Authority target intake</p>
        <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">Add Organization</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Prototype intake flow for evaluating authority, outreach, and backlink potential. This form is frontend-only and does not save data.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <FormSection icon={<Globe2 className="h-4 w-4" />} title="Basic Information">
            <Field label="Organization Name" placeholder="Nigerian Medical Association" />
            <SelectField label="Country" defaultValue="Nigeria">
              <option>Nigeria</option>
              <option>Ghana</option>
              <option>Kenya</option>
              <option>Uganda</option>
              <option>Tanzania</option>
            </SelectField>
            <SelectField label="Category" defaultValue="Medical Associations">
              <option>Universities</option>
              <option>Teaching Hospitals</option>
              <option>Medical Associations</option>
              <option>NGOs</option>
              <option>Health Blogs</option>
              <option>News Media</option>
              <option>Business Directories</option>
            </SelectField>
            <Field label="Website" placeholder="https://example.org" />
          </FormSection>

          <FormSection icon={<Mail className="h-4 w-4" />} title="Contact Information">
            <Field label="Contact Person" placeholder="Secretariat, editor, faculty contact" />
            <Field label="Contact Email" placeholder="contact@example.org" />
            <Field label="LinkedIn" placeholder="https://www.linkedin.com/company/..." />
          </FormSection>

          <FormSection icon={<SearchCheck className="h-4 w-4" />} title="SEO / Authority">
            <SelectField label="Priority" defaultValue="high">
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </SelectField>
            <SelectField label="Status" defaultValue="research">
              <option value="research">Research</option>
              <option value="contacted">Contacted</option>
              <option value="in-discussion">In Discussion</option>
              <option value="partner">Partner</option>
              <option value="backlink-secured">Backlink Secured</option>
              <option value="rejected">Rejected</option>
            </SelectField>
            <SelectField label="Opportunity Type" defaultValue="Backlink">
              <option>Expert citation</option>
              <option>Backlink</option>
              <option>Directory listing</option>
              <option>Editorial mention</option>
              <option>Partnership</option>
              <option>Research collaboration</option>
            </SelectField>
            <Field label="Domain Authority / Domain Rating" placeholder="65" />
          </FormSection>

          <FormSection icon={<ClipboardList className="h-4 w-4" />} title="Outreach Notes">
            <TextareaField label="Notes" placeholder="Why this target matters, angle to use, credibility value, risks..." />
            <Field label="Next Step" placeholder="Send partnership brief, identify editor, verify listing policy..." />
            <Field label="Next Follow-up Date" placeholder="2026-07-01" />
          </FormSection>
        </div>

        <Card className="h-fit border-emerald-100 bg-emerald-50/50">
          <CardHeader>
            <CardTitle>Prototype Behavior</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Use this screen to evaluate whether the intake fields match the real workflow before backend work begins.
            </p>
            <div className="rounded-md border bg-white p-3">
              <p className="font-medium text-emerald-950">No data persistence</p>
              <p className="mt-1">The buttons return to the list so the click path can be reviewed.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button type="button" onClick={() => onNavigate({ name: "organizations" })}>
                Preview complete
              </Button>
              <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "organizations" })}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FormSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
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

function SelectField({
  label,
  defaultValue,
  children,
}: {
  label: string;
  defaultValue: string;
  children: ReactNode;
}) {
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
