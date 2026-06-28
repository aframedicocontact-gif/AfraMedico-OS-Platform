import { useEffect, useState, type ReactNode } from "react";
import { Building2, Database, RefreshCw } from "lucide-react";
import { getOrganizations, type OrganizationServiceResult } from "../../services/organizationService";
import type { PlatformOrganization } from "../../types/organization";
import { OrganizationCard } from "../organizations/OrganizationCard";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type OrganizationsPageState = {
  loading: boolean;
  result: OrganizationServiceResult<PlatformOrganization[]> | null;
};

export function OrganizationsPage() {
  const [state, setState] = useState<OrganizationsPageState>({
    loading: true,
    result: null,
  });

  async function loadOrganizations() {
    setState((current) => ({ ...current, loading: true }));
    const result = await getOrganizations();
    setState({ loading: false, result });
  }

  useEffect(() => {
    void loadOrganizations();
  }, []);

  const organizations = state.result?.data ?? [];
  const source = state.result?.source ?? "unavailable";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Platform administration</p>
          <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">Organization Management</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Manage tenant organizations for ICOS. This module is live-backend ready and keeps a development fallback while Supabase access is being connected.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={() => void loadOrganizations()}>
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
            Live mode reads `public.organizations`. Mock mode keeps the UI usable before local auth and organization context are fully linked.
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

      {state.loading ? (
        <StateCard
          icon={<Database className="h-5 w-5" />}
          title="Loading organizations"
          description="Checking live Supabase access and fallback organization data."
        />
      ) : organizations.length === 0 ? (
        <StateCard
          icon={<Building2 className="h-5 w-5" />}
          title="No organizations found"
          description="The organization table is reachable, but no organization records were returned."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {organizations.map((organization) => (
            <OrganizationCard key={organization.id} organization={organization} />
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
