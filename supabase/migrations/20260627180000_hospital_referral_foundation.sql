-- ICOS Backend Sprint 4: Hospital Referral Foundation
-- Models the complete referral workflow between Cases and Healthcare Providers.
--
-- Business rules:
-- - One Case may have multiple Referrals.
-- - One Referral may target multiple Providers.
-- - One Provider may issue multiple Quote revisions.
-- - Referral and quote history must be preserved.
-- - Previous versions are never overwritten.
-- - Referral events are timeline-compatible.

alter table public.case_documents
  add constraint case_documents_id_organization_unique unique (id, organization_id);

alter table public.clinical_mso_requests
  add constraint clinical_mso_requests_id_organization_unique unique (id, organization_id);

create table public.hospital_referrals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  case_id uuid not null,
  patient_id uuid not null,
  referral_code text not null,
  referral_type text not null default 'hospital_referral',
  referral_status text not null default 'draft',
  priority text not null default 'medium',
  current_stage text not null default 'created',
  coordinator_id uuid,
  created_by uuid not null,
  referral_reason text,
  requested_at timestamptz,
  sent_at timestamptz,
  expected_response_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hospital_referrals_case_patient_same_organization_fk foreign key (case_id, patient_id, organization_id) references public.cases(id, patient_id, organization_id) on delete cascade,
  constraint hospital_referrals_coordinator_same_organization_fk foreign key (coordinator_id, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint hospital_referrals_created_by_same_organization_fk foreign key (created_by, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint hospital_referrals_id_organization_unique unique (id, organization_id),
  constraint hospital_referrals_code_unique unique (organization_id, referral_code),
  constraint hospital_referrals_type_check check (referral_type in ('early_registration', 'clinical_package', 'quote_request', 'second_opinion', 'treatment_scheduling')),
  constraint hospital_referrals_status_check check (referral_status in ('draft', 'created', 'sent', 'provider_review', 'questions_received', 'quote_requested', 'quote_received', 'patient_decision', 'accepted', 'completed', 'cancelled', 'rejected')),
  constraint hospital_referrals_priority_check check (priority in ('critical', 'high', 'medium', 'low'))
);

comment on table public.hospital_referrals is
  'Case-level hospital referral workflow. A Case may have multiple referrals while preserving referral history and provider responses.';

create table public.referral_providers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  referral_id uuid not null,
  provider_id uuid not null,
  clinical_mso_request_id uuid,
  provider_status text not null default 'pending',
  registration_status text not null default 'not_registered',
  hospital_case_id text,
  hospital_department text,
  provider_contact_name text,
  provider_contact_email text,
  documents_sent_at timestamptz,
  referral_sent_at timestamptz,
  response_due_at timestamptz,
  response_received_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint referral_providers_referral_same_organization_fk foreign key (referral_id, organization_id) references public.hospital_referrals(id, organization_id) on delete cascade,
  constraint referral_providers_provider_same_organization_fk foreign key (provider_id, organization_id) references public.providers(id, organization_id) on delete restrict,
  constraint referral_providers_mso_same_organization_fk foreign key (clinical_mso_request_id, organization_id) references public.clinical_mso_requests(id, organization_id) on delete restrict,
  constraint referral_providers_id_organization_unique unique (id, organization_id),
  constraint referral_providers_id_referral_organization_unique unique (id, referral_id, organization_id),
  constraint referral_providers_id_provider_organization_unique unique (id, provider_id, organization_id),
  constraint referral_providers_unique unique (organization_id, referral_id, provider_id),
  constraint referral_providers_status_check check (provider_status in ('pending', 'sent', 'under_review', 'questions_received', 'mso_received', 'quote_received', 'accepted', 'declined', 'cancelled')),
  constraint referral_providers_registration_status_check check (registration_status in ('not_registered', 'early_registered', 'registration_pending', 'registered', 'duplicate_detected', 'rejected'))
);

comment on table public.referral_providers is
  'Providers targeted by one hospital referral. One referral may target multiple providers for comparison and response tracking.';

