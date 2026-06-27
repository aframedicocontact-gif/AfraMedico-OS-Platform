import { ShieldCheck } from "lucide-react";
import type { ProtectedReferralCase } from "../../types/referralProtection";
import { OwnershipBadge } from "../protection/protectionUi";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type CommissionOwnershipProps = {
  cases: ProtectedReferralCase[];
};

export function CommissionOwnership({ cases }: CommissionOwnershipProps) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-primary">Referral Protection Engine</p>
        <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">Commission Ownership</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Manager decisions require a reason, decision date, and decision by. Nothing is deleted; every change is logged.
        </p>
      </div>

      <div className="grid gap-4">
        {cases.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span>{item.patientName}</span>
                <OwnershipBadge ownership={item.ownership} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Metric label="Current Commission Owner" value={item.currentCommissionOwner} />
                <Metric label="Partner Attempts" value={String(item.partnerAttempts.length)} />
                <Metric label="Hospital Referrals" value={String(item.hospitalReferrals.length)} />
              </div>
              {item.commissionDecisions.map((decision) => (
                <div key={decision.id} className="rounded-md border bg-emerald-50/50 p-4">
                  <p className="flex items-center gap-2 font-medium text-emerald-950">
                    <ShieldCheck className="h-4 w-4" />
                    {decision.commissionOwner}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{decision.reason}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Decision date: {decision.decisionDate} | Decision by: {decision.decisionBy}
                  </p>
                </div>
              ))}
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
