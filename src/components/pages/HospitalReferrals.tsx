import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { AppView } from "../../app/App";
import type { ProtectedReferralCase, RegistrationStatus } from "../../types/referralProtection";
import { QuoteBadge, RegistrationBadge, formatCurrency } from "../protection/protectionUi";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

type HospitalReferralsProps = {
  cases: ProtectedReferralCase[];
  onNavigate: (view: AppView) => void;
};

const statuses: RegistrationStatus[] = [
  "Pending",
  "Submitted",
  "Confirmed",
  "Duplicate Flagged",
  "Rejected",
  "Closed",
];

export function HospitalReferrals({ cases, onNavigate }: HospitalReferralsProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | RegistrationStatus>("all");

  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return cases
      .flatMap((item) =>
        item.hospitalReferrals.map((referral) => ({
          protectionCaseId: item.id,
          patientId: item.patientId,
          medicalCaseId: item.caseId,
          patientName: item.patientName,
          commissionOwner: item.currentCommissionOwner,
          ownership: item.ownership,
          ...referral,
        })),
      )
      .filter((row) => {
        const matchesStatus = status === "all" || row.registrationStatus === status;
        const matchesQuery =
          normalized.length === 0 ||
          [
            row.patientName,
            row.patientId,
            row.medicalCaseId,
            row.hospital,
            row.hospitalCaseId,
            row.contactPerson,
            row.coordinator,
            row.commissionOwner,
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalized);

        return matchesStatus && matchesQuery;
      });
  }, [cases, query, status]);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-primary">Referral Protection Engine</p>
        <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">Hospital Referrals</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Each patient can be registered with multiple hospitals. Every hospital referral keeps its own case ID, evidence, quote, and timeline.
        </p>
      </div>

      <div className="rounded-lg border border-yellow-200 bg-yellow-50/70 p-4 shadow-sm">
        <p className="font-semibold text-emerald-950">Early Hospital Registration is allowed before Medical Review.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Use early registration to protect AfraMedico and partner commission rights as soon as minimum patient data exists. Medical Review is required before sending a full clinical package or requesting a detailed treatment quote.
        </p>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search patient, hospital, case ID, coordinator"
            />
          </label>
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value as "all" | RegistrationStatus)}
          >
            <option value="all">All registration statuses</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <Table className="min-w-[1280px]">
          <TableHeader>
            <TableRow className="bg-emerald-50/70">
              <TableHead>Patient</TableHead>
              <TableHead>Case ID</TableHead>
              <TableHead>Hospital</TableHead>
              <TableHead>Referral Date</TableHead>
              <TableHead>Registration Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Hospital Case ID</TableHead>
              <TableHead>Coordinator</TableHead>
              <TableHead>Quote</TableHead>
              <TableHead>Treatment Cost</TableHead>
              <TableHead>Expected Response</TableHead>
              <TableHead>Case Workspace</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer"
                onClick={() => onNavigate({ name: "referral-details", caseId: row.protectionCaseId })}
              >
                <TableCell>
                  <div className="font-medium text-emerald-950">{row.patientName}</div>
                  <div className="text-xs text-muted-foreground">{row.patientId} | Owner: {row.commissionOwner}</div>
                </TableCell>
                <TableCell>{row.medicalCaseId}</TableCell>
                <TableCell>{row.hospital}</TableCell>
                <TableCell>{row.referralDate}</TableCell>
                <TableCell>{row.registrationDate}</TableCell>
                <TableCell>
                  <RegistrationBadge status={row.registrationStatus} />
                </TableCell>
                <TableCell>{row.hospitalCaseId}</TableCell>
                <TableCell>{row.coordinator}</TableCell>
                <TableCell>
                  <QuoteBadge status={row.quoteStatus} />
                </TableCell>
                <TableCell>{formatCurrency(row.treatmentCost)}</TableCell>
                <TableCell>{row.expectedResponseDate}</TableCell>
                <TableCell>
                  <button
                    className="rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onNavigate({ name: "case-profile", caseId: row.medicalCaseId });
                    }}
                  >
                    Open Case
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
