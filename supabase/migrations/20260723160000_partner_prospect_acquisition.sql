-- Partner Acquisition Pipeline MVP.
--
-- This migration creates the organization-scoped prospect table used to import
-- evaluated partner candidates from the AfraMedico resume evaluation workbook.
-- It is additive only and does not approve partners or send email.

create table public.partner_prospects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  first_name text,
  last_name text,
  full_name text not null,
  email text not null,
  email_normalized text generated always as (lower(btrim(email))) stored,
  phone text,
  country text,
  city text,
  profession text,
  recommended_role text,
  overall_suitability_score numeric(5,2),
  email_campaign_group text,
  contact_priority text,
  personalized_email_type text,
  reason_for_assignment text,
  source text not null default 'resume_evaluation_workbook',
  outreach_status text not null default 'new',
  invitation_sent_at timestamptz,
  last_email_status text,
  partner_id uuid,
  partner_network_intake_id uuid,
  applied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_prospects_id_organization_unique unique (id, organization_id),
  constraint partner_prospects_email_unique unique (organization_id, email_normalized),
  constraint partner_prospects_partner_same_organization_fk foreign key (partner_id, organization_id) references public.partners(id, organization_id) on delete set null,
  constraint partner_prospects_intake_fk foreign key (partner_network_intake_id) references public.partner_network_intake(id) on delete set null,
  constraint partner_prospects_score_check check (
    overall_suitability_score is null or
    (overall_suitability_score >= 0 and overall_suitability_score <= 100)
  ),
  constraint partner_prospects_outreach_status_check check (
    outreach_status in ('new', 'email_sent', 'applied', 'approved', 'active', 'declined', 'held')
  )
);

comment on table public.partner_prospects is
  'Evaluated referral partner prospects imported from AfraMedico resume evaluation workbooks. Email is the duplicate-protection key per organization.';

comment on column public.partner_prospects.email_normalized is
  'Generated normalized email used for idempotent workbook imports and future application matching.';

create trigger partner_prospects_set_updated_at
before update on public.partner_prospects
for each row execute function public.set_updated_at();

create index partner_prospects_organization_id_idx on public.partner_prospects (organization_id);
create index partner_prospects_status_idx on public.partner_prospects (organization_id, outreach_status);
create index partner_prospects_campaign_idx on public.partner_prospects (organization_id, email_campaign_group);
create index partner_prospects_priority_idx on public.partner_prospects (organization_id, contact_priority);
create index partner_prospects_score_idx on public.partner_prospects (organization_id, overall_suitability_score desc);
create index partner_prospects_country_idx on public.partner_prospects (organization_id, country);
create index partner_prospects_created_at_idx on public.partner_prospects (organization_id, created_at desc);
create index partner_prospects_partner_id_idx on public.partner_prospects (partner_id);
create index partner_prospects_intake_id_idx on public.partner_prospects (partner_network_intake_id);

alter table public.partner_prospects enable row level security;

create policy "organization members can view partner prospects"
on public.partner_prospects
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert partner prospects"
on public.partner_prospects
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can update partner prospects"
on public.partner_prospects
for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

-- Partner prospects are an outreach audit surface. No delete policy is created
-- in the MVP; records can be held/declined instead of removed.
