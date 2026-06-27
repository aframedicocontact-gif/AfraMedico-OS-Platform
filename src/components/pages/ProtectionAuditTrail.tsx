import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { ProtectedReferralCase } from "../../types/referralProtection";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";

type ProtectionAuditTrailProps = {
  cases: ProtectedReferralCase[];
};

export function ProtectionAuditTrail({ cases }: ProtectionAuditTrailProps) {
  const [query, setQuery] = useState("");

  const events = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return cases
      .flatMap((item) => [
        ...item.auditTrail.map((event) => ({
          ...event,
          patientName: item.patientName,
          source: "Patient Case",
        })),
        ...item.hospitalReferrals.flatMap((referral) =>
          referral.timeline.map((event) => ({
            ...event,
            patientName: item.patientName,
            source: referral.hospital,
          })),
        ),
      ])
      .filter((event) =>
        normalized.length === 0
          ? true
          : [event.patientName, event.source, event.user, event.action, event.evidence, event.notes]
              .join(" ")
              .toLowerCase()
              .includes(normalized),
      )
      .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  }, [cases, query]);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-primary">Referral Protection Engine</p>
        <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">Audit Trail</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Every important action keeps date, time, user, action, evidence, and notes.
        </p>
      </div>

      <label className="relative block max-w-2xl">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search audit actions, users, evidence, notes"
        />
      </label>

      <Card>
        <CardHeader>
          <CardTitle>Immutable Event Log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {events.map((event) => (
            <div key={`${event.id}-${event.source}`} className="rounded-md border bg-white p-4">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="font-medium text-emerald-950">{event.action}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {event.patientName} | {event.source}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {event.date} {event.time} | {event.user}
                </p>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">Evidence: {event.evidence}</p>
              <p className="mt-1 text-sm text-muted-foreground">{event.notes}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
