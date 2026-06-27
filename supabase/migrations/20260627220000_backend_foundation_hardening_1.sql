-- ICOS Backend Hardening Sprint 1
-- Addresses the highest-priority Backend Architecture Review 1.0 findings
-- before freezing Backend Foundation v1.0.
--
-- This migration is additive and safe to run after Backend Sprint 7.
-- It does not seed data, does not migrate existing rows, and does not create
-- frontend, API, AI, OCR, storage, or external integration behavior.

create or replace function public.prevent_immutable_history_changes()
returns trigger
language plpgsql
as $$
begin
  raise exception 'ICOS immutable history table %.% cannot be updated or deleted', tg_table_schema, tg_table_name;
end;
$$;

comment on function public.prevent_immutable_history_changes() is
  'Prevents updates and deletes on append-only ICOS history/audit tables. History must be corrected by adding new events, not by overwriting old records.';

revoke all on function public.prevent_immutable_history_changes() from public;

create table public.event_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  code text not null,
  name text not null,
  description text,
  domain text not null,
  sensitivity_level text not null default 'internal',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_categories_id_organization_unique unique (id, organization_id),
  constraint event_categories_code_unique unique (organization_id, code),
  constraint event_categories_sensitivity_check check (sensitivity_level in ('public', 'internal', 'confidential', 'clinical', 'financial', 'restricted')),
  constraint event_categories_status_check check (status in ('active', 'inactive', 'archived'))
);

comment on table public.event_categories is
  'Organization-scoped event taxonomy categories. This is the shared foundation for timeline, audit, referral, travel, finance, and access events.';

create table public.event_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  event_category_id uuid not null,
  code text not null,
  name text not null,
  description text,
  source_table text,
  is_audit_event boolean not null default false,
  is_timeline_event boolean not null default true,
  requires_reason boolean not null default false,
  requires_evidence boolean not null default false,
  retention_class text not null default 'standard',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_types_id_organization_unique unique (id, organization_id),
  constraint event_types_category_same_organization_fk foreign key (event_category_id, organization_id) references public.event_categories(id, organization_id) on delete restrict,
  constraint event_types_code_unique unique (organization_id, code),
  constraint event_types_retention_class_check check (retention_class in ('standard', 'clinical', 'financial', 'legal', 'access', 'permanent')),
  constraint event_types_status_check check (status in ('active', 'inactive', 'archived'))
);

comment on table public.event_types is
  'Organization-scoped canonical event type catalog. Existing text event_type/action fields remain for compatibility; event_type_id enables future normalized event handling.';

alter table public.timeline_events
  add column event_type_id uuid,
  add constraint timeline_events_event_type_same_organization_fk foreign key (event_type_id, organization_id) references public.event_types(id, organization_id) on delete restrict;

alter table public.audit_events
  add column event_type_id uuid,
  add constraint audit_events_event_type_same_organization_fk foreign key (event_type_id, organization_id) references public.event_types(id, organization_id) on delete restrict;

alter table public.access_audit_log
  add column event_type_id uuid,
  add constraint access_audit_log_event_type_same_organization_fk foreign key (event_type_id, organization_id) references public.event_types(id, organization_id) on delete restrict;

alter table public.financial_audit_events
  add column event_type_id uuid,
  add constraint financial_audit_events_event_type_same_organization_fk foreign key (event_type_id, organization_id) references public.event_types(id, organization_id) on delete restrict;

alter table public.referral_status_history
  add column event_type_id uuid,
  add constraint referral_status_history_event_type_same_organization_fk foreign key (event_type_id, organization_id) references public.event_types(id, organization_id) on delete restrict;

alter table public.travel_milestones
  add column event_type_id uuid,
  add constraint travel_milestones_event_type_same_organization_fk foreign key (event_type_id, organization_id) references public.event_types(id, organization_id) on delete restrict;

comment on column public.timeline_events.event_type_id is
  'Optional normalized event type reference for future unified ICOS event taxonomy. Existing event_type text is retained for compatibility.';

comment on column public.audit_events.event_type_id is
  'Optional normalized event type reference for future unified ICOS audit taxonomy.';

comment on column public.access_audit_log.event_type_id is
  'Optional normalized event type reference for future unified ICOS access audit taxonomy.';

comment on column public.financial_audit_events.event_type_id is
  'Optional normalized event type reference for future unified ICOS financial audit taxonomy.';

comment on column public.referral_status_history.event_type_id is
  'Optional normalized event type reference for future unified ICOS referral event taxonomy.';

comment on column public.travel_milestones.event_type_id is
  'Optional normalized event type reference for future unified ICOS travel event taxonomy.';

