import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { AppView } from "../../app/App";
import type { PartnerType, ReferralPartner, ReferralStatus } from "../../types/referralPartner";
import { AgreementStatusBadge, ReferralStatusBadge, formatCurrency } from "../referrals/referralUi";
import { Button } from "../ui/button";
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

type PartnerDirectoryProps = {
  partners: ReferralPartner[];
  onNavigate: (view: AppView) => void;
};

const partnerTypes: PartnerType[] = [
  "Physicians",
  "Specialist Clinics",
  "Diagnostic Centers",
  "NGOs",
  "HMOs / Insurance",
  "Travel Agencies",
  "Medical Facilitators",
  "Corporate Organizations",
];

const statuses: ReferralStatus[] = [
  "Prospect",
  "Contacted",
  "Meeting Scheduled",
  "Negotiation",
  "Agreement Signed",
  "Active Referrer",
  "Inactive",
];

export function PartnerDirectory({ partners, onNavigate }: PartnerDirectoryProps) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("all");
  const [partnerType, setPartnerType] = useState<"all" | PartnerType>("all");
  const [status, setStatus] = useState<"all" | ReferralStatus>("all");

  const countries = Array.from(new Set(partners.map((partner) => partner.country))).sort();

  const filteredPartners = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return partners.filter((partner) => {
      const matchesCountry = country === "all" || partner.country === country;
      const matchesType = partnerType === "all" || partner.partnerType === partnerType;
      const matchesStatus = status === "all" || partner.referralStatus === status;
      const matchesQuery =
        normalized.length === 0 ||
        [
          partner.organizationName,
          partner.contactPerson,
          partner.country,
          partner.city,
          partner.partnerType,
          partner.specialties.join(" "),
          partner.treatmentsReferred.join(" "),
          partner.email,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalized);

      return matchesCountry && matchesType && matchesStatus && matchesQuery;
    });
  }, [country, partnerType, partners, query, status]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Referral Partner CRM</p>
          <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">Partner Directory</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Search and qualify physicians, clinics, diagnostic centers, NGOs, insurers, facilitators, and corporate referral sources.
          </p>
        </div>
        <Button type="button" onClick={() => onNavigate({ name: "add-referral-partner" })}>
          <Plus className="h-4 w-4" />
          Add Partner
        </Button>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[1.4fr_180px_220px_200px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search partner, contact, specialty, treatment"
            />
          </label>
          <Select value={country} onChange={(event) => setCountry(event.target.value)}>
            <option value="all">All countries</option>
            {countries.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <Select
            value={partnerType}
            onChange={(event) => setPartnerType(event.target.value as "all" | PartnerType)}
          >
            <option value="all">All partner types</option>
            {partnerTypes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value as "all" | ReferralStatus)}
          >
            <option value="all">All statuses</option>
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
              <TableHead>Partner</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Specialties</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Agreement</TableHead>
              <TableHead>Patients</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Next Follow-up</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPartners.map((partner) => (
              <TableRow
                key={partner.id}
                className="cursor-pointer"
                onClick={() =>
                  onNavigate({
                    name: "referral-partner-profile",
                    partnerId: partner.id,
                  })
                }
              >
                <TableCell>
                  <div className="font-medium text-emerald-950">{partner.organizationName}</div>
                  <div className="text-xs text-muted-foreground">{partner.contactPerson}</div>
                </TableCell>
                <TableCell>
                  {partner.city}, {partner.country}
                </TableCell>
                <TableCell>{partner.partnerType}</TableCell>
                <TableCell className="max-w-64">{partner.specialties.join(", ")}</TableCell>
                <TableCell>
                  <ReferralStatusBadge status={partner.referralStatus} />
                </TableCell>
                <TableCell>
                  <AgreementStatusBadge status={partner.agreementStatus} />
                </TableCell>
                <TableCell>{partner.patientsReferred}</TableCell>
                <TableCell>{formatCurrency(partner.estimatedRevenue)}</TableCell>
                <TableCell>{partner.nextFollowUp}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
