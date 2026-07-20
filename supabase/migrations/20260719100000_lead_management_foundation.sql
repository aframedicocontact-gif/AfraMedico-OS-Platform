-- Phase 1: Lead Management backend foundation.
--
-- public.partner_patient_referrals remains the original partner submission and
-- attribution record. public.leads is the internal AfraMedico operational Lead
-- record. Partner Portal users keep no organization_id app_metadata claim and
-- receive no direct RLS access to internal Lead tables.

create or replace function public.generate_lead_code()
returns text
language sql
volatile
as $$
  select 'LEAD-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
$$;

comment on function public.generate_lead_code() is
  'Generates a collision-resistant human-readable Lead code without browser sequencing or count-based generation.';

create or replace function public.generate_patient_reference_code()
returns text
language sql
volatile
as $$
  select 'PAT-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
$$;

comment on function public.generate_patient_reference_code() is
  'Generates a human-readable operational patient reference for Lead intake before a real patient_id exists.';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'partners_id_organization_unique'
      and conrelid = 'public.partners'::regclass
  ) then
    alter table public.partners
      add constraint partners_id_organization_unique unique (id, organization_id);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'partner_patient_referrals_id_organization_unique'
      and conrelid = 'public.partner_patient_referrals'::regclass
  ) then
    alter table public.partner_patient_referrals
      add constraint partner_patient_referrals_id_organization_unique unique (id, organization_id);
  end if;
end;
$$;

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  lead_code text not null,
  patient_id uuid,
  patient_reference_code text not null,
  source_referral_id uuid,
  partner_id uuid,
  partner_code text,
  acquisition_source text not null default 'manual',
  submission_channel text not null default 'internal_staff',
  patient_full_name text not null,
  date_of_birth date,
  country text not null,
  city text,
  nationality text,
  gender text,
  preferred_language text,
  primary_email text,
  phone_country_code text,
  phone_local_number text,
  phone_e164 text,
  whatsapp_country_code text,
  whatsapp_local_number text,
  whatsapp_e164 text,
  preferred_contact_method text,
  requested_treatment text not null,
  medical_condition text,
  medical_summary text,
  medical_history text,
  urgency text not null default 'unknown',
  preferred_destination text,
  initial_records_ready boolean not null default false,
  pipeline_stage text not null default 'new_lead',
  lead_status text not null default 'open',
  priority text not null default 'Medium',
  assigned_coordinator_id uuid,
  assigned_coordinator_name text,
  assigned_hospital_name text,
  referral_partner_name text,
  next_follow_up_at timestamptz,
  qualification_status text not null default 'unreviewed',
  internal_summary text,
  converted_case_id uuid,
  closed_reason text,
  closed_at timestamptz,
  patient_consent_confirmed boolean not null default false,
  consent_confirmed_at timestamptz,
  consent_confirmed_by_partner_id uuid,
  submitted_at timestamptz not null default now(),
  submitted_by_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leads_id_organization_unique unique (id, organization_id),
  constraint leads_lead_code_unique unique (organization_id, lead_code),
  constraint leads_source_referral_unique unique (source_referral_id),
  constraint leads_patient_same_organization_fk foreign key (patient_id, organization_id) references public.patients(id, organization_id) on delete set null,
  constraint leads_partner_same_organization_fk foreign key (partner_id, organization_id) references public.partners(id, organization_id) on delete restrict,
  constraint leads_source_referral_same_organization_fk foreign key (source_referral_id, organization_id) references public.partner_patient_referrals(id, organization_id) on delete restrict,
  constraint leads_coordinator_same_organization_fk foreign key (assigned_coordinator_id, organization_id) references public.user_profiles(id, organization_id) on delete set null,
  constraint leads_submitted_by_same_organization_fk foreign key (submitted_by_user_id, organization_id) references public.user_profiles(id, organization_id) on delete set null,
  constraint leads_consent_partner_same_organization_fk foreign key (consent_confirmed_by_partner_id, organization_id) references public.partners(id, organization_id) on delete restrict,
  constraint leads_converted_case_same_organization_fk foreign key (converted_case_id, organization_id) references public.cases(id, organization_id) on delete set null,
  constraint leads_contact_method_check check (
    nullif(btrim(coalesce(primary_email, '')), '') is not null or
    nullif(btrim(coalesce(phone_e164, '')), '') is not null or
    nullif(btrim(coalesce(whatsapp_e164, '')), '') is not null
  ),
  constraint leads_status_check check (lead_status in ('open', 'on_hold', 'converted', 'closed')),
  constraint leads_pipeline_stage_check check (pipeline_stage in ('new_lead', 'contact_attempted', 'contacted', 'qualification', 'medical_records_pending', 'clinical_review', 'hospital_matching', 'quotation_received', 'patient_decision', 'converted', 'closed')),
  constraint leads_qualification_status_check check (qualification_status in ('unreviewed', 'qualified', 'not_qualified', 'more_information_required')),
  constraint leads_urgency_check check (urgency in ('routine', 'priority', 'urgent', 'unknown')),
  constraint leads_priority_check check (priority in ('Low', 'Medium', 'High', 'Urgent'))
);

comment on table public.leads is
  'Internal AfraMedico operational Leads. Partner referrals may produce at most one Lead through source_referral_id; partner users receive no direct RLS access.';

create table public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  lead_id uuid not null,
  note_text text not null,
  note_type text not null default 'internal',
  is_internal boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lead_notes_lead_same_organization_fk foreign key (lead_id, organization_id) references public.leads(id, organization_id) on delete cascade,
  constraint lead_notes_created_by_same_organization_fk foreign key (created_by, organization_id) references public.user_profiles(id, organization_id) on delete set null
);