create table public.permission_scopes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  code text not null,
  name text not null,
  description text,
  scope_type text not null,
  module_name text,
  department_id uuid,
  team_id uuid,
  case_id uuid,
  field_name text,
  sensitivity_level text not null default 'internal',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint permission_scopes_id_organization_unique unique (id, organization_id),
  constraint permission_scopes_code_unique unique (organization_id, code),
  constraint permission_scopes_department_same_organization_fk foreign key (department_id, organization_id) references public.departments(id, organization_id) on delete restrict,
  constraint permission_scopes_team_same_organization_fk foreign key (team_id, organization_id) references public.operational_teams(id, organization_id) on delete restrict,
  constraint permission_scopes_case_same_organization_fk foreign key (case_id, organization_id) references public.cases(id, organization_id) on delete restrict,
  constraint permission_scopes_type_check check (scope_type in ('organization', 'module', 'department', 'team', 'case', 'field')),
  constraint permission_scopes_sensitivity_check check (sensitivity_level in ('public', 'internal', 'confidential', 'clinical', 'financial', 'restricted')),
  constraint permission_scopes_status_check check (status in ('active', 'inactive', 'archived'))
);

comment on table public.permission_scopes is
  'Future permission-aware RLS helper table. Defines organization-scoped access scopes without enforcing full permission logic yet.';

