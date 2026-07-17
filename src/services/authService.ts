import { supabaseConfig } from "../lib/supabaseClient";

const SESSION_STORAGE_KEY = "aframedico.supabase.session";

export type AuthUser = {
  id: string;
  email?: string;
  aud?: string;
  role?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

export type AuthSession = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  token_type?: string;
  user: AuthUser;
};

export type AuthChangeEvent = "SIGNED_IN" | "SIGNED_OUT" | "SESSION_LOADED";
export type AuthChangeCallback = (event: AuthChangeEvent, session: AuthSession | null) => void;

export type PasswordRecoveryTokens = {
  accessToken: string;
  refreshToken: string | null;
  tokenType: string | null;
  type: string | null;
};

const authListeners = new Set<AuthChangeCallback>();

function authUrl(path: string) {
  return `${supabaseConfig.url.replace(/\/$/, "")}/auth/v1${path}`;
}

function authHeaders(accessToken?: string) {
  return {
    apikey: supabaseConfig.anonKey,
    Authorization: `Bearer ${accessToken ?? supabaseConfig.anonKey}`,
    "Content-Type": "application/json",
  };
}

function readStoredSession() {
  if (typeof window === "undefined") return null;

  const value = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!value) return null;

  try {
    return JSON.parse(value) as AuthSession;
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

function storeSession(session: AuthSession | null) {
  if (typeof window === "undefined") return;

  if (!session) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function notifyAuthListeners(event: AuthChangeEvent, session: AuthSession | null) {
  authListeners.forEach((listener) => listener(event, session));
}

function parseRecoveryParams(value: string) {
  const normalized = value.replace(/^[#?/]+/, "");
  if (!normalized) return null;

  const params = new URLSearchParams(normalized);
  const accessToken = params.get("access_token");

  if (!accessToken) return null;

  return {
    accessToken,
    refreshToken: params.get("refresh_token"),
    tokenType: params.get("token_type"),
    type: params.get("type"),
  };
}

export function getPasswordRecoveryTokensFromLocation(location: Location = window.location) {
  return (
    parseRecoveryParams(location.hash) ??
    parseRecoveryParams(location.search) ??
    parseRecoveryParams(location.pathname)
  );
}

export async function signInWithEmailPassword(email: string, password: string) {
  if (!supabaseConfig.isConfigured) {
    throw new Error("Supabase environment variables are not configured.");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const response = await fetch(authUrl("/token?grant_type=password"), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email: normalizedEmail, password }),
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body?.msg ?? body?.message ?? "Unable to sign in.");
  }

  const session: AuthSession = {
    access_token: body.access_token,
    refresh_token: body.refresh_token,
    expires_in: body.expires_in,
    expires_at: body.expires_at,
    token_type: body.token_type,
    user: body.user,
  };

  storeSession(session);
  notifyAuthListeners("SIGNED_IN", session);

  return session;
}

// Adopts a session directly from the access/refresh tokens Supabase places
// in the URL hash fragment after a native invite or magic-link redirect.
// This never talks to a custom token endpoint — it validates the
// Supabase-issued access token against GET /auth/v1/user and then stores it
// exactly like a password sign-in, so the rest of the app (querySupabaseTable,
// callSupabaseFunction) picks it up automatically.
export async function adoptSessionFromTokens(tokens: PasswordRecoveryTokens) {
  if (!supabaseConfig.isConfigured) {
    throw new Error("Supabase environment variables are not configured.");
  }
  if (!tokens.accessToken) {
    throw new Error("No access token was found in the invite link.");
  }

  const response = await fetch(authUrl("/user"), {
    headers: authHeaders(tokens.accessToken),
  });

  const responseText = await response.text();
  const body = responseText ? JSON.parse(responseText) : null;

  if (!response.ok) {
    throw new Error(body?.msg ?? body?.message ?? "This invite link is invalid or has expired.");
  }

  const session: AuthSession = {
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken ?? undefined,
    token_type: tokens.tokenType ?? undefined,
    user: body as AuthUser,
  };

  storeSession(session);
  notifyAuthListeners("SIGNED_IN", session);

  return session;
}

export async function updatePasswordWithRecoveryToken(accessToken: string, password: string) {
  if (!supabaseConfig.isConfigured) {
    throw new Error("Supabase environment variables are not configured.");
  }

  const response = await fetch(authUrl("/user"), {
    method: "PUT",
    headers: authHeaders(accessToken),
    body: JSON.stringify({ password }),
  });

  const responseText = await response.text();
  const body = responseText ? JSON.parse(responseText) : null;

  if (!response.ok) {
    throw new Error(body?.msg ?? body?.message ?? "Unable to update password.");
  }

  storeSession(null);
  notifyAuthListeners("SIGNED_OUT", null);

  return body;
}

export async function signOut() {
  const session = readStoredSession();

  if (supabaseConfig.isConfigured && session?.access_token) {
    await fetch(authUrl("/logout"), {
      method: "POST",
      headers: authHeaders(session.access_token),
    }).catch(() => undefined);
  }

  storeSession(null);
  notifyAuthListeners("SIGNED_OUT", null);
}

export async function getSession() {
  const session = readStoredSession();

  if (!session?.access_token || !supabaseConfig.isConfigured) {
    notifyAuthListeners("SESSION_LOADED", session);
    return session;
  }

  const response = await fetch(authUrl("/user"), {
    headers: authHeaders(session.access_token),
  });

  if (!response.ok) {
    storeSession(null);
    notifyAuthListeners("SESSION_LOADED", null);
    return null;
  }

  const validatedSession = {
    ...session,
    user: (await response.json()) as AuthUser,
  };

  storeSession(validatedSession);
  notifyAuthListeners("SESSION_LOADED", validatedSession);
  return validatedSession;
}

export async function getCurrentUser() {
  const session = readStoredSession();
  if (!session?.access_token || !supabaseConfig.isConfigured) {
    return null;
  }

  const response = await fetch(authUrl("/user"), {
    headers: authHeaders(session.access_token),
  });

  if (!response.ok) {
    return session.user ?? null;
  }

  return (await response.json()) as AuthUser;
}

export function onAuthStateChange(callback: AuthChangeCallback) {
  authListeners.add(callback);

  return {
    unsubscribe() {
      authListeners.delete(callback);
    },
  };
}
