import { CalendarDays, Mail, MapPin, Phone } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { PatientStatusBadge } from "./PatientStatusBadge";
import type { Patient } from "../../types/patient";

type PatientCardProps = {
  patient: Patient;
};

function formatDate(value: string | null) {
  if (!value) return "Not recorded";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function fullName(patient: Patient) {
  return `${patient.first_name} ${patient.last_name}`.trim();
}

export function PatientCard({ patient }: PatientCardProps) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
              Patient
            </p>
            <CardTitle className="mt-1 text-xl">{fullName(patient)}</CardTitle>
          </div>
          <PatientStatusBadge status={patient.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <Detail icon={<MapPin className="h-4 w-4" />} label="Country" value={patient.country ?? "Not set"} />
          <Detail icon={<CalendarDays className="h-4 w-4" />} label="Date of Birth" value={formatDate(patient.date_of_birth)} />
          <Detail icon={<Phone className="h-4 w-4" />} label="Phone" value={patient.phone ?? "Not set"} />
          <Detail icon={<Mail className="h-4 w-4" />} label="Email" value={patient.email ?? "Not set"} />
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
          Organization ID: <span className="font-medium text-foreground">{patient.organization_id}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  );
}
