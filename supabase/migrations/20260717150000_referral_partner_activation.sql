-- Phase 1B: Referral Partner activation portal.
--
-- An approved_activation_pending live partner is invited through Supabase's
-- native invite/magic-link flow, signs in, and completes a small set of
-- onboarding fields on a standalone /partner/activate route.
--
-- This migration is 100% additive: two new tables and one new helper
-- function. It does not ALTER any existing table (not public.partners, not
-- public.organizations, not any authentication/operational table) and does
-- not add or change any policy on an existing table.
--
-- Containment model (why no existing table needs a new policy):
-- A partner-portal auth session's app_metadata NEVER contains
-- organization_id (send-partner-activation-invite merges in only
-- `partner_portal: true`, never organization_id). Every existing RLS policy
-- in this schema is `organization_id = public.current_organization_id()`,
-- and current_organization_id() reads organization_id straight out of
-- app_metadata. A partner-portal session therefore always evaluates that
-- comparison against NULL and is denied by every existing policy on every
-- existing table automatically -- no new RESTRICTIVE policy is required
-- anywhere else in the schema. The partner is never granted an
-- organization-wide session; it is never a member of public.organization_users,
-- never gets a public.user_profiles row, and never gets a
-- public.user_role_assignments row.
--
-- Access model for the two new tables below: no INSERT/UPDATE/DELETE policy
-- is defined for `authenticated` on either, and no SELECT policy is defined
-- for a partner-portal session either -- both tables are written and read
-- exclusively by two service-role Edge Functions (send-partner-activation-invite,
-- partner-activation), which bypass RLS entirely. A partner session that
-- attempts to query either table directly via PostgREST gets zero rows back
-- (RLS defaults to deny when no policy grants the operation), consistent
-- with "no direct partner-facing PostgREST policies."

-- ---------------------------------------------------------------------
-- public.partner_auth_links
-- ---------------------------------------------------------------------
create table public.partner_auth_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  partner_id uuid not null references public.partners(id) on delete restrict,
  auth_user_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'invited',
  invited_by uuid references public.user_profiles(id) on delete restrict,
  invited_at timestamptz not null default now(),
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_auth_links_partner_unique unique (partner_id),
  constraint partner_auth_links_auth_user_unique unique (auth_user_id),
  constraint partner_auth_links_status_check check (status in ('invited', 'active', 'revoked'))
);

comment on table public.partner_auth_links is
  'Links exactly one auth.users identity to exactly one partners row for the Phase 1B referral-partner activation portal. Written only by the send-partner-activation-invite and partner-activation Edge Functions (service role); no partner-facing PostgREST policy exists on this table.';

create index partner_auth_links_organization_id_idx on public.partner_auth_links (organization_id);
create index partner_auth_links_auth_user_id_idx on public.partner_auth_links (auth_user_id);

create trigger partner_auth_links_set_updated_at
before update on public.partner_auth_links
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- public.partner_onboarding_profiles
-- ---------------------------------------------------------------------
create table public.partner_onboarding_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  partner_id uuid not null references public.partners(id) on delete restrict,
  legal_full_name text,
  legal_address text,
  entity_type text,
  authorized_representative_name text,
  preferred_communication_method text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_onboarding_profiles_partner_unique unique (partner_id),
  constraint partner_onboarding_profiles_entity_type_check check (entity_type is null or entity_type in ('individual', 'organization')),
  constraint partner_onboarding_profiles_comm_method_check check (preferred_communication_method is null or preferred_communication_method in ('email', 'phone', 'whatsapp'))
);

comment on table public.partner_onboarding_profiles is
  'Onboarding fields collected on /partner/activate (legal name, legal address, entity type, authorized representative, preferred communication method). No payment, tax, or commission banking data. Written only by the partner-activation Edge Function (service role); no partner-facing PostgREST policy exists on this table.';

create index partner_onboarding_profiles_organization_id_idx on public.partner_onboarding_profiles (organization_id);

create trigger partner_onboarding_profiles_set_updated_at
before update on public.partner_onboarding_profiles
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- RLS: staff-only read access, no partner-facing policy, no write policy.
-- ---------------------------------------------------------------------
alter table public.partner_auth_links enable row level security;
alter table public.partner_onboarding_profiles enable row level security;

create policy "organization staff can view partner auth links"
on public.partner_auth_links for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization staff can view partner onboarding profiles"
on public.partner_onboarding_profiles for select
to authenticated
using (organization_id = public.current_organization_id());

-- No insert/update/delete policies on either table, and no select policy
-- for the partner themselves: only the two Edge Functions (service role,
-- which bypasses RLS) read or write these rows on the partner's behalf.

-- ---------------------------------------------------------------------
-- public.is_active_org_admin(p_auth_user_id, p_organization_id)
-- ---------------------------------------------------------------------
-- Explicit, role-code-based admin authorization check used only by
-- send-partner-activation-invite (called through the service-role client,
-- which is why this is a plain SQL function rather than SECURITY DEFINER --
-- it never runs under an RLS-constrained session). Confirms, in one place:
-- role code is exactly 'organization_administrator'; the role itself is
-- active; the caller's organization membership is active on both the
-- employment_status and access_status axes; the organization itself is
-- active; the specific role assignment is not revoked, has started, and has
-- not expired.
create or replace function public.is_active_org_admin(p_auth_user_id uuid, p_organization_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_users ou
    join public.user_role_assignments ura
      on ura.organization_user_id = ou.id
     and ura.organization_id = ou.organization_id
    join public.roles r
      on r.id = ura.role_id
     and r.organization_id = ou.organization_id
    join public.organizations o
      on o.id = ou.organization_id
    where ou.user_id = p_auth_user_id
      and ou.organization_id = p_organization_id
      and ou.employment_status = 'active'
      and ou.access_status = 'active'
      and o.status = 'active'
      and r.code = 'organization_administrator'
      and r.status = 'active'
      and ura.revoked_at is null
      and ura.starts_at <= now()
      and (ura.expires_at is null or ura.expires_at > now())
  );
$$;

comment on function public.is_active_org_admin(uuid, uuid) is
  'True only when p_auth_user_id holds an active, non-revoked, non-expired organization_administrator role assignment within p_organization_id, with both the organization and the membership active. Used by send-partner-activation-invite to gate who may send/resend a partner activation invite. Intended to be called only through a service-role client.';

revoke all on function public.is_active_org_admin(uuid, uuid) from public, anon, authenticated;
grant execute on function public.is_active_org_admin(uuid, uuid) to service_role;
