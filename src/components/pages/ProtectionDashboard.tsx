import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  ClipboardCheck,
  FileClock,
  Landmark,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import type { AppView } from "../../app/App";
import type { ProtectedReferralCase } from "../../types/referralProtection";
import {
  DuplicateBadge,
  OwnershipBadge,
  ProtectionCaseStatusBadge,
  formatCurrency,
} from "../protection/protectionUi";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type ProtectionDashboardProps = {
  cases: ProtectedReferralCase[];
  onNavigate: (view: AppView) => void;
};

export function ProtectionDashboard({ cases, onNavigate }: ProtectionDashboardProps) {
  const hospitalReferrals = cases.flatMap((item) => item.hospitalReferrals);
  const duplicateReviews = cases.flatMap((item) => item.duplicateReviews);
  const commissionConflicts = cases.filter((item) => item.conflict).length;
  const ownershipDecisions = cases.flatMap((item) => item.commissionDecisions).length;
  const hospitalRegistrations = hospitalReferrals.filter((item) => item.registrationDate).length;
  const pendingConfirmations = hospitalReferrals.filter((item) =>
    ["Pending", "Submitted"].includes(item.registrationStatus),
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Referral Protection Engine</p>
          <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">Protection Dashboard</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Preserve commission rights, referral history, early hospital registrations, duplicate reviews, and audit evidence before clinical packaging is complete.
          </p>
        </div>
        <Button type="button" onClick={() => onNavigate({ name: "hospital-referrals" })}>
          <Plus className="h-4 w-4" />
          View Referrals
        </Button>
      </div>

      <Card className="border-yellow-200 bg-yellow-50/70">
        <CardContent className="p-4">
          <p className="font-semibold text-emerald-950">Protection rule: registration first when needed.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Early Hospital Registration protects referral and commission rights and must not be blocked by Medical Review. Medical Review prepares the hospital-ready clinical package and is required before detailed quote requests.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <Metric icon={<ShieldCheck className="h-4 w-4" />} label="Patients Protected" value={cases.length} />
        <Metric icon={<Building2 className="h-4 w-4" />} label="Hospital Referrals" value={hospitalReferrals.length} />
        <Metric icon={<AlertTriangle className="h-4 w-4" />} label="Duplicate Reviews Pending" value={duplicateReviews.filter((item) => item.status === "Pending").length} />
        <Metric icon={<BadgeCheck className="h-4 w-4" />} label="Duplicate Reviews Resolved" value={duplicateReviews.filter((item) => item.status === "Resolved").length} />
        <Metric icon={<Users className="h-4 w-4" />} label="Commission Conflicts" value={commissionConflicts} />
        <Metric icon={<ClipboardCheck className="h-4 w-4" />} label="Partner Ownership Decisions" value={ownershipDecisions} />
        <Metric icon={<Landmark className="h-4 w-4" />} label="Hospital Registrations" value={hospitalRegistrations} />
        <Metric icon={<FileClock className="h-4 w-4" />} label="Pending Confirmations" value={pendingConfirmations} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Protected Patient Cases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cases.map((item) => (
              <button
                key={item.id}
                className="grid w-full gap-3 rounded-md border bg-white p-4 text-left hover:bg-muted lg:grid-cols-[1fr_180px_180px]"
                type="button"
                onClick={() => onNavigate({ name: "referral-details", caseId: item.id })}
              >
                <div>
                  <p className="font-medium text-emerald-950">{item.patientName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.patientId} | {item.caseId} | {item.treatment} | {item.hospitalReferrals.length} hospital referrals
                  </p>
                  {item.possibleDuplicate ? (
                    <Badge className="mt-2" tone="warning">Possible duplicate review</Badge>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <ProtectionCaseStatusBadge status={item.caseStatus} />
                  <OwnershipBadge ownership={item.ownership} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Lifetime owner: <span className="font-medium text-emerald-950">{item.lifetimePartnerOwner}</span>
                </p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Duplicate Review Queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {duplicateReviews.map((review) => (
              <button
                key={review.id}
                className="w-full rounded-md border bg-white p-3 text-left hover:bg-muted"
                type="button"
                onClick={() => onNavigate({ name: "duplicate-review" })}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-emerald-950">{review.existingPatient}</p>
                  <DuplicateBadge status={review.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {review.matchingScore}% match | {review.recommendedAction}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Protection Centers</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "referral-details", caseId: cases[0]?.id ?? "" })}>
            Referral Details
          </Button>
          <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "hospital-referrals" })}>
            Hospital Referrals
          </Button>
          <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "duplicate-review" })}>
            Duplicate Review
          </Button>
          <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "commission-ownership" })}>
            Commission Ownership
          </Button>
          <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "protection-audit-trail" })}>
            Audit Trail
          </Button>
        </CardContent>
      </Card>

      <Card className="border-yellow-200 bg-yellow-50/60">
        <CardHeader>
          <CardTitle>Revenue Under Protection</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-semibold text-emerald-950">
            {formatCurrency(hospitalReferrals.reduce((sum, item) => sum + item.treatmentCost, 0))}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Sum of received treatment costs across protected hospital referrals. Pending quotes remain preserved but unpriced.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <Card className="border-emerald-100">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-md bg-emerald-50 p-2 text-emerald-800">{icon}</span>
          <span className="text-xl font-semibold text-emerald-950">{value}</span>
        </div>
        <p className="mt-4 min-h-10 text-sm font-medium text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
