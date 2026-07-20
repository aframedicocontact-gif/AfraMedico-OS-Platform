import { useEffect, useRef, useState, type FormEvent, type RefObject, type ReactNode } from "react";
import {
  callingCodeOptions,
  countryOptions,
  getCountryOptionByName,
  nationalityOptions,
} from "../../data/countryDataset";
import { buildInternationalNumber, commonTreatments, preferredLanguages } from "../../lib/leadIntakeSchema";
import {
  getPartnerAgreementDownloadUrl,
  getPartnerDashboard,
  signPartnerAgreementV2,
  submitPartnerPatientReferral,
} from "../../services/partnerPortalService";
import type { PartnerPortalDashboard as DashboardData } from "../../types/partnerRecord";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { SignaturePad, type SignaturePadHandle } from "../ui/SignaturePad";

type Props = { onSignOut: () => void; onProfileIncomplete: () => void };

type PartnerReferralFormState = {
  patient_full_name: string;
  date_of_birth: string;
  patient_country: string;
  city: string;
  nationality: string;
  gender: string;
  preferred_language: string;
  phone_country_code: string;
  phone_local_number: string;
  patient_phone: string;
  whatsapp_country_code: string;
  whatsapp_local_number: string;
  whatsapp: string;
  patient_email: string;
  confirm_email: string;
  requested_treatment: string;
  medical_condition: string;
  urgency: string;
  preferred_destination: string;
  medical_history: string;
  initial_records_ready: boolean;
  patient_consent_confirmed: boolean;
};

