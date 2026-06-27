-- ICOS SaaS Foundation
-- This migration creates the first Supabase-ready database foundation for
-- AfraMedico Intelligent Care Operating System (ICOS).
--
-- SaaS principle:
-- AfraMedico is the first organization using ICOS, but ICOS is not limited
-- to AfraMedico. Operational records are scoped by organization_id so future
-- organizations can grow their own independent operational knowledge.

create extension if not exists "pgcrypto";

create or replace function public.current_organization_id()
returns uuid
language sql
stable
as $$
  select nullif((select auth.jwt()) -> 'app_metadata' ->> 'organization_id', '')::uuid;
$$;

comment on function public.current_organization_id() is
  'Returns the organization_id from auth.jwt().app_metadata for SaaS tenant-scoped RLS policies.';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Maintains updated_at timestamps for mutable ICOS foundation records.';

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  country text,
  timezone text not null default 'UTC',
  currency text not null default 'USD',
  plan text not null default 'cloud',
  status text not null default 'active',
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_plan_check check (plan in ('cloud', 'enterprise', 'trial', 'internal')),
  constraint organizations_status_check check (status in ('active', 'inactive', 'suspended', 'archived'))
);

comment on table public.organizations is
  'SaaS organizations using ICOS. AfraMedico is the first organization, not the entire platform.';

create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  full_name text not null,
  email text not null,
  role text not null,
  department text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_profiles_id_organization_unique unique (id, organization_id),
  constraint user_profiles_status_check check (status in ('active', 'inactive', 'invited', 'suspended'))
);

comment on table public.user_profiles is
  'Organization-scoped ICOS user profiles. Authorization data should live in safe app metadata and database rows, not user-editable metadata.';

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  patient_code text not null,
  full_name text not null,
  country text,
  phone text,
  email text,
  whatsapp text,
  preferred_language text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint patients_id_organization_unique unique (id, organization_id),
  constraint patients_patient_code_unique unique (organization_id, patient_code)
);

comment on table public.patients is
  'Long-term patient identities. A patient may have multiple cases over time within one organization.';

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  patient_id uuid not null,
  case_code text not null,
  treatment text,
  specialty text,
  country text,
  status text not null default 'new',
  priority text not null default 'medium',
  urgency text not null default 'routine',
  current_stage text,
  current_owner_id uuid references public.user_profiles(id) on delete set null,
  current_department text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cases_patient_same_organization_fk foreign key (patient_id, organization_id) references public.patients(id, organization_id) on delete restrict,
  constraint cases_id_organization_unique unique (id, organization_id),
  constraint cases_case_code_unique unique (organization_id, case_code),
  constraint cases_priority_check check (priority in ('critical', 'high', 'medium', 'low')),
  constraint cases_urgency_check check (urgency in ('emergency', 'urgent', 'routine'))
);

comment on table public.cases is
  'Case-centered ICOS operating records. The Case is the operational center that connects workflows across modules.';

create table public.work_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  case_id uuid,
  patient_id uuid,
  title text not null,
  description text,
  department text,
  owner_id uuid references public.user_profiles(id) on delete set null,
  priority text not null default 'medium',
  status text not null default 'new',
  due_date date,
  related_module text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_items_case_same_organization_fk foreign key (case_id, organization_id) references public.cases(id, organization_id) on delete cascade,
  constraint work_items_patient_same_organization_fk foreign key (patient_id, organization_id) references public.patients(id, organization_id) on delete restrict,
  constraint work_items_priority_check check (priority in ('critical', 'high', 'medium', 'low')),
  constraint work_items_status_check check (status in ('new', 'assigned', 'in_progress', 'waiting', 'blocked', 'completed', 'cancelled', 'escalated'))
);

comment on table public.work_items is
  'Organization-scoped operational work items. No operational activity should lose owner, department, case context, or deadline history.';

create table public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  case_id uuid,
  patient_id uuid,
  event_type text not null,
  title text not null,
  description text,
  department text,
  user_id uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint timeline_events_case_same_organization_fk foreign key (case_id, organization_id) references public.cases(id, organization_id) on delete cascade,
  constraint timeline_events_patient_same_organization_fk foreign key (patient_id, organization_id) references public.patients(id, organization_id) on delete restrict
);

comment on table public.timeline_events is
  'Immutable operational timeline events that preserve the chronology of patient and case activity.';

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  case_id uuid,
  patient_id uuid,
  user_id uuid references public.user_profiles(id) on delete set null,
  action text not null,
  old_value text,
  new_value text,
  reason text,
  evidence text,
  created_at timestamptz not null default now(),
  constraint audit_events_case_same_organization_fk foreign key (case_id, organization_id) references public.cases(id, organization_id) on delete restrict,
  constraint audit_events_patient_same_organization_fk foreign key (patient_id, organization_id) references public.patients(id, organization_id) on delete restrict
);

comment on table public.audit_events is
  'Immutable audit trail for important ICOS actions, ownership changes, overrides, evidence, and decisions.';

create table public.providers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  provider_code text not null,
  name text not null,
  provider_type text not null,
  country text,
  city text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint providers_id_organization_unique unique (id, organization_id),
  constraint providers_provider_code_unique unique (organization_id, provider_code),
  constraint providers_status_check check (status in ('active', 'inactive', 'prospect', 'archived'))
);