create table public.role_scope_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  role_id uuid not null,
  permission_id uuid,
  permission_scope_id uuid not null,
  grant_type text not null default 'allow',
  assigned_by uuid,
  assignment_reason text,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid,
  revoke_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint role_scope_assignments_id_organization_unique unique (id, organization_id),
  constraint role_scope_assignments_role_same_organization_fk foreign key (role_id, organization_id) references public.roles(id, organization_id) on delete restrict,
  constraint role_scope_assignments_permission_same_organization_fk foreign key (permission_id, organization_id) references public.permissions(id, organization_id) on delete restrict,
  constraint role_scope_assignments_scope_same_organization_fk foreign key (permission_scope_id, organization_id) references public.permission_scopes(id, organization_id) on delete restrict,
  constraint role_scope_assignments_assigned_by_same_organization_fk foreign key (assigned_by, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint role_scope_assignments_revoked_by_same_organization_fk foreign key (revoked_by, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint role_scope_assignments_grant_type_check check (grant_type in ('allow', 'deny')),
  constraint role_scope_assignments_expiry_check check (expires_at is null or expires_at >= starts_at),
  constraint role_scope_assignments_revoked_after_start_check check (revoked_at is null or revoked_at >= starts_at)
);

comment on table public.role_scope_assignments is
  'Future permission-aware RLS helper table. Assigns Roles and optional Permissions to organization, module, department, team, case, or field scopes.';

alter table public.hospital_quotes
  add constraint hospital_quotes_id_case_organization_unique unique (id, case_id, organization_id),
  add constraint hospital_quotes_id_referral_case_organization_unique unique (id, referral_id, case_id, organization_id);

alter table public.hospital_referrals
  add constraint hospital_referrals_id_case_organization_unique unique (id, case_id, organization_id);

alter table public.case_financials
  add constraint case_financials_quote_same_case_organization_fk foreign key (accepted_quote_id, case_id, organization_id) references public.hospital_quotes(id, case_id, organization_id) on delete restrict;

alter table public.patient_invoices
  add constraint patient_invoices_quote_same_case_organization_fk foreign key (accepted_quote_id, case_id, organization_id) references public.hospital_quotes(id, case_id, organization_id) on delete restrict;

alter table public.partner_commissions
  add constraint partner_commissions_referral_same_case_organization_fk foreign key (hospital_referral_id, case_id, organization_id) references public.hospital_referrals(id, case_id, organization_id) on delete restrict,
  add constraint partner_commissions_override_reason_required_check check (
    commission_type <> 'override'
    or override_reason is not null
  );

comment on constraint case_financials_quote_same_case_organization_fk on public.case_financials is
  'Hardens finance baseline integrity: accepted quotes must belong to the same Case and Organization as the financial summary.';

comment on constraint patient_invoices_quote_same_case_organization_fk on public.patient_invoices is
  'Hardens invoice integrity: accepted quotes must belong to the same Case and Organization as the patient invoice.';

comment on constraint partner_commissions_referral_same_case_organization_fk on public.partner_commissions is
  'Hardens commission integrity: linked hospital referrals must belong to the same Case and Organization as the commission.';

comment on table public.audit_events is
  'Append-only audit trail for important ICOS actions, ownership changes, overrides, evidence, and decisions. Backend Hardening 1 adds trigger-level immutability.';

comment on table public.financial_audit_events is
  'Append-only financial audit trail for invoices, payments, commission changes, overrides, disputes, refunds, and settlements. Backend Hardening 1 adds trigger-level immutability.';

comment on table public.access_audit_log is
  'Append-only operational access audit trail for role, permission, team, department, session, and authorization-sensitive changes. Backend Hardening 1 adds trigger-level immutability.';

comment on table public.referral_status_history is
  'Append-only referral history. Backend Hardening 1 adds trigger-level immutability and optional normalized event taxonomy.';

comment on table public.hospital_quote_revisions is
  'Append-only hospital quote revisions. Backend Hardening 1 adds trigger-level immutability because quote history must never be overwritten.';

comment on table public.travel_milestones is
  'Append-only travel timeline milestones. Backend Hardening 1 adds trigger-level immutability and optional normalized event taxonomy.';

comment on table public.case_documents is
  'Case document metadata. Future privacy hardening must classify PHI, consent requirements, document sensitivity, storage policy, and retention policy.';

comment on table public.patients is
  'Long-term patient identities. Future privacy hardening must add consent, PHI protection, patient access rights, and retention policy without duplicating patient data across modules.';

drop trigger if exists audit_events_prevent_update_delete on public.audit_events;
create trigger audit_events_prevent_update_delete
before update or delete on public.audit_events
for each row execute function public.prevent_immutable_history_changes();

drop trigger if exists financial_audit_events_prevent_update_delete on public.financial_audit_events;
create trigger financial_audit_events_prevent_update_delete
before update or delete on public.financial_audit_events
for each row execute function public.prevent_immutable_history_changes();

drop trigger if exists access_audit_log_prevent_update_delete on public.access_audit_log;
create trigger access_audit_log_prevent_update_delete
before update or delete on public.access_audit_log
for each row execute function public.prevent_immutable_history_changes();

drop trigger if exists referral_status_history_prevent_update_delete on public.referral_status_history;
create trigger referral_status_history_prevent_update_delete
before update or delete on public.referral_status_history
for each row execute function public.prevent_immutable_history_changes();

drop trigger if exists hospital_quote_revisions_prevent_update_delete on public.hospital_quote_revisions;
create trigger hospital_quote_revisions_prevent_update_delete
before update or delete on public.hospital_quote_revisions
for each row execute function public.prevent_immutable_history_changes();

drop trigger if exists travel_milestones_prevent_update_delete on public.travel_milestones;
create trigger travel_milestones_prevent_update_delete
before update or delete on public.travel_milestones
for each row execute function public.prevent_immutable_history_changes();

create trigger event_categories_set_updated_at
before update on public.event_categories
for each row execute function public.set_updated_at();

create trigger event_types_set_updated_at
before update on public.event_types
for each row execute function public.set_updated_at();

create trigger permission_scopes_set_updated_at
before update on public.permission_scopes
for each row execute function public.set_updated_at();

create trigger role_scope_assignments_set_updated_at
before update on public.role_scope_assignments
for each row execute function public.set_updated_at();

create index event_categories_organization_id_idx on public.event_categories (organization_id);
create index event_categories_domain_idx on public.event_categories (organization_id, domain);
create index event_categories_status_idx on public.event_categories (organization_id, status);

create index event_types_organization_id_idx on public.event_types (organization_id);
create index event_types_category_id_idx on public.event_types (event_category_id);
create index event_types_source_table_idx on public.event_types (organization_id, source_table);
create index event_types_audit_idx on public.event_types (organization_id, is_audit_event);
create index event_types_timeline_idx on public.event_types (organization_id, is_timeline_event);
create index event_types_status_idx on public.event_types (organization_id, status);

create index timeline_events_org_case_created_at_idx on public.timeline_events (organization_id, case_id, created_at desc);
create index timeline_events_org_patient_created_at_idx on public.timeline_events (organization_id, patient_id, created_at desc);
create index timeline_events_event_type_id_idx on public.timeline_events (event_type_id);

create index audit_events_org_case_created_at_idx on public.audit_events (organization_id, case_id, created_at desc);
create index audit_events_org_patient_created_at_idx on public.audit_events (organization_id, patient_id, created_at desc);
create index audit_events_event_type_id_idx on public.audit_events (event_type_id);

create index access_audit_log_org_created_at_idx on public.access_audit_log (organization_id, created_at desc);
create index access_audit_log_event_type_id_idx on public.access_audit_log (event_type_id);

create index financial_audit_events_org_case_created_at_idx on public.financial_audit_events (organization_id, case_id, created_at desc);
create index financial_audit_events_event_type_id_idx on public.financial_audit_events (event_type_id);

create index referral_status_history_org_case_occurred_at_idx on public.referral_status_history (organization_id, case_id, occurred_at desc);
create index referral_status_history_org_referral_occurred_at_idx on public.referral_status_history (organization_id, referral_id, occurred_at desc);
create index referral_status_history_event_type_id_idx on public.referral_status_history (event_type_id);

create index travel_milestones_org_case_created_at_idx on public.travel_milestones (organization_id, case_id, created_at desc);
create index travel_milestones_org_patient_created_at_idx on public.travel_milestones (organization_id, patient_id, created_at desc);
create index travel_milestones_event_type_id_idx on public.travel_milestones (event_type_id);

create index cases_org_status_priority_idx on public.cases (organization_id, status, priority);
create index cases_org_owner_status_idx on public.cases (organization_id, current_owner_id, status);
create index cases_org_current_stage_idx on public.cases (organization_id, current_stage);
create index cases_org_created_at_idx on public.cases (organization_id, created_at desc);

create index work_items_org_owner_status_due_idx on public.work_items (organization_id, owner_id, status, due_date);
create index work_items_org_case_status_idx on public.work_items (organization_id, case_id, status);

create index case_tasks_org_assigned_status_due_idx on public.case_tasks (organization_id, assigned_to, status, due_date);

create index clinical_reviews_org_status_urgency_idx on public.clinical_reviews (organization_id, review_status, urgency);
create index clinical_reviews_org_reviewer_status_idx on public.clinical_reviews (organization_id, assigned_reviewer_id, review_status);

create index hospital_referrals_org_case_status_idx on public.hospital_referrals (organization_id, case_id, referral_status);
create index hospital_referrals_org_patient_status_idx on public.hospital_referrals (organization_id, patient_id, referral_status);

create index referral_providers_org_provider_status_idx on public.referral_providers (organization_id, provider_id, provider_status);

create index hospital_quotes_org_case_status_idx on public.hospital_quotes (organization_id, case_id, quote_status);
create index hospital_quotes_org_provider_status_idx on public.hospital_quotes (organization_id, provider_id, quote_status);
create index hospital_quotes_org_referral_provider_status_idx on public.hospital_quotes (organization_id, referral_provider_id, quote_status);

create index travel_plans_org_case_status_idx on public.travel_plans (organization_id, case_id, travel_status);
create index travel_plans_org_patient_status_idx on public.travel_plans (organization_id, patient_id, travel_status);

create index patient_invoices_org_status_due_idx on public.patient_invoices (organization_id, invoice_status, due_date);
create index patient_invoices_org_case_status_idx on public.patient_invoices (organization_id, case_id, invoice_status);
create index patient_invoices_org_patient_status_idx on public.patient_invoices (organization_id, patient_id, invoice_status);

create index patient_payments_org_case_status_idx on public.patient_payments (organization_id, case_id, payment_status);

create index partner_commissions_org_partner_status_idx on public.partner_commissions (organization_id, partner_id, commission_status);
create index partner_commissions_org_owner_status_idx on public.partner_commissions (organization_id, commission_owner_id, commission_status);
create index partner_commissions_org_case_status_idx on public.partner_commissions (organization_id, case_id, commission_status);

create index permission_scopes_organization_id_idx on public.permission_scopes (organization_id);
create index permission_scopes_type_idx on public.permission_scopes (organization_id, scope_type);
create index permission_scopes_module_idx on public.permission_scopes (organization_id, module_name);
create index permission_scopes_department_id_idx on public.permission_scopes (department_id);
create index permission_scopes_team_id_idx on public.permission_scopes (team_id);
create index permission_scopes_case_id_idx on public.permission_scopes (case_id);
create index permission_scopes_status_idx on public.permission_scopes (organization_id, status);

create index role_scope_assignments_organization_id_idx on public.role_scope_assignments (organization_id);
create index role_scope_assignments_role_id_idx on public.role_scope_assignments (role_id);
create index role_scope_assignments_permission_id_idx on public.role_scope_assignments (permission_id);
create index role_scope_assignments_scope_id_idx on public.role_scope_assignments (permission_scope_id);
create index role_scope_assignments_active_idx on public.role_scope_assignments (organization_id, role_id, permission_scope_id, revoked_at, expires_at);

alter table public.event_categories enable row level security;
alter table public.event_types enable row level security;
alter table public.permission_scopes enable row level security;
alter table public.role_scope_assignments enable row level security;

create policy "organization members can view event categories"
on public.event_categories
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert event categories"
on public.event_categories
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can update event categories"
on public.event_categories
for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can view event types"
on public.event_types
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert event types"
on public.event_types
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can update event types"
on public.event_types
for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can view permission scopes"
on public.permission_scopes
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert permission scopes"
on public.permission_scopes
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can update permission scopes"
on public.permission_scopes
for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can view role scope assignments"
on public.role_scope_assignments
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert role scope assignments"
on public.role_scope_assignments
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can update role scope assignments"
on public.role_scope_assignments
for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());
