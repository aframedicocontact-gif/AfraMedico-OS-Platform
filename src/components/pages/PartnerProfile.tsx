import { ArrowLeft, ExternalLink, Mail, MessageCircle, Phone, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import type { AppView } from "../../app/App";
import type { ReferralPartner } from "../../types/referralPartner";
import {
  AgreementStatusBadge,
  ReferralStatusBadge,
  formatCurrency,
} from "../referrals/referralUi";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type PartnerProfileProps = {
  partner: ReferralPartner;
  onNavigate: (view: AppView) => void;
};

export function PartnerProfile({ partner, onNavigate }: PartnerProfileProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button
            variant="ghost"
            className="-ml-3 mb-2"
            type="button"
            onClick={() => onNavigate({ name: "partner-directory" })}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <p className="text-sm font-medium text-primary">Partner Profile</p>
          <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">{partner.organizationName}</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {partner.partnerType} partner in {partner.city}, {partner.country}.
          </p>
        </div>
        <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "referral-pipeline" })}>
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