create table public.referral_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  referral_id uuid not null,
  referral_provider_id uuid,
  case_document_id uuid,
  document_type text not null,
  filename text,
  storage_path text,
  evidence_type text,
  document_status text not null default 'prepared',
  sent_by uuid,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint referral_documents_referral_same_organization_fk foreign key (referral_id, organization_id) references public.hospital_referrals(id, organization_id) on delete cascade,
  constraint referral_documents_provider_same_referral_fk foreign key (referral_provider_id, referral_id, organization_id) references public.referral_providers(id, referral_id, organization_id) on delete cascade,
  constraint referral_documents_case_document_same_organization_fk foreign key (case_document_id, organization_id) references public.case_documents(id, organization_id) on delete restrict,
  constraint referral_documents_sent_by_same_organization_fk foreign key (sent_by, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint referral_documents_status_check check (document_status in ('prepared', 'sent', 'delivered', 'accepted', 'rejected', 'needs_resend')),
  constraint referral_documents_evidence_type_check check (evidence_type is null or evidence_type in ('email', 'portal_upload', 'whatsapp', 'pdf', 'screenshot', 'internal_note', 'hospital_confirmation'))
);

comment on table public.referral_documents is
  'Referral document and evidence metadata. This links Case Workspace documents to referrals without creating storage buckets.';

create table public.referral_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  referral_id uuid not null,
  referral_provider_id uuid,
  sender_id uuid,
  recipient_name text,
  recipient_email text,
  message_type text not null default 'internal_note',
  direction text not null default 'outbound',
  subject text,
  message text not null,
  external_message_id text,
  sent_at timestamptz,
  delivered_at timestamptz,
  message_status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint referral_messages_referral_same_organization_fk foreign key (referral_id, organization_id) references public.hospital_referrals(id, organization_id) on delete cascade,
  constraint referral_messages_provider_same_referral_fk foreign key (referral_provider_id, referral_id, organization_id) references public.referral_providers(id, referral_id, organization_id) on delete cascade,
  constraint referral_messages_sender_same_organization_fk foreign key (sender_id, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint referral_messages_type_check check (message_type in ('internal_note', 'email', 'portal_message', 'whatsapp_note', 'phone_note', 'hospital_response')),
  constraint referral_messages_direction_check check (direction in ('outbound', 'inbound', 'internal')),
  constraint referral_messages_status_check check (message_status in ('draft', 'sent', 'delivered', 'received', 'failed', 'archived'))
);

comment on table public.referral_messages is
  'Referral communication records and notes. This stores message history only; it does not send external messages.';

create table public.referral_status_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  referral_id uuid not null,
  referral_provider_id uuid,
  case_id uuid not null,
  patient_id uuid not null,
  previous_status text,
  new_status text not null,
  status_reason text,
  event_type text not null default 'referral_status_changed',
  event_title text not null,
  event_description text,
  changed_by uuid,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint referral_status_history_referral_same_organization_fk foreign key (referral_id, organization_id) references public.hospital_referrals(id, organization_id) on delete cascade,
  constraint referral_status_history_provider_same_referral_fk foreign key (referral_provider_id, referral_id, organization_id) references public.referral_providers(id, referral_id, organization_id) on delete cascade,
  constraint referral_status_history_case_patient_same_organization_fk foreign key (case_id, patient_id, organization_id) references public.cases(id, patient_id, organization_id) on delete cascade,
  constraint referral_status_history_changed_by_same_organization_fk foreign key (changed_by, organization_id) references public.user_profiles(id, organization_id) on delete restrict
);

comment on table public.referral_status_history is
  'Append-only referral history. Records are timeline-compatible through event fields, case_id, patient_id, actor, and occurred_at.';

