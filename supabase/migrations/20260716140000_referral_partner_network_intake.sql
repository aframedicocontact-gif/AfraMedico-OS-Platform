-- Phase 1A: Additive companion table for partners transferred from the
-- AfraMedico Network Platform's Referral Partner program.
--
-- Reuses the existing public.partners table (no new Partner module) and
-- does not touch public.organizations, public.providers, or any existing
-- clinical/finance/commission table. Writes happen only through the
-- partner-network-intake edge function (service role); RLS below only
-- grants read access, scoped by organization, to authenticated users.

-- Additive nullable columns on the existing partners table so a transferred
-- website applicant can be told apart from an automated-discovery prospect
-- and can carry its own lifecycle stage without disturbing existing rows
-- (both columns are nullable, so every pre-existing partner is unaffected).
alter table public.partners
  add column if not exists acquisition_source text,
  add column if not exists lifecycle_stage text;

create table public.partner_network_intake (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  partner_id uuid not null references public.partners(id) on delete restrict,
  source_application_id uuid not null,
  full_name text not null,
  email text not null,
  phone text,
  country text,
  city text,
  organization_name text,
  professional_title text,
  applicant_category text,
  years_experience integer,
  languages text[],
  target_countries text[],
  network_description text,
  relevant_experience text,
  motivation text,
  linkedin text,
  application_date timestamptz,
  created_at timestamptz not null default now(),
  constraint partner_network_intake_source_application_unique unique (source_application_id)
);

comment on table public.partner_network_intake is
  'Snapshot of accepted Referral Partner applications transferred from the AfraMedico Network Platform (Phase 1A). Exactly one row per source_application_id; each row is linked 1:1 to the partners row it created.';

create index partner_network_intake_organization_id_idx on public.partner_network_intake (organization_id);
create index partner_network_intake_partner_id_idx on public.partner_network_intake (partner_id);

alter table public.partner_network_intake enable row level security;

create policy partner_network_intake_org_isolation_select
on public.partner_network_intake for select
using (organization_id = public.current_organization_id());

-- No insert/update/delete policies: only the partner-network-intake edge
-- function (service role, which bypasses RLS) writes to this table.
