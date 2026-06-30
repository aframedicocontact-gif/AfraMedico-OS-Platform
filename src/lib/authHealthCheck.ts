import { getSession } from "../services/authService";
import { supabaseConfig } from "./supabaseClient";

export type AuthHealthCheckResult = {
  environmentConfigured: boolean;
  sessionReadable: boolean;
  authClientResponds: boolean;
  isAuthenticated: boolean;
  status: "ready" | "not_configured" | "session_unavailable";
  message: string;
};

export async function runAuthHealthCheck(): Promise<AuthHealthCheckResult> {
  if (!supabaseConfig.isConfigured) {
    return {
      environmentConfigured: false,
      sessionReadable: false,
      authClientResponds: false,
      isAuthenticated: false,
      status: "not_configured",
      message:
        supabaseConfig.configurationError ??
        "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before testing auth.",
    };
  }

  try {
    const session = await getSession();

    return {
      environmentConfigured: true,
      sessionReadable: true,
      authClientResponds: true,
      isAuthenticated: Boolean(session?.access_token),
      status: "ready",
      message: session ? "Auth session is available." : "Auth client responded; no active session found.",
    };
  } catch (error) {
    return {
      environmentConfigured: true,
      sessionReadable: false,
      authClientResponds: false,
      isAuthenticated: false,
      status: "session_unavailable",
      message: error instanceof Error ? error.message : "Unable to read auth session.",
    };
  }
}
