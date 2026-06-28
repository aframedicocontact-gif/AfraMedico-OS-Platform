import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Database, RefreshCw, Search, UsersRound } from "lucide-react";
import {
  getCurrentOrganizationPatients,
  type PatientServiceResult,
} from "../../services/patientService";
import type { Patient, PatientStatus } from "../../types/patient";
import { PatientCard } from "../patients/PatientCard";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Select } from "../ui/select";

type PatientsPageState = {
  loading: boolean;
  result: PatientServiceResult<Patient[]> | null;
};

export function PatientsPage() {
  const [state, setState] = useState<PatientsPageState>({
    loading: true,
    result: null,
  });
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | PatientStatus>("all");

  async function loadPatients() {
    setState((current) => ({ ...current, loading: true }));
    const result = await getCurrentOrganizationPatients();
    setState({ loading: false, result });
  }

  useEffect(() => {
    void loadPatients();
  }, []);

  const patients = state.result?.data ?? [];
  const source = state.result?.source ?? "unavailable";
  const filteredPatients = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return patients.filter((patient) => {
      const fullName = `${patient.first_name} ${patient.last_name}`;
      const matchesStatus = status === "all" || patient.status === status;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [fullName, patient.country, patient.email, patient.phone]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [patients, query, status]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Platform administration</p>
          <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">Patient Management</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Manage organization-scoped patient records. This first module reads live Supabase data when available and preserves a safe development fallback.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={() => void loadPatients()}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">Connection Mode</CardTitle>
            <Badge tone={source === "live" ? "success" : source === "mock" ? "warning" : "danger"}>
              {source}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Live mode reads `public.patients`. Mock mode keeps the patient workflow usable until backend auth and tenant context are fully linked.
          </p>
        </CardHeader>
        {state.result?.error ? (
          <CardContent>
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {state.result.error}
            </div>
          </CardContent>
        ) : null}
      </Card>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search patient name, country, email, or phone"
            />
          </label>
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value as "all" | PatientStatus)}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="prospect">Prospect</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </Select>
        </div>
      </div>

      {state.loading ? (
        <StateCard
          icon={<Database className="h-5 w-5" />}
          title="Loading patients"
          description="Checking live Supabase access and fallback patient data."
        />
      ) : filteredPatients.length === 0 ? (
        <StateCard
          icon={<UsersRound className="h-5 w-5" />}
          title="No patients found"
          description="Try clearing the search or changing the status filter."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredPatients.map((patient) => (
            <PatientCard key={patient.id} patient={patient} />
          ))}
        </div>
      )}
    </div>
  );
}

function StateCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-5">
        <div className="rounded-md bg-emerald-50 p-2 text-emerald-700">{icon}</div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
