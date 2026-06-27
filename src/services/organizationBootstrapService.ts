import { getDevelopmentOrganizationContext } from "../lib/currentOrganization";
import { supabaseConfig } from "../lib/supabaseClient";
import { getSession } from "./authService";
import type { OrganizationRecord } from "./organizationService";

export type UserProfileRecord = {
  id: string;
  organization_id: string;
  full_name: string;
  email: string;
  role: string;
  department: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type BootstrapStatus = {
  environmentConfigured: boolean;
  authenticated: boolean;
  organizationAvailable: boolean;
  userProfileAvailable: boolean;
  organizationId: string | null;
  message: string;
};

type BootstrapQueryResult<T> = {
  data: T | null;
  error: string | null;
};

function buildRestUrl(tableName: string, queryParams: Record<string, string | number | boolean | undefined>) {
  const baseUrl = supabaseConfig.url.replace(/\/$/, "");
  const url = new URL(`${baseUrl}/rest/v1/${tableName}`);

  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

async function queryWithCurrentSession<T>(
  tableName: string,
  queryParams: Record<string, string | number | boolean | undefined>,
): Promise<BootstrapQueryResult<T>> {
  if (!supabaseConfig.isConfigured) {
    return { data: null, error: "Supabase environment variables are not configured." };
  }

  const session = await getSession();
  if (!session?.access_token) {
    return { data: null, error: "No authenticated Supabase session is available." };
  }

  try {
    const response = await fetch(buildRestUrl(tableName, queryParams), {
      headers: {
        apikey: supabaseConfig.anonKey,
        Authorization: `Bearer ${session.access_token}`,
      },
    });
    const responseText = await response.text();
    const body = responseText ? JSON.parse(responseText) : null;

    if (!response.ok) {
      return { data: null, error: body?.message ?? response.statusText };
    }

    return { data: body as T, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown Supabase bootstrap request error.",
    };
  }
}

export async function getCurrentOrganization() {
  const developmentContext = getDevelopmentOrganizationContext();

  if (!developmentContext.id) {
    return null;
  }

  const result = await queryWithCurrentSession<OrganizationRecord[]>("organizations", {
    select: "*",
    id: `eq.${developmentContext.id}`,
    limit: 1,
  });

  return result.data?.[0] ?? null;
}

export async function getCurrentUserProfile() {
  const session = await getSession();

  if (!session?.user?.id) {
    return null;
  }

  const result = await queryWithCurrentSession<UserProfileRecord[]>("user_profiles", {
    select: "*",
    id: `eq.${session.user.id}`,
    limit: 1,
  });

  return result.data?.[0] ?? null;
}

export async function checkBootstrapStatus(): Promise<BootstrapStatus> {
  const developmentContext = getDevelopmentOrganizationContext();
  const session = await getSession();

  if (!supabaseConfig.isConfigured) {
    return {
      environmentConfigured: false,
      authenticated: false,
      organizationAvailable: false,
      userProfileAvailable: false,
      organizationId: developmentContext.id,
      message: "Supabase environment variables are not configured.",
    };
  }

  if (!session?.access_token) {
    return {
      environmentConfigured: true,
      authenticated: false,
      organizationAvailable: false,
      userProfileAvailable: false,
      organizationId: developmentContext.id,
      message: "No active Supabase session. Sign in through the development login first.",
    };
  }

  const [organization, userProfile] = await Promise.all([
    getCurrentOrganization(),
    getCurrentUserProfile(),
  ]);

  return {
    environmentConfigured: true,
    authenticated: true,
    organizationAvailable: Boolean(organization),
    userProfileAvailable: Boolean(userProfile),
    organizationId: organization?.id ?? developmentContext.id,
    message:
      organization && userProfile
        ? "Development bootstrap connection is ready."
        : "Bootstrap records are not fully linked yet.",
  };
}
