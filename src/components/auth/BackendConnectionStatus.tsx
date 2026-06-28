import { useEffect, useState } from "react";
import {
  runBackendHealthCheck,
  type BackendHealthCheckResult,
} from "../../lib/backendHealthCheck";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

function statusVariant(status: BackendHealthCheckResult["status"]) {
  if (status === "ready") return "success";
  if (status === "not_configured") return "warning";
  return "danger";
}

export function BackendConnectionStatus() {
  const [result, setResult] = useState<BackendHealthCheckResult | null>(null);

  useEffect(() => {
    let mounted = true;

    runBackendHealthCheck().then((healthCheck) => {
      if (mounted) {
        setResult(healthCheck);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Backend Connection</CardTitle>
          {result ? <Badge tone={statusVariant(result.status)}>{result.status}</Badge> : null}
        </div>
        <p className="text-xs text-muted-foreground">
          Development-only Supabase connection check.
        </p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {!result ? (
          <p className="text-muted-foreground">Checking Supabase connection...</p>
        ) : (
          <>
            <div className="grid gap-2">
              <StatusRow label="Supabase configured" value={result.environmentConfigured} />
              <StatusRow label="Client initialized" value={result.clientInitialized} />
              <StatusRow label="Organizations query" value={result.organizationsQuerySucceeded} />
            </div>
            <p className="text-xs leading-5 text-muted-foreground">{result.message}</p>
            {result.error ? (
              <p className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                {result.error}
              </p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function StatusRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={value ? "font-medium text-emerald-700" : "font-medium text-amber-700"}>
        {value ? "OK" : "Missing"}
      </span>
    </div>
  );
}