create table public.hospital_quotes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  referral_id uuid not null,
  referral_provider_id uuid not null,
  provider_id uuid not null,
  case_id uuid not null,
  quote_code text not null,
  quote_status text not null default 'draft',
  currency text not null default 'USD',
  total_amount numeric(14,2),
  active_revision_number integer,
  received_at timestamptz,
  valid_until date,
  prepared_by_provider text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hospital_quotes_referral_same_organization_fk foreign key (referral_id, organization_id) references public.hospital_referrals(id, organization_id) on delete cascade,
  constraint hospital_quotes_referral_provider_same_referral_fk foreign key (referral_provider_id, referral_id, organization_id) references public.referral_providers(id, referral_id, organization_id) on delete restrict,
  constraint hospital_quotes_provider_same_referral_provider_fk foreign key (referral_provider_id, provider_id, organization_id) references public.referral_providers(id, provider_id, organization_id) on delete restrict,
  constraint hospital_quotes_case_same_organization_fk foreign key (case_id, organization_id) references public.cases(id, organization_id) on delete cascade,
  constraint hospital_quotes_created_by_same_organization_fk foreign key (created_by, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint hospital_quotes_id_organization_unique unique (id, organization_id),
  constraint hospital_quotes_code_unique unique (organization_id, quote_code),
  constraint hospital_quotes_status_check check (quote_status in ('draft', 'requested', 'received', 'under_review', 'revision_requested', 'approved', 'accepted', 'declined', 'expired', 'cancelled'))
);

comment on table public.hospital_quotes is
  'Hospital quote header for a referral provider. Quote revisions preserve version history instead of overwriting previous quotes.';

create table public.hospital_quote_revisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  hospital_quote_id uuid not null,
  revision_number integer not null,
  revision_status text not null default 'received',
  currency text not null default 'USD',
  total_amount numeric(14,2),
  revision_reason text,
  received_at timestamptz,
  valid_until date,
  created_by uuid,
  created_at timestamptz not null default now(),
  constraint hospital_quote_revisions_quote_same_organization_fk foreign key (hospital_quote_id, organization_id) references public.hospital_quotes(id, organization_id) on delete cascade,
  constraint hospital_quote_revisions_created_by_same_organization_fk foreign key (created_by, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint hospital_quote_revisions_id_organization_unique unique (id, organization_id),
  constraint hospital_quote_revisions_id_quote_organization_unique unique (id, hospital_quote_id, organization_id),
  constraint hospital_quote_revisions_number_unique unique (organization_id, hospital_quote_id, revision_number),
  constraint hospital_quote_revisions_status_check check (revision_status in ('received', 'under_review', 'superseded', 'approved', 'accepted', 'declined', 'expired'))
);

comment on table public.hospital_quote_revisions is
  'Append-only hospital quote revisions. Each provider may issue multiple quote versions without overwriting previous versions.';

create table public.hospital_quote_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  hospital_quote_id uuid not null,
  quote_revision_id uuid not null,
  item_type text not null default 'treatment',
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_amount numeric(14,2),
  total_amount numeric(14,2),
  currency text not null default 'USD',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hospital_quote_items_quote_same_organization_fk foreign key (hospital_quote_id, organization_id) references public.hospital_quotes(id, organization_id) on delete cascade,
  constraint hospital_quote_items_revision_same_quote_fk foreign key (quote_revision_id, hospital_quote_id, organization_id) references public.hospital_quote_revisions(id, hospital_quote_id, organization_id) on delete cascade,
  constraint hospital_quote_items_type_check check (item_type in ('treatment', 'doctor_fee', 'hospital_fee', 'medication', 'imaging', 'lab', 'icu', 'accommodation', 'companion', 'other'))
);

comment on table public.hospital_quote_items is
  'Line items for hospital quote revisions. Items belong to a quote revision to preserve cost history.';

create table public.hospital_quote_attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  hospital_quote_id uuid not null,
  quote_revision_id uuid,
  filename text not null,
  storage_path text,
  attachment_type text not null default 'quote_pdf',
  uploaded_by uuid,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hospital_quote_attachments_quote_same_organization_fk foreign key (hospital_quote_id, organization_id) references public.hospital_quotes(id, organization_id) on delete cascade,
  constraint hospital_quote_attachments_revision_same_quote_fk foreign key (quote_revision_id, hospital_quote_id, organization_id) references public.hospital_quote_revisions(id, hospital_quote_id, organization_id) on delete cascade,
  constraint hospital_quote_attachments_uploaded_by_same_organization_fk foreign key (uploaded_by, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint hospital_quote_attachments_type_check check (attachment_type in ('quote_pdf', 'invoice', 'cost_breakdown', 'hospital_email', 'portal_screenshot', 'internal_note', 'other'))
);