comment on table public.providers is
  'Healthcare Provider Network foundation. Provider knowledge grows from real cases, referrals, quotes, outcomes, and relationship history.';

create table public.partners (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  partner_code text not null,
  name text not null,
  type text,
  country text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partners_partner_code_unique unique (organization_id, partner_code),
  constraint partners_status_check check (status in ('active', 'inactive', 'prospect', 'suspended', 'archived'))
);

comment on table public.partners is
  'Referral and business partners scoped by organization. Partner trust, attribution, and commission history are future migration layers.';

create table public.case_provider_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  case_id uuid not null,
  provider_id uuid not null,
  link_type text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  constraint case_provider_links_case_same_organization_fk foreign key (case_id, organization_id) references public.cases(id, organization_id) on delete cascade,
  constraint case_provider_links_provider_same_organization_fk foreign key (provider_id, organization_id) references public.providers(id, organization_id) on delete restrict,
  constraint case_provider_links_unique unique (organization_id, case_id, provider_id, link_type),
  constraint case_provider_links_status_check check (status in ('active', 'inactive', 'completed', 'cancelled'))
);

comment on table public.case_provider_links is
  'Connects cases to providers so provider knowledge can grow from real operational activity without duplicating provider records.';

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

create trigger patients_set_updated_at
before update on public.patients
for each row execute function public.set_updated_at();

create trigger cases_set_updated_at
before update on public.cases
for each row execute function public.set_updated_at();

create trigger work_items_set_updated_at
before update on public.work_items
for each row execute function public.set_updated_at();

create trigger providers_set_updated_at
before update on public.providers
for each row execute function public.set_updated_at();

create trigger partners_set_updated_at
before update on public.partners
for each row execute function public.set_updated_at();

create index organizations_slug_idx on public.organizations (slug);
create index user_profiles_organization_id_idx on public.user_profiles (organization_id);
create index user_profiles_email_idx on public.user_profiles (email);
create index patients_organization_id_idx on public.patients (organization_id);
create index cases_organization_id_idx on public.cases (organization_id);
create index cases_patient_id_idx on public.cases (patient_id);
create index work_items_organization_id_idx on public.work_items (organization_id);
create index work_items_case_id_idx on public.work_items (case_id);
create index work_items_patient_id_idx on public.work_items (patient_id);
create index work_items_owner_id_idx on public.work_items (owner_id);
create index timeline_events_organization_id_idx on public.timeline_events (organization_id);
create index timeline_events_case_id_idx on public.timeline_events (case_id);
create index timeline_events_patient_id_idx on public.timeline_events (patient_id);
create index audit_events_organization_id_idx on public.audit_events (organization_id);
create index audit_events_case_id_idx on public.audit_events (case_id);
create index audit_events_patient_id_idx on public.audit_events (patient_id);
create index providers_organization_id_idx on public.providers (organization_id);
create index partners_organization_id_idx on public.partners (organization_id);
create index case_provider_links_organization_id_idx on public.case_provider_links (organization_id);
create index case_provider_links_case_id_idx on public.case_provider_links (case_id);
create index case_provider_links_provider_id_idx on public.case_provider_links (provider_id);

alter table public.organizations enable row level security;
alter table public.user_profiles enable row level security;
alter table public.patients enable row level security;
alter table public.cases enable row level security;
alter table public.work_items enable row level security;
alter table public.timeline_events enable row level security;
alter table public.audit_events enable row level security;
alter table public.providers enable row level security;
alter table public.partners enable row level security;
alter table public.case_provider_links enable row level security;

create policy "organization members can view their organization"
on public.organizations
for select
to authenticated
using (id = public.current_organization_id());

create policy "organization members can update their organization"
on public.organizations
for update
to authenticated
using (id = public.current_organization_id())
with check (id = public.current_organization_id());

create policy "organization members can view user profiles"
on public.user_profiles
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert user profiles"
on public.user_profiles
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can update user profiles"
on public.user_profiles
for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can delete user profiles"
on public.user_profiles
for delete
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can view patients"
on public.patients
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert patients"
on public.patients
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can update patients"
on public.patients
for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can delete patients"
on public.patients
for delete
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can view cases"
on public.cases
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert cases"
on public.cases
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can update cases"
on public.cases
for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can delete cases"
on public.cases
for delete
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can view work items"
on public.work_items
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert work items"
on public.work_items
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can update work items"
on public.work_items
for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can delete work items"
on public.work_items
for delete
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can view timeline events"
on public.timeline_events
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert timeline events"
on public.timeline_events
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can view audit events"
on public.audit_events
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert audit events"
on public.audit_events
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can view providers"
on public.providers
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert providers"
on public.providers
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can update providers"
on public.providers
for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can delete providers"
on public.providers
for delete
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can view partners"
on public.partners
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert partners"
on public.partners
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can update partners"
on public.partners
for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can delete partners"
on public.partners
for delete
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can view case provider links"
on public.case_provider_links
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert case provider links"
on public.case_provider_links
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can update case provider links"
on public.case_provider_links
for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can delete case provider links"
on public.case_provider_links
for delete
to authenticated
using (organization_id = public.current_organization_id());
