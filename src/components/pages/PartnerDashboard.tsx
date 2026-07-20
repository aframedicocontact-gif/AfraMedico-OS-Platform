import { useEffect, useRef, useState, type FormEvent, type RefObject } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { SignaturePad, type SignaturePadHandle } from "../ui/SignaturePad";
import {
  getPartnerAgreementDownloadUrl,
  getPartnerDashboard,
  signPartnerAgreementV2,
  submitPartnerPatientReferral,
} from "../../services/partnerPortalService";
import type { PartnerPortalDashboard as DashboardData } from "../../types/partnerRecord";

type Props = { onSignOut: () => void; onProfileIncomplete: () => void };

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

  useEffect(() => { void load(); }, []);

  async function handleSign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!padRef.current || padRef.current.isEmpty()) { setError("Draw your signature to sign the Agreement."); return; }
    setSaving(true);
    setError(null);
    const result = await signPartnerAgreementV2({
      signature_strokes: padRef.current.getStrokes(),
      accepted_agreement: acceptAgreement,
      accepted_electronic_signature: acceptSignature,
      accepted_privacy: acceptPrivacy,
    });
    setSaving(false);
    if (result.error) { setError(result.error); return; }
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
    if (result.error || !result.data) { setError(result.error ?? "Unable to generate a download link."); return; }
    window.open(result.data.url, "_blank", "noopener,noreferrer");
  }

  if (loading) return <PortalShell onSignOut={onSignOut}><p className="text-sm text-muted-foreground">Loading your Partner Dashboard…</p></PortalShell>;

  return (
    <PortalShell onSignOut={onSignOut}>
      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      {message ? <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div> : null}
      {data ? (
        <>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div><p className="text-sm font-medium text-emerald-700">{data.partner.partner_code}</p><h1 className="text-3xl font-semibold text-emerald-950">Welcome, {data.profile.legal_full_name}</h1><p className="mt-1 text-sm text-muted-foreground">Your secure AfraMedico Partner workspace</p></div>
            <Badge className={data.can_submit_referral ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>{data.can_submit_referral ? "Active Partner" : "Agreement Pending"}</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Summary title="Profile" value="Completed" detail={data.partner.country ?? "—"} />
            <Summary title="Agreement" value={agreementStatusLabel(data.agreement.status)} detail={`Version ${data.agreement.template_version}`} />
            <Summary title="Commission" value={`${Number(data.agreement.commission_rate)}%`} detail="of AfraMedico Net Referral Revenue" />
          </div>

          <Card>
            <CardHeader><CardTitle>Partner Agreement</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Review the simple standard agreement, including continuing patient attribution, the 40% commission, invoicing, and tax terms.</p>
              {data.agreement.status === "pending_aframedico_signature" ? <p className="text-sm text-amber-700">You signed on {new Date(data.agreement.partner_signed_at ?? "").toLocaleDateString()}. Waiting for AfraMedico to countersign.</p> : null}
              {data.agreement.status === "fully_executed" ? <p className="text-sm text-emerald-700">Fully executed on {new Date(data.agreement.fully_executed_at ?? "").toLocaleDateString()}.</p> : null}
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => setShowAgreement((value) => !value)}>{data.agreement.status === "fully_executed" ? "View Agreement" : "Review Agreement"}</Button>
                {data.agreement.status === "fully_executed" && data.agreement.has_final_pdf ? (
                  <Button variant="secondary" disabled={downloading} onClick={handleDownload}>{downloading ? "Preparing…" : "Download Signed Agreement"}</Button>
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
              <p className="text-sm text-muted-foreground">Register a patient with consent, initial medical information, and the requested treatment. Your existing patient attribution continues for eligible repeat treatments coordinated through AfraMedico.</p>
              <Button disabled={!data.can_submit_referral} onClick={() => setShowReferral((value) => !value)}>{data.can_submit_referral ? "New Patient Referral" : "Complete Agreement Signing to Enable Referrals"}</Button>
              {showReferral && data.can_submit_referral ? <ReferralForm onSaved={async (code, leadCode) => { setMessage(`Referral ${code} submitted successfully${leadCode ? ` and linked to Lead ${leadCode}` : ""}.`); setShowReferral(false); await load(); }} setError={setError} /> : null}
              <div className="space-y-2">{data.referrals.map((referral) => <div className="grid gap-2 rounded-md border p-3 text-sm md:grid-cols-4" key={referral.id}><strong>{referral.referral_code}</strong><span>{referral.patient_full_name}</span><span>{referral.requested_treatment}</span><span>{referral.referral_status.replaceAll("_", " ")}</span></div>)}</div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </PortalShell>
  );
}

function PortalShell({ children, onSignOut }: { children: React.ReactNode; onSignOut: () => void }) {
  return <div className="min-h-screen bg-slate-50"><header className="border-b bg-emerald-950 px-4 py-4 text-white"><div className="mx-auto flex max-w-6xl items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">AfraMedico Partner Network</p><p className="font-semibold">Partner Dashboard</p></div><Button variant="secondary" onClick={onSignOut}>Sign out</Button></div></header><main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">{children}</main></div>;
}

function Summary({ title, value, detail }: { title: string; value: string; detail: string }) { return <Card><CardContent className="pt-5"><p className="text-xs font-medium uppercase text-muted-foreground">{title}</p><p className="mt-2 text-xl font-semibold text-emerald-950">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></CardContent></Card>; }

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
        <div className="max-h-[32rem] overflow-y-auto whitespace-pre-wrap rounded-md border bg-white p-5 text-sm leading-6">{data.agreement.agreement_text}</div>
        {canSubmit ? (
          <form className="mt-5 space-y-4" onSubmit={props.onSubmit}>
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Signing as</p>
              <p className="text-sm font-semibold text-emerald-950">{data.profile.authorized_representative_name ?? data.profile.legal_full_name}</p>
            </div>
            <SignaturePad ref={props.padRef} label="Your signature" onChange={props.onPadChange} />
            <Check checked={props.acceptAgreement} setChecked={props.setAcceptAgreement}>I have read and accept the Agreement, including the 40% commission and invoice terms.</Check>
            <Check checked={props.acceptSignature} setChecked={props.setAcceptSignature}>I agree that my drawn signature above is my binding electronic signature.</Check>
            <Check checked={props.acceptPrivacy} setChecked={props.setAcceptPrivacy}>I will protect patient information and use the secure AfraMedico process.</Check>
            <Button disabled={props.saving || props.padEmpty || !props.acceptAgreement || !props.acceptSignature || !props.acceptPrivacy} type="submit">{props.saving ? "Signing…" : "Sign Agreement"}</Button>
          </form>
        ) : null}
        {data.agreement.status === "pending_aframedico_signature" ? (
          <p className="mt-5 text-sm text-amber-700">You have signed this Agreement. It is now awaiting AfraMedico's countersignature before it is fully executed.</p>
        ) : null}
        {data.agreement.status === "fully_executed" ? (
          <p className="mt-5 text-sm text-emerald-700">Signed by you on {new Date(data.agreement.partner_signed_at ?? "").toLocaleDateString()} and fully executed by AfraMedico on {new Date(data.agreement.fully_executed_at ?? "").toLocaleDateString()}.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Check({ checked, setChecked, children }: { checked: boolean; setChecked: (value: boolean) => void; children: React.ReactNode }) { return <label className="flex items-start gap-3 text-sm"><input className="mt-1" type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} /><span>{children}</span></label>; }

function ReferralForm({ onSaved, setError }: { onSaved: (code: string, leadCode?: string) => void; setError: (error: string | null) => void }) {
  const [form, setForm] = useState({ patient_full_name: "", patient_email: "", patient_phone: "", patient_country: "", requested_treatment: "", medical_summary: "", initial_records_ready: false, patient_consent_confirmed: false });
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); setError(null); const result = await submitPartnerPatientReferral(form); setSaving(false); if (result.error || !result.data) { setError(result.error ?? "Unable to submit referral."); return; } onSaved(result.data.referral.referral_code, result.data.referral.lead_code); }
  function field(key: keyof typeof form, value: string | boolean) { setForm((current) => ({ ...current, [key]: value })); }
  return <form className="space-y-3 rounded-md border bg-white p-4" onSubmit={submit}><div className="grid gap-3 md:grid-cols-2"><Input placeholder="Patient full name" value={form.patient_full_name} onChange={(e) => field("patient_full_name", e.target.value)} required /><Input type="email" placeholder="Patient email (optional)" value={form.patient_email} onChange={(e) => field("patient_email", e.target.value)} /><Input placeholder="Patient phone / WhatsApp" value={form.patient_phone} onChange={(e) => field("patient_phone", e.target.value)} required /><Input placeholder="Patient country" value={form.patient_country} onChange={(e) => field("patient_country", e.target.value)} required /><Input className="md:col-span-2" placeholder="Requested treatment" value={form.requested_treatment} onChange={(e) => field("requested_treatment", e.target.value)} required /></div><textarea className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Brief medical summary and current needs" value={form.medical_summary} onChange={(e) => field("medical_summary", e.target.value)} required /><Check checked={form.initial_records_ready} setChecked={(value) => field("initial_records_ready", value)}>Initial medical records are available for secure follow-up.</Check><Check checked={form.patient_consent_confirmed} setChecked={(value) => field("patient_consent_confirmed", value)}>The patient has authorized me to submit these details to AfraMedico for healthcare coordination.</Check><Button disabled={saving} type="submit">{saving ? "Submitting…" : "Submit Patient Referral"}</Button></form>;
}
