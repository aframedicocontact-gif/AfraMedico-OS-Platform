import { querySupabaseTable } from "../lib/supabaseClient";

export type OrganizationRecord = {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  timezone: string;
  currency: string;
  plan: string;
  status: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
};

export async function listOrganizations(limit = 20) {
  return querySupabaseTable<OrganizationRecord[]>("organizations", {
    select: "*",
    limit,
    order: "created_at.desc",
  });
}

export async function getOrganizationById(id: string) {
  return querySupabaseTable<OrganizationRecord[]>("organizations", {
    select: "*",
    id: `eq.${id}`,
    limit: 1,
  });
}
