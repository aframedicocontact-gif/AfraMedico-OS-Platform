import { ArrowLeft, ExternalLink, Mail, MessageCircle, Phone, UserRound } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { isLivePartnerId, formatLiveDate, formatLiveLifecycle, formatLiveSource, formatLiveStatus } from "../../lib/livePartnerFormat";
import {
  getLivePartnerById,
  getPartnerAuthLinkByPartnerId,
  getPartnerNetworkIntakeByPartnerId,
  sendPartnerActivationInvite,
} from "../../services/partnerService";
import type { LiveNetworkIntake, LivePartner, PartnerAuthLink } from "../../types/partnerRecord";
import type { ReferralPartner } from "../../types/referralPartner";
import {
  AgreementStatusBadge,
  ReferralPartnerNav,
  ReferralStatusBadge,
  formatCurrency,
} from "../referrals/referralUi";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type PartnerProfileProps = {
  partners: ReferralPartner[];
};

export function PartnerProfile({ partners }: PartnerProfileProps) {
  const { partnerId } = useParams<{ partnerId: string }>();

  if (!partnerId) {
    return <PartnerNotFound />;
  }

  if (isLivePartnerId(partnerId)) {
    return <LivePartnerProfile partnerId={partnerId} />;
  }

  const partner = partners.find((item) => item.id === partnerId);
  if (!partner) {
    return <PartnerNotFound />;
  }

  return <PrototypePartnerProfile partner={partner} />;
}

function BackActions() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="ghost" className="-ml-3" type="button" onClick={() => navigate("/referrals/pipeline")}>
        <ArrowLeft className="h-4 w-4" />
        Back to Pipeline
      </Button>
      <Button variant="ghost" type="button" onClick={() => navigate("/referrals/directory")}>
        <ArrowLeft className="h-4 w-4" />
        Back to Directory
      </Button>
    </div>
  );
}

