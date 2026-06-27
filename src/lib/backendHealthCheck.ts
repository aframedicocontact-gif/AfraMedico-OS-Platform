import { querySupabaseTable, supabaseConfig } from "./supabaseClient";

export type BackendHealthCheckResult = {
  clientLoaded: boolean;
  environmentConfigured: boolean;
  organizationsQuerySucceeded: boolean;
  status: "ready" | "not_configured" | "query_failed";
  message: string;
};

export async function runBackendHealthCheck(): Promise<BackendHealthCheckResult> {
  const clientLoaded = Boolean(querySupabaseTable);
  const environmentConfigured = supabaseConfig.isConfigured;

  if (!environmentConfigured) {
    return {
      clientLoaded,
      environmentConfigured,
      organizationsQuerySucceeded: false,
      status: "not_configured",
      message: "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before testing the backend connection.",
    };
  }

  const result = await querySupabaseTable<Array<{ id: string; name: string }>>("organizations", {
    select: "id,name",
    limit: 1,
  });

  if (result.error) {
    return {
      clientLoaded,
      environmentConfigured,
      organizationsQuerySucceeded: false,
      status: "query_failed",
      message: result.error,
    };
  }

  return {
    clientLoaded,
    environmentConfigured,
    organizationsQuerySucceeded: true,
    status: "ready",
    message: "Backend connection check completed successfully.",
  };
}