comment on table public.hospital_quote_attachments is
  'Quote attachment metadata. This table stores evidence metadata only and does not create storage buckets.';

create table public.hospital_quote_approvals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  hospital_quote_id uuid not null,
  quote_revision_id uuid not null,
  approval_status text not null default 'pending',
  approved_by uuid,
  decision_reason text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hospital_quote_approvals_quote_same_organization_fk foreign key (hospital_quote_id, organization_id) references public.hospital_quotes(id, organization_id) on delete cascade,
  constraint hospital_quote_approvals_revision_same_quote_fk foreign key (quote_revision_id, hospital_quote_id, organization_id) references public.hospital_quote_revisions(id, hospital_quote_id, organization_id) on delete restrict,
  constraint hospital_quote_approvals_approved_by_same_organization_fk foreign key (approved_by, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint hospital_quote_approvals_status_check check (approval_status in ('pending', 'approved', 'rejected', 'needs_revision', 'patient_accepted', 'patient_declined'))
);

comment on table public.hospital_quote_approvals is
  'Approval decisions for hospital quote revisions. Decisions preserve who approved what, when, and why.';

create trigger hospital_referrals_set_updated_at
before update on public.hospital_referrals
for each row execute function public.set_updated_at();

create trigger referral_providers_set_updated_at
before update on public.referral_providers
for each row execute function public.set_updated_at();

create trigger referral_documents_set_updated_at
before update on public.referral_documents
for each row execute function public.set_updated_at();

create trigger referral_messages_set_updated_at
before update on public.referral_messages
for each row execute function public.set_updated_at();

create trigger hospital_quotes_set_updated_at
before update on public.hospital_quotes
for each row execute function public.set_updated_at();

create trigger hospital_quote_items_set_updated_at
before update on public.hospital_quote_items
for each row execute function public.set_updated_at();

create trigger hospital_quote_attachments_set_updated_at
before update on public.hospital_quote_attachments
for each row execute function public.set_updated_at();

create trigger hospital_quote_approvals_set_updated_at
before update on public.hospital_quote_approvals
for each row execute function public.set_updated_at();

create index hospital_referrals_organization_id_idx on public.hospital_referrals (organization_id);
create index hospital_referrals_case_id_idx on public.hospital_referrals (case_id);
create index hospital_referrals_patient_id_idx on public.hospital_referrals (patient_id);
create index hospital_referrals_status_idx on public.hospital_referrals (referral_status);
create index hospital_referrals_coordinator_id_idx on public.hospital_referrals (coordinator_id);

create index referral_providers_organization_id_idx on public.referral_providers (organization_id);
create index referral_providers_referral_id_idx on public.referral_providers (referral_id);
create index referral_providers_provider_id_idx on public.referral_providers (provider_id);
create index referral_providers_mso_request_id_idx on public.referral_providers (clinical_mso_request_id);
create index referral_providers_status_idx on public.referral_providers (provider_status);

create index referral_documents_organization_id_idx on public.referral_documents (organization_id);
create index referral_documents_referral_id_idx on public.referral_documents (referral_id);
create index referral_documents_referral_provider_id_idx on public.referral_documents (referral_provider_id);
create index referral_documents_case_document_id_idx on public.referral_documents (case_document_id);
create index referral_documents_status_idx on public.referral_documents (document_status);

create index referral_messages_organization_id_idx on public.referral_messages (organization_id);
create index referral_messages_referral_id_idx on public.referral_messages (referral_id);
create index referral_messages_referral_provider_id_idx on public.referral_messages (referral_provider_id);
create index referral_messages_sender_id_idx on public.referral_messages (sender_id);
create index referral_messages_sent_at_idx on public.referral_messages (sent_at);

