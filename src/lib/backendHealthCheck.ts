import { querySupabaseTable, supabaseClient, supabaseConfig } from "./supabaseClient";

export type BackendHealthCheckResult = {
  clientLoaded: boolean;
  clientInitialized: boolean;
  environmentConfigured: boolean;
  organizationsQuerySucceeded: boolean;
  organizationCount: number | null;
  error: string | null;
  status: "ready" | "not_configured" | "query_failed";
  message: string;
};

export async function runBackendHealthCheck(): Promise<BackendHealthCheckResult> {
  const clientLoaded = Boolean(supabaseClient);
  const clientInitialized = Boolean(supabaseClient.config);
  const environmentConfigured = supabaseConfig.isConfigured;

  if (!environmentConfigured) {
    return {
      clientLoaded,
      clientInitialized,
      environmentConfigured,
      organizationsQuerySucceeded: false,
      organizationCount: null,
      error: supabaseConfig.configurationError ?? "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.",
      status: "not_configured",
      message:
        supabaseConfig.configurationError ??
        "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before testing the backend connection.",
    };
  }

  const result = await querySupabaseTable<Array<{ id: string; name: string }>>("organizations", {
    select: "id,name",
    limit: 1,
  });

  if (result.error) {
    return {
      clientLoaded,
      clientInitialized,
      environmentConfigured,
      organizationsQuerySucceeded: false,
      organizationCount: null,
      error: result.error,
      status: "query_failed",
      message: result.error,
    };
  }

  return {
    clientLoaded,
    clientInitialized,
    environmentConfigured,
    organizationsQuerySucceeded: true,
    organizationCount: result.data?.length ?? 0,
    error: null,
    status: "ready",
    message: "Backend connection check completed successfully.",
  };
}
