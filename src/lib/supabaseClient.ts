type QueryParams = Record<string, string | number | boolean | undefined>;

export type SupabaseClientConfig = {
  url: string;
  anonKey: string;
  isConfigured: boolean;
};

export type SupabaseQueryResult<T> = {
  data: T | null;
  error: string | null;
  status: number;
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";
const sessionStorageKey = "aframedico.supabase.session";

export const supabaseConfig: SupabaseClientConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  isConfigured: Boolean(supabaseUrl && supabaseAnonKey),
};

function buildRestUrl(tableName: string, queryParams: QueryParams = {}) {
  const baseUrl = supabaseConfig.url.replace(/\/$/, "");
  const url = new URL(`${baseUrl}/rest/v1/${tableName}`);

  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

function getStoredAccessToken() {
  if (typeof window === "undefined") return null;

  const value = window.localStorage.getItem(sessionStorageKey);
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as { access_token?: string };
    return parsed.access_token ?? null;
  } catch {
    return null;
  }
}

export async function querySupabaseTable<T>(
  tableName: string,
  queryParams: QueryParams = {},
): Promise<SupabaseQueryResult<T>> {
  if (!supabaseConfig.isConfigured) {
    return {
      data: null,
      error: "Supabase environment variables are not configured.",
      status: 0,
    };
  }

  try {
    const accessToken = getStoredAccessToken();
    const response = await fetch(buildRestUrl(tableName, queryParams), {
      headers: {
        apikey: supabaseConfig.anonKey,
        Authorization: `Bearer ${accessToken ?? supabaseConfig.anonKey}`,
      },
    });

    const responseText = await response.text();
    const body = responseText ? JSON.parse(responseText) : null;

    if (!response.ok) {
      return {
        data: null,
        error: body?.message ?? response.statusText,
        status: response.status,
      };
    }

    return {
      data: body as T,
      error: null,
      status: response.status,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown Supabase request error.",
      status: 0,
    };
  }
}

export const supabaseClient = {
  config: supabaseConfig,
  from<T>(tableName: string, queryParams: QueryParams = {}) {
    return querySupabaseTable<T>(tableName, queryParams);
  },
};