export function PartnerDashboard({ onSignOut, onProfileIncomplete }: Props) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAgreement, setShowAgreement] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [acceptAgreement, setAcceptAgreement] = useState(false);
  const [acceptSignature, setAcceptSignature] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const padRef = useRef<SignaturePadHandle>(null);
  const [padEmpty, setPadEmpty] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    const result = await getPartnerDashboard();
    setLoading(false);
    if (result.error || !result.data) {
      if (result.error?.toLowerCase().includes("complete your partner profile")) {
        onProfileIncomplete();
        return;
      }
      setError(result.error ?? "Unable to load your Partner Dashboard.");
      return;
    }
    setData(result.data);
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleSign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!padRef.current || padRef.current.isEmpty()) {
      setError("Draw your signature to sign the Agreement.");
      return;
    }
    setSaving(true);
    setError(null);
    const result = await signPartnerAgreementV2({
      signature_strokes: padRef.current.getStrokes(),
      accepted_agreement: acceptAgreement,
      accepted_electronic_signature: acceptSignature,
      accepted_privacy: acceptPrivacy,
    });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setMessage("Agreement signed. Waiting for AfraMedico to countersign.");
    setShowAgreement(false);
    padRef.current.clear();
    setPadEmpty(true);
    await load();
  }

  async function handleDownload() {
    if (!data) return;
    setDownloading(true);
    setError(null);
    const result = await getPartnerAgreementDownloadUrl(data.agreement.id);
    setDownloading(false);
    if (result.error || !result.data) {
      setError(result.error ?? "Unable to generate a download link.");
      return;
    }
    window.open(result.data.url, "_blank", "noopener,noreferrer");
  }

  if (loading) {
    return (
      <PortalShell onSignOut={onSignOut}>
        <p className="text-sm text-muted-foreground">Loading your Partner Dashboard...</p>
      </PortalShell>
    );
  }

  return (
    <PortalShell onSignOut={onSignOut}>
      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      {message ? <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div> : null}
      {data ? (
        <>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700">{data.partner.partner_code}</p>
              <h1 className="text-3xl font-semibold text-emerald-950">Welcome, {data.profile.legal_full_name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">Your secure AfraMedico Partner workspace</p>
            </div>
            <Badge className={data.can_submit_referral ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>
              {data.can_submit_referral ? "Active Partner" : "Agreement Pending"}
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Summary title="Profile" value="Completed" detail={data.partner.country ?? "-"} />
            <Summary title="Agreement" value={agreementStatusLabel(data.agreement.status)} detail={`Version ${data.agreement.template_version}`} />
            <Summary title="Commission" value={`${Number(data.agreement.commission_rate)}%`} detail="of AfraMedico Net Referral Revenue" />
          </div>

          <Card>
            <CardHeader><CardTitle>Partner Agreement</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Review the simple standard agreement, including continuing patient attribution, the 40% commission,
                invoicing, and tax terms.
              </p>
              {data.agreement.status === "pending_aframedico_signature" ? (
                <p className="text-sm text-amber-700">
                  You signed on {new Date(data.agreement.partner_signed_at ?? "").toLocaleDateString()}. Waiting for AfraMedico to countersign.
                </p>
              ) : null}
              {data.agreement.status === "fully_executed" ? (
                <p className="text-sm text-emerald-700">
                  Fully executed on {new Date(data.agreement.fully_executed_at ?? "").toLocaleDateString()}.
                </p>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => setShowAgreement((value) => !value)}>
                  {data.agreement.status === "fully_executed" ? "View Agreement" : "Review Agreement"}
                </Button>
                {data.agreement.status === "fully_executed" && data.agreement.has_final_pdf ? (
                  <Button variant="secondary" disabled={downloading} onClick={handleDownload}>
                    {downloading ? "Preparing..." : "Download Signed Agreement"}
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {showAgreement ? (
            <AgreementPanel
              data={data}
              padRef={padRef}
              padEmpty={padEmpty}
              onPadChange={setPadEmpty}
              acceptAgreement={acceptAgreement}
              acceptSignature={acceptSignature}
              acceptPrivacy={acceptPrivacy}
              setAcceptAgreement={setAcceptAgreement}
              setAcceptSignature={setAcceptSignature}
              setAcceptPrivacy={setAcceptPrivacy}
              saving={saving}
              onSubmit={handleSign}
            />
          ) : null}

          <Card>
            <CardHeader><CardTitle>Patient Referrals</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Register a patient with consent, contact details, identity details, and medical intake information.
                AfraMedico staff will manage the resulting Lead through the internal Lead Management workflow.
              </p>
              <Button disabled={!data.can_submit_referral} onClick={() => setShowReferral((value) => !value)}>
                {data.can_submit_referral ? "New Patient Referral" : "Complete Agreement Signing to Enable Referrals"}
              </Button>
              {showReferral && data.can_submit_referral ? (
                <ReferralForm
                  onSaved={async (code, leadCode) => {
                    setMessage(`Referral ${code} submitted successfully${leadCode ? ` and linked to Lead ${leadCode}` : ""}.`);
                    setShowReferral(false);
                    await load();
                  }}
                  setError={setError}
                />
              ) : null}
              <div className="space-y-2">
                {data.referrals.map((referral) => (
                  <div className="grid gap-2 rounded-md border p-3 text-sm md:grid-cols-4" key={referral.id}>
                    <strong>{referral.lead_code ?? referral.referral_code}</strong>
                    <span>{referral.patient_full_name}</span>
                    <span>{referral.requested_treatment}</span>
                    <span>{(referral.pipeline_stage ?? referral.lead_status ?? referral.referral_status).replaceAll("_", " ")}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </PortalShell>
  );
}

function PortalShell({ children, onSignOut }: { children: ReactNode; onSignOut: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-emerald-950 px-4 py-4 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">AfraMedico Partner Network</p>
            <p className="font-semibold">Partner Dashboard</p>
          </div>
          <Button variant="secondary" onClick={onSignOut}>Sign out</Button>
        </div>
      </header>
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">{children}</main>
    </div>
  );
}

function Summary({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs font-medium uppercase text-muted-foreground">{title}</p>
        <p className="mt-2 text-xl font-semibold text-emerald-950">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function agreementStatusLabel(status: DashboardData["agreement"]["status"]) {
  if (status === "fully_executed") return "Fully Executed";
  if (status === "pending_aframedico_signature") return "Awaiting AfraMedico";
  if (status === "signed") return "Signed (v1)";
  return "Signature Required";
}

type AgreementPanelProps = {
  data: DashboardData;
  padRef: RefObject<SignaturePadHandle | null>;
  padEmpty: boolean;
  onPadChange: (isEmpty: boolean) => void;
  acceptAgreement: boolean;
  acceptSignature: boolean;
  acceptPrivacy: boolean;
  setAcceptAgreement: (value: boolean) => void;
  setAcceptSignature: (value: boolean) => void;
  setAcceptPrivacy: (value: boolean) => void;
  saving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function AgreementPanel(props: AgreementPanelProps) {
  const { data } = props;
  const canSubmit = data.agreement.status === "pending_partner_signature" || data.agreement.status === "pending_signature";
  return (
    <Card>
      <CardHeader><CardTitle>{data.agreement.title}</CardTitle></CardHeader>
      <CardContent>
        <div className="max-h-[32rem] overflow-y-auto whitespace-pre-wrap rounded-md border bg-white p-5 text-sm leading-6">
          {data.agreement.agreement_text}
        </div>
        {canSubmit ? (
          <form className="mt-5 space-y-4" onSubmit={props.onSubmit}>
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Signing as</p>
              <p className="text-sm font-semibold text-emerald-950">
                {data.profile.authorized_representative_name ?? data.profile.legal_full_name}
              </p>
            </div>
            <SignaturePad ref={props.padRef} label="Your signature" onChange={props.onPadChange} />
            <Check checked={props.acceptAgreement} setChecked={props.setAcceptAgreement}>
              I have read and accept the Agreement, including the 40% commission and invoice terms.
            </Check>
            <Check checked={props.acceptSignature} setChecked={props.setAcceptSignature}>
              I agree that my drawn signature above is my binding electronic signature.
            </Check>
            <Check checked={props.acceptPrivacy} setChecked={props.setAcceptPrivacy}>
              I will protect patient information and use the secure AfraMedico process.
            </Check>
            <Button disabled={props.saving || props.padEmpty || !props.acceptAgreement || !props.acceptSignature || !props.acceptPrivacy} type="submit">
              {props.saving ? "Signing..." : "Sign Agreement"}
            </Button>
          </form>
        ) : null}
        {data.agreement.status === "pending_aframedico_signature" ? (
          <p className="mt-5 text-sm text-amber-700">
            You have signed this Agreement. It is now awaiting AfraMedico's countersignature before it is fully executed.
          </p>
        ) : null}
        {data.agreement.status === "fully_executed" ? (
          <p className="mt-5 text-sm text-emerald-700">
            Signed by you on {new Date(data.agreement.partner_signed_at ?? "").toLocaleDateString()} and fully executed by
            AfraMedico on {new Date(data.agreement.fully_executed_at ?? "").toLocaleDateString()}.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Check({ checked, setChecked, children }: { checked: boolean; setChecked: (value: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex items-start gap-3 text-sm">
      <input className="mt-1" type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} />
      <span>{children}</span>
    </label>
  );
}

function ReferralForm({ onSaved, setError }: { onSaved: (code: string, leadCode?: string) => void; setError: (error: string | null) => void }) {
  const [form, setForm] = useState<PartnerReferralFormState>({
    patient_full_name: "",
    date_of_birth: "",
    patient_country: "",
    city: "",
    nationality: "",
    gender: "Female",
    preferred_language: "English",
    phone_country_code: "+234",
    phone_local_number: "",
    patient_phone: "",
    whatsapp_country_code: "+234",
    whatsapp_local_number: "",
    whatsapp: "",
    patient_email: "",
    confirm_email: "",
    requested_treatment: "",
    medical_condition: "",
    urgency: "Medium",
    preferred_destination: "Turkey",
    medical_history: "",
    initial_records_ready: false,
    patient_consent_confirmed: false,
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const emailStatus = getEmailVerificationStatus(form.patient_email, form.confirm_email);
  const age = calculateAge(form.date_of_birth);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validatePartnerReferralForm(form);
    setValidationErrors(errors);
    if (errors.length) return;

    setSaving(true);
    setError(null);
    const result = await submitPartnerPatientReferral(form);
    setSaving(false);
    if (result.error || !result.data) {
      setError(result.error ?? "Unable to submit referral.");
      return;
    }
    onSaved(result.data.referral.referral_code, result.data.referral.lead_code);
  }

  function field<Key extends keyof PartnerReferralFormState>(key: Key, value: PartnerReferralFormState[Key]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "patient_country") {
        const country = getCountryOptionByName(String(value));
        if (country) {
          next.nationality = current.nationality || country.nationality;
          next.phone_country_code = current.phone_country_code || country.callingCode;
          next.whatsapp_country_code = current.whatsapp_country_code || country.callingCode;
        }
      }
      if (key === "phone_country_code" || key === "phone_local_number") {
        next.patient_phone = buildInternationalNumber(next.phone_country_code, next.phone_local_number);
      }
      if (key === "whatsapp_country_code" || key === "whatsapp_local_number") {
        next.whatsapp = buildInternationalNumber(next.whatsapp_country_code, next.whatsapp_local_number);
      }
      return next;
    });
    setValidationErrors([]);
  }

  return (
    <form className="space-y-4 rounded-md border bg-white p-4" onSubmit={submit}>
      {validationErrors.length ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {validationErrors.map((validationError) => <p key={validationError}>{validationError}</p>)}
        </div>
      ) : null}

      <PartnerReferralSection title="Patient Details">
        <PartnerField label="Patient ID" value="Generated after submission" readOnly />
        <PartnerField label="Patient Full Name" value={form.patient_full_name} onChange={(value) => field("patient_full_name", value)} required />
        <PartnerField label="Date of Birth" type="date" value={form.date_of_birth} onChange={(value) => field("date_of_birth", value)} required />
        <PartnerDatalist label="Country" listId="partner-countries" value={form.patient_country} onChange={(value) => field("patient_country", value)} options={countryOptions.map((country) => country.name)} required />
        <PartnerField label="City" value={form.city} onChange={(value) => field("city", value)} />
        <PartnerDatalist label="Nationality" listId="partner-nationalities" value={form.nationality} onChange={(value) => field("nationality", value)} options={nationalityOptions} />
        <PartnerField label="Age" value={age ? String(age) : "Calculated from DOB"} readOnly />
        <PartnerSelect label="Gender" value={form.gender} onChange={(value) => field("gender", value)}>
          <option>Female</option>
          <option>Male</option>
          <option>Other</option>
        </PartnerSelect>
        <PartnerDatalist label="Preferred Language" listId="partner-languages" value={form.preferred_language} onChange={(value) => field("preferred_language", value)} options={preferredLanguages} />
      </PartnerReferralSection>

      <PartnerReferralSection title="Contact">
        <PartnerPhoneField label="Phone" code={form.phone_country_code} localNumber={form.phone_local_number} onCodeChange={(value) => field("phone_country_code", value)} onLocalNumberChange={(value) => field("phone_local_number", value)} required />
        <PartnerPhoneField label="WhatsApp" code={form.whatsapp_country_code} localNumber={form.whatsapp_local_number} onCodeChange={(value) => field("whatsapp_country_code", value)} onLocalNumberChange={(value) => field("whatsapp_local_number", value)} />
        <PartnerField label="Primary Email" type="email" value={form.patient_email} onChange={(value) => field("patient_email", value)} required />
        <PartnerField label="Confirm Email" type="email" value={form.confirm_email} onChange={(value) => field("confirm_email", value)} required />
        <PartnerField label="Email Verified" value={emailStatus === "Verified" ? "Yes" : "No"} readOnly />
        <PartnerField label="Verification Status" value={emailStatus} readOnly />
        <PartnerField label="Lead Source" value="Referral Partner" readOnly />
      </PartnerReferralSection>

      <PartnerReferralSection title="Medical Need">
        <PartnerDatalist label="Interested Treatment" listId="partner-treatments" value={form.requested_treatment} onChange={(value) => field("requested_treatment", value)} options={commonTreatments} required />
        <PartnerField label="Medical Condition" value={form.medical_condition} onChange={(value) => field("medical_condition", value)} />
        <PartnerSelect label="Urgency" value={form.urgency} onChange={(value) => field("urgency", value)}>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
          <option>Urgent</option>
        </PartnerSelect>
        <PartnerDatalist label="Preferred Destination" listId="partner-destinations" value={form.preferred_destination} onChange={(value) => field("preferred_destination", value)} options={countryOptions.map((country) => country.name)} />
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-sm font-medium">Medical History / Summary *</span>
          <textarea
            className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Chief complaint, symptoms, diagnosis, previous treatments, current medications, allergies, surgeries, and current needs."
            value={form.medical_history}
            onChange={(event) => field("medical_history", event.target.value)}
            required
          />
        </label>
      </PartnerReferralSection>

      <div className="space-y-3">
        <Check checked={form.initial_records_ready} setChecked={(value) => field("initial_records_ready", value)}>
          Initial medical records are available for secure follow-up.
        </Check>
        <Check checked={form.patient_consent_confirmed} setChecked={(value) => field("patient_consent_confirmed", value)}>
          The patient has authorized me to submit these details to AfraMedico for healthcare coordination.
        </Check>
      </div>

      <Button disabled={saving} type="submit">{saving ? "Submitting..." : "Submit Patient Referral"}</Button>
    </form>
  );
}

function PartnerReferralSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="space-y-3 rounded-md border border-emerald-100 bg-emerald-50/30 p-4">
      <h3 className="text-sm font-semibold text-emerald-950">{title}</h3>
      <div className="grid gap-3 md:grid-cols-2">{children}</div>
    </div>
  );
}

function PartnerField({
  label,
  onChange,
  readOnly,
  required,
  type = "text",
  value,
}: {
  label: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-medium">{label}{required ? " *" : ""}</span>
      <Input
        className={readOnly ? "bg-muted/40 text-muted-foreground" : undefined}
        readOnly={readOnly}
        type={type}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </label>
  );
}

function PartnerDatalist({
  label,
  listId,
  onChange,
  options,
  required,
  value,
}: {
  label: string;
  listId: string;
  onChange: (value: string) => void;
  options: string[];
  required?: boolean;
  value: string;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-medium">{label}{required ? " *" : ""}</span>
      <Input list={listId} value={value} onChange={(event) => onChange(event.target.value)} />
      <datalist id={listId}>
        {options.map((option) => <option key={option} value={option} />)}
      </datalist>
    </label>
  );
}

function PartnerPhoneField({
  code,
  label,
  localNumber,
  onCodeChange,
  onLocalNumberChange,
  required,
}: {
  code: string;
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
        <Input list={`${label.toLowerCase()}-partner-calling-codes`} value={code} onChange={(event) => onCodeChange(event.target.value)} />
        <Input value={localNumber} onChange={(event) => onLocalNumberChange(event.target.value)} inputMode="tel" placeholder="Local number only" />
      </div>
      <datalist id={`${label.toLowerCase()}-partner-calling-codes`}>
        {callingCodeOptions.map((option) => (
          <option key={`${label}-${option.label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </datalist>
    </label>
  );
}

function PartnerSelect({ children, label, onChange, value }: { children: ReactNode; label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      <select className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  );
}

function calculateAge(dateOfBirth: string) {
  if (!dateOfBirth) return 0;
  const date = new Date(dateOfBirth);
  if (Number.isNaN(date.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) age -= 1;
  return age;
}

function getEmailVerificationStatus(email: string, confirmEmail: string) {
  if (!email.trim() || !confirmEmail.trim()) return "Unverified";
  return email.trim().toLowerCase() === confirmEmail.trim().toLowerCase() ? "Verified" : "Mismatch";
}

function validatePartnerReferralForm(form: PartnerReferralFormState) {
  const errors: string[] = [];
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!form.patient_full_name.trim()) errors.push("Patient full name is required.");
  if (!form.patient_country.trim()) errors.push("Country is required.");
  if (!form.date_of_birth.trim()) errors.push("Date of birth is required.");
  if (!form.patient_phone.trim() && !form.phone_local_number.trim()) errors.push("Phone is required.");
  if (!form.patient_email.trim()) errors.push("Primary email is required.");
  if (!form.confirm_email.trim()) errors.push("Confirm email is required.");
  if (form.patient_email.trim() && !emailPattern.test(form.patient_email.trim())) errors.push("Email format is invalid.");
  if (getEmailVerificationStatus(form.patient_email, form.confirm_email) === "Mismatch") errors.push("Primary email and confirm email must match.");
  if (!form.requested_treatment.trim()) errors.push("Interested treatment is required.");
  if (!form.medical_history.trim()) errors.push("Medical history / summary is required.");
  if (form.preferred_destination.trim() && !countryOptions.some((country) => country.name.toLowerCase() === form.preferred_destination.trim().toLowerCase())) {
    errors.push("Preferred destination must be selected from the country list.");
  }
  if (form.patient_consent_confirmed !== true) errors.push("Patient consent confirmation is required.");
  return errors;
}