create index referral_status_history_organization_id_idx on public.referral_status_history (organization_id);
create index referral_status_history_referral_id_idx on public.referral_status_history (referral_id);
create index referral_status_history_referral_provider_id_idx on public.referral_status_history (referral_provider_id);
create index referral_status_history_case_id_idx on public.referral_status_history (case_id);
create index referral_status_history_patient_id_idx on public.referral_status_history (patient_id);
create index referral_status_history_occurred_at_idx on public.referral_status_history (occurred_at);

create index hospital_quotes_organization_id_idx on public.hospital_quotes (organization_id);
create index hospital_quotes_referral_id_idx on public.hospital_quotes (referral_id);
create index hospital_quotes_referral_provider_id_idx on public.hospital_quotes (referral_provider_id);
create index hospital_quotes_provider_id_idx on public.hospital_quotes (provider_id);
create index hospital_quotes_case_id_idx on public.hospital_quotes (case_id);
create index hospital_quotes_status_idx on public.hospital_quotes (quote_status);

create index hospital_quote_revisions_organization_id_idx on public.hospital_quote_revisions (organization_id);
create index hospital_quote_revisions_quote_id_idx on public.hospital_quote_revisions (hospital_quote_id);
create index hospital_quote_revisions_status_idx on public.hospital_quote_revisions (revision_status);

create index hospital_quote_items_organization_id_idx on public.hospital_quote_items (organization_id);
create index hospital_quote_items_quote_id_idx on public.hospital_quote_items (hospital_quote_id);
create index hospital_quote_items_revision_id_idx on public.hospital_quote_items (quote_revision_id);
create index hospital_quote_items_type_idx on public.hospital_quote_items (item_type);

create index hospital_quote_attachments_organization_id_idx on public.hospital_quote_attachments (organization_id);
create index hospital_quote_attachments_quote_id_idx on public.hospital_quote_attachments (hospital_quote_id);
create index hospital_quote_attachments_revision_id_idx on public.hospital_quote_attachments (quote_revision_id);
create index hospital_quote_attachments_uploaded_by_idx on public.hospital_quote_attachments (uploaded_by);

create index hospital_quote_approvals_organization_id_idx on public.hospital_quote_approvals (organization_id);
create index hospital_quote_approvals_quote_id_idx on public.hospital_quote_approvals (hospital_quote_id);
create index hospital_quote_approvals_revision_id_idx on public.hospital_quote_approvals (quote_revision_id);
create index hospital_quote_approvals_approved_by_idx on public.hospital_quote_approvals (approved_by);
create index hospital_quote_approvals_status_idx on public.hospital_quote_approvals (approval_status);

alter table public.hospital_referrals enable row level security;
alter table public.referral_providers enable row level security;
alter table public.referral_documents enable row level security;
alter table public.referral_messages enable row level security;
alter table public.referral_status_history enable row level security;
alter table public.hospital_quotes enable row level security;
alter table public.hospital_quote_items enable row level security;
alter table public.hospital_quote_revisions enable row level security;
alter table public.hospital_quote_attachments enable row level security;
alter table public.hospital_quote_approvals enable row level security;

create policy "organization members can manage hospital referrals"
on public.hospital_referrals
for all
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can manage referral providers"
on public.referral_providers
for all
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can manage referral documents"
on public.referral_documents
for all
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can manage referral messages"
on public.referral_messages
for all
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can view referral status history"
on public.referral_status_history
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert referral status history"
on public.referral_status_history
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can manage hospital quotes"
on public.hospital_quotes
for all
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can manage hospital quote items"
on public.hospital_quote_items
for all
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can view hospital quote revisions"
on public.hospital_quote_revisions
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert hospital quote revisions"
on public.hospital_quote_revisions
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can manage hospital quote attachments"
on public.hospital_quote_attachments
for all
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can manage hospital quote approvals"
on public.hospital_quote_approvals
for all
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());
