import { CheckCircle2, GitMerge, Scale, ShieldCheck, XCircle } from "lucide-react";
import type { AppView } from "../../app/App";
import type { ProtectedReferralCase } from "../../types/referralProtection";
import { DuplicateBadge } from "../protection/protectionUi";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type DuplicateReviewCenterProps = {
  cases: ProtectedReferralCase[];
  onNavigate: (view: AppView) => void;
};

export function DuplicateReviewCenter({ cases, onNavigate }: DuplicateReviewCenterProps) {
  const reviews = cases.flatMap((item) =>
    item.duplicateReviews.map((review) => ({
      ...review,
      caseId: item.id,
      patientName: item.patientName,
      commissionOwner: item.currentCommissionOwner,
    })),
  );

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-primary">Referral Protection Engine</p>
        <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">Duplicate Review Center</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Possible duplicates are reviewed after registration. Managers decide ownership without deleting any history.
        </p>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id} className="border-yellow-200">
            <CardHeader>
              <CardTitle className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span>Possible Duplicate Detected: {review.patientName}</span>
                <DuplicateBadge status={review.status} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <Metric label="Matching Score" value={`${review.matchingScore}%`} />
                <Metric label="Existing Patient" value={review.existingPatient} />
                <Metric label="Existing Partner" value={review.existingPartner} />
                <Metric label="Commission Owner" value={review.commissionOwner} />
              </div>

              <div className="rounded-md border bg-white p-4">
                <p className="text-sm font-medium text-emerald-950">Existing Hospital Referrals</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {review.existingHospitalReferrals.map((hospital) => (
                    <span key={hospital} className="rounded bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-900">
                      {hospital}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-2 lg:grid-cols-5">
                <Button type="button" onClick={() => onNavigate({ name: "referral-details", caseId: review.caseId })}>
                  <CheckCircle2 className="h-4 w-4" />
                  Approve New Referral
                </Button>
                <Button variant="secondary" type="button">
                  <GitMerge className="h-4 w-4" />
                  Merge
                </Button>
                <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "commission-ownership" })}>
                  <ShieldCheck className="h-4 w-4" />
                  Assign Commission Owner
                </Button>
                <Button variant="secondary" type="button">
                  <Scale className="h-4 w-4" />
                  Split Commission
                </Button>
                <Button variant="secondary" type="button">
                  <XCircle className="h-4 w-4" />
                  Reject Duplicate
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-white p-3">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold text-emerald-950">{value}</p>
    </div>
  );
}