function PartnerNotFound() {
  return (
    <div className="space-y-5">
      <ReferralPartnerNav current="directory" />
      <BackActions />
      <Card>
        <CardContent className="space-y-2 p-8 text-center">
          <p className="text-lg font-semibold text-emerald-950">Partner not found</p>
          <p className="text-sm text-muted-foreground">
            This partner profile doesn't exist or you don't have access to it.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Edge Function error codes that need manual admin resolution get a plain-
// language explanation here; everything else falls back to the raw code.
const INVITE_ERROR_MESSAGES: Record<string, string> = {
  email_belongs_to_internal_account:
    "This partner's email belongs to an internal staff account and cannot be used for a partner invite. Confirm the correct email with the partner and update their application record.",
  email_already_linked_to_different_partner:
    "This partner's email is already linked to a different partner record. This needs manual resolution — check the Directory for a duplicate before resending.",
  not_eligible: "This partner is not currently eligible for an activation invite.",
  already_activated: "This partner has already signed in and activated the portal.",
  no_transferred_email: "No transferred application email was found for this partner.",
};

function describeInviteError(code: string): string {
  return INVITE_ERROR_MESSAGES[code] ?? code;
}

function LivePartnerProfile({ partnerId }: { partnerId: string }) {
  const [partner, setPartner] = useState<LivePartner | null>(null);
  const [intake, setIntake] = useState<LiveNetworkIntake | null>(null);
  const [authLink, setAuthLink] = useState<PartnerAuthLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  async function load(signal: { cancelled: boolean }) {
    setLoading(true);
    const [partnerResult, intakeResult, authLinkResult] = await Promise.all([
      getLivePartnerById(partnerId),
      getPartnerNetworkIntakeByPartnerId(partnerId),
      getPartnerAuthLinkByPartnerId(partnerId),
    ]);
    if (signal.cancelled) return;

    setPartner(partnerResult.data);
    setIntake(intakeResult.data);
    setAuthLink(authLinkResult.data);
    setError(partnerResult.error);
    setLoading(false);
  }

  useEffect(() => {
    const signal = { cancelled: false };
    load(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [partnerId]);

  async function handleSendActivationInvite() {
    setIsSendingInvite(true);
    setInviteMessage(null);
    setInviteError(null);

    const result = await sendPartnerActivationInvite(partnerId);

    setIsSendingInvite(false);

    if (result.error) {
      setInviteError(describeInviteError(result.error));
      return;
    }

    setInviteMessage(result.data?.message ?? "Activation invite sent.");
    await load({ cancelled: false });
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <ReferralPartnerNav current="directory" />
        <BackActions />
        <p className="text-sm text-muted-foreground">Loading partner profile…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5">
        <ReferralPartnerNav current="directory" />
        <BackActions />
        <Card>
          <CardContent className="p-8 text-center text-sm text-rose-700">{error}</CardContent>
        </Card>
      </div>
    );
  }

  if (!partner) {
    return <PartnerNotFound />;
  }

  return (
    <div className="space-y-5">
      <ReferralPartnerNav current="directory" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <BackActions />
          <div className="mt-2 flex items-center gap-2">
            <p className="text-sm font-medium text-primary">Partner Profile</p>
            <Badge tone="success">Live</Badge>
          </div>
          <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">{partner.name}</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {partner.type ?? "—"} partner in {partner.country ?? "—"}.
          </p>
        </div>

        {partner.lifecycle_stage === "approved_activation_pending" ? (
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <Button type="button" disabled={isSendingInvite} onClick={() => void handleSendActivationInvite()}>
              {isSendingInvite
                ? "Sending…"
                : authLink
                  ? "Resend Activation Invite"
                  : "Send Activation Invite"}
            </Button>
            {authLink ? (
              <p className="text-xs text-muted-foreground">
                Invite {authLink.status} {formatLiveDate(authLink.invited_at)}.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {inviteMessage ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {inviteMessage}
        </div>
      ) : null}
      {inviteError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{inviteError}</div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Partner Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Field label="Partner Code" value={partner.partner_code} />
          <Field label="Name" value={partner.name} />
          <Field label="Country" value={partner.country ?? "—"} />
          <Field label="Type" value={partner.type ?? "—"} />
          <Field label="Status" value={formatLiveStatus(partner.status)} />
          <Field label="Source" value={formatLiveSource(partner.acquisition_source)} />
          <Field label="Lifecycle" value={formatLiveLifecycle(partner.lifecycle_stage)} />
          <Field label="Created" value={formatLiveDate(partner.created_at)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transferred Application Details</CardTitle>
        </CardHeader>
        <CardContent>
          {intake ? (
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Applicant Name" value={intake.full_name} />
              <Field label="Email" value={intake.email} />
              <Field label="Phone" value={intake.phone ?? "—"} />
              <Field label="Country" value={intake.country ?? "—"} />
              <Field label="City" value={intake.city ?? "—"} />
              <Field label="Organization" value={intake.organization_name ?? "—"} />
              <Field label="Professional Title" value={intake.professional_title ?? "—"} />
              <Field label="Applicant Category" value={intake.applicant_category ?? "—"} />
              <Field label="Years of Experience" value={intake.years_experience ?? "—"} />
              <Field label="Languages" value={intake.languages?.join(", ") || "—"} />
              <Field label="Target Countries" value={intake.target_countries?.join(", ") || "—"} />
              <Field label="LinkedIn" value={intake.linkedin ?? "—"} />
              <Field label="Application Date" value={intake.application_date ? formatLiveDate(intake.application_date) : "—"} />
              <Field label="Network Description" value={intake.network_description ?? "—"} wide />
              <Field label="Relevant Experience" value={intake.relevant_experience ?? "—"} wide />
              <Field label="Motivation" value={intake.motivation ?? "—"} wide />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No transferred application record for this partner.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PrototypePartnerProfile({ partner }: { partner: ReferralPartner }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <ReferralPartnerNav current="directory" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <BackActions />
          <div className="mt-2 flex items-center gap-2">
            <p className="text-sm font-medium text-primary">Partner Profile</p>
            <Badge tone="muted">Prototype</Badge>
          </div>
          <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">{partner.organizationName}</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {partner.partnerType} partner in {partner.city}, {partner.country}.
          </p>
        </div>
        <Button variant="secondary" type="button" onClick={() => navigate("/referrals/pipeline")}>
          View Pipeline
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Partner Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <Field label="Country" value={partner.country} />
              <Field label="City" value={partner.city} />
              <Field label="Partner Type" value={partner.partnerType} />
              <Field label="Referral Status" value={<ReferralStatusBadge status={partner.referralStatus} />} />
              <Field label="Agreement Status" value={<AgreementStatusBadge status={partner.agreementStatus} />} />
              <Field label="Commission Model" value={partner.commissionModel} />
              <Field label="Specialties" value={partner.specialties.join(", ")} wide />
              <Field label="Treatments Referred" value={partner.treatmentsReferred.join(", ")} wide />
              <Field label="Notes" value={partner.notes} wide />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Referral Performance</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-4">
              <Performance label="Patients Referred" value={partner.patientsReferred} />
              <Performance label="New Referrals" value={partner.newReferrals} />
              <Performance label="Estimated Revenue" value={formatCurrency(partner.estimatedRevenue)} />
              <Performance label="Next Follow-up" value={partner.nextFollowUp} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {partner.activity.map((item) => (
                <div key={`${item.date}-${item.title}`} className="relative pl-6">
                  <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-600 ring-4 ring-emerald-100" />
                  <div className="rounded-md border bg-white p-3">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.date}</p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ContactLine icon={<UserRound className="h-4 w-4" />} label="Contact Person" value={partner.contactPerson} />
              <ContactLine icon={<Phone className="h-4 w-4" />} label="Phone" value={partner.phone} />
              <ContactLine icon={<Mail className="h-4 w-4" />} label="Email" value={partner.email} />
              <ContactLine icon={<MessageCircle className="h-4 w-4" />} label="WhatsApp" value={partner.whatsapp} />
              <ContactLine icon={<ExternalLink className="h-4 w-4" />} label="Website" value={partner.website} />
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50/60">
            <CardHeader>
              <CardTitle>Commercial Signal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Revenue</p>
                  <p className="mt-2 text-4xl font-semibold text-emerald-950">
                    {formatCurrency(partner.estimatedRevenue)}
                  </p>
                </div>
                <Badge tone="gold">{partner.commissionModel}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Last contact: {partner.lastContact}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, wide }: { label: string; value: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "md:col-span-3" : undefined}>
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}

function Performance({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-md border bg-white p-3">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold text-emerald-950">{value}</p>
    </div>
  );
}

function ContactLine({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-2 break-words text-sm text-emerald-900">{value}</p>
    </div>
  );
}