comment on table public.lead_notes is
  'Normalized Lead notes. Internal staff notes are stored here rather than in compatibility JSON on public.leads.';

create table public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  lead_id uuid not null,
  activity_type text not null,
  activity_title text not null,
  activity_description text,
  old_value text,
  new_value text,
  performed_by uuid,
  performed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint lead_activities_lead_same_organization_fk foreign key (lead_id, organization_id) references public.leads(id, organization_id) on delete cascade,
  constraint lead_activities_performed_by_same_organization_fk foreign key (performed_by, organization_id) references public.user_profiles(id, organization_id) on delete set null
);

comment on table public.lead_activities is
  'Chronological Lead activity and simple communication logs. Activities preserve operational history instead of overwriting it.';

create table public.lead_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  lead_id uuid not null,
  source_referral_id uuid,
  uploaded_by_partner_id uuid,
  storage_bucket text,
  storage_path text not null,
  original_filename text not null,
  mime_type text,
  file_size_bytes bigint,
  document_category text,
  document_status text not null default 'received',
  created_at timestamptz not null default now(),
  constraint lead_documents_lead_same_organization_fk foreign key (lead_id, organization_id) references public.leads(id, organization_id) on delete cascade,
  constraint lead_documents_source_referral_same_organization_fk foreign key (source_referral_id, organization_id) references public.partner_patient_referrals(id, organization_id) on delete restrict,
  constraint lead_documents_uploaded_partner_same_organization_fk foreign key (uploaded_by_partner_id, organization_id) references public.partners(id, organization_id) on delete restrict,
  constraint lead_documents_file_size_check check (file_size_bytes is null or file_size_bytes >= 0),
  constraint lead_documents_status_check check (document_status in ('received', 'requested', 'verified', 'rejected', 'archived'))
);

comment on table public.lead_documents is
  'Lead document metadata foundation only. Storage buckets and upload UI are intentionally outside this phase.';

create or replace function public.prepare_lead_insert()
returns trigger
language plpgsql
as $$
begin
  new.lead_code = coalesce(nullif(btrim(new.lead_code), ''), public.generate_lead_code());
  new.patient_reference_code = coalesce(nullif(btrim(new.patient_reference_code), ''), public.generate_patient_reference_code());
  new.primary_email = nullif(btrim(new.primary_email), '');
  new.phone_country_code = nullif(btrim(new.phone_country_code), '');
  new.phone_local_number = nullif(btrim(new.phone_local_number), '');
  new.phone_e164 = nullif(btrim(new.phone_e164), '');
  new.whatsapp_country_code = nullif(btrim(new.whatsapp_country_code), '');
  new.whatsapp_local_number = nullif(btrim(new.whatsapp_local_number), '');
  new.whatsapp_e164 = nullif(btrim(new.whatsapp_e164), '');
  return new;
end;
$$;

comment on function public.prepare_lead_insert() is
  'Normalizes Lead contact fields and assigns database-generated lead_code and patient_reference_code.';

create trigger leads_prepare_insert
before insert on public.leads
for each row execute function public.prepare_lead_insert();

create trigger leads_set_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

create trigger lead_notes_set_updated_at
before update on public.lead_notes
for each row execute function public.set_updated_at();

create index leads_organization_id_idx on public.leads (organization_id);
create index leads_patient_id_idx on public.leads (patient_id);
create index leads_source_referral_id_idx on public.leads (source_referral_id);
create index leads_partner_id_idx on public.leads (partner_id);
create index leads_lead_status_idx on public.leads (organization_id, lead_status);
create index leads_pipeline_stage_idx on public.leads (organization_id, pipeline_stage);
create index leads_priority_idx on public.leads (organization_id, priority);
create index leads_assigned_coordinator_idx on public.leads (assigned_coordinator_id);
create index leads_next_follow_up_idx on public.leads (organization_id, next_follow_up_at);
create index leads_created_at_idx on public.leads (organization_id, created_at desc);
create index leads_email_idx on public.leads (organization_id, primary_email);
create index leads_phone_idx on public.leads (organization_id, phone_e164);
create index leads_whatsapp_idx on public.leads (organization_id, whatsapp_e164);

create index lead_notes_organization_id_idx on public.lead_notes (organization_id);
create index lead_notes_lead_id_idx on public.lead_notes (lead_id, created_at desc);
create index lead_notes_created_by_idx on public.lead_notes (created_by);

create index lead_activities_organization_id_idx on public.lead_activities (organization_id);
create index lead_activities_lead_id_idx on public.lead_activities (lead_id, performed_at desc);
create index lead_activities_type_idx on public.lead_activities (organization_id, activity_type);
create index lead_activities_performed_by_idx on public.lead_activities (performed_by);

create index lead_documents_organization_id_idx on public.lead_documents (organization_id);
create index lead_documents_lead_id_idx on public.lead_documents (lead_id, created_at desc);
create index lead_documents_source_referral_id_idx on public.lead_documents (source_referral_id);
create index lead_documents_uploaded_partner_id_idx on public.lead_documents (uploaded_by_partner_id);
create index lead_documents_status_idx on public.lead_documents (organization_id, document_status);

alter table public.leads enable row level security;
alter table public.lead_notes enable row level security;
alter table public.lead_activities enable row level security;
alter table public.lead_documents enable row level security;

create policy "organization members can view leads"
on public.leads
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert leads"
on public.leads
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can update leads"
on public.leads
for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can view lead notes"
on public.lead_notes
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert lead notes"
on public.lead_notes
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can update lead notes"
on public.lead_notes
for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can view lead activities"
on public.lead_activities
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert lead activities"
on public.lead_activities
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can view lead documents"
on public.lead_documents
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert lead documents"
on public.lead_documents
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can update lead documents"
on public.lead_documents
for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());
