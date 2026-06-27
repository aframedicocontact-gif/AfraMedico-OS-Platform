-- ICOS Backend Sprint 2: Case Workspace Foundation
-- Adds Case Workspace backend tables only.
--
-- SaaS rule:
-- Every Case Workspace record belongs to one organization and one case.
-- Same-organization foreign keys prevent cross-tenant links between cases,
-- users, documents, notes, tasks, and internal messages.

create table public.case_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  case_id uuid not null,
  author_id uuid not null,
  note_type text not null default 'general',
  visibility text not null default 'internal',
  title text,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint case_notes_case_same_organization_fk foreign key (case_id, organization_id) references public.cases(id, organization_id) on delete cascade,
  constraint case_notes_author_same_organization_fk foreign key (author_id, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint case_notes_note_type_check check (note_type in ('general', 'coordinator', 'clinical', 'administrative', 'finance', 'partner', 'hospital', 'travel')),
  constraint case_notes_visibility_check check (visibility in ('internal', 'department', 'management', 'clinical', 'finance'))
);

comment on table public.case_notes is
  'Case Workspace notes scoped by organization and case. Notes preserve operational knowledge without leaving the Case context.';

create table public.case_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  case_id uuid not null,
  assigned_to uuid,
  created_by uuid not null,
  task_type text not null default 'general',
  priority text not null default 'medium',
  due_date date,
  status text not null default 'new',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint case_tasks_case_same_organization_fk foreign key (case_id, organization_id) references public.cases(id, organization_id) on delete cascade,
  constraint case_tasks_assigned_to_same_organization_fk foreign key (assigned_to, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint case_tasks_created_by_same_organization_fk foreign key (created_by, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint case_tasks_task_type_check check (task_type in ('general', 'clinical', 'documents', 'hospital', 'finance', 'travel', 'partner', 'follow_up', 'administration')),
  constraint case_tasks_priority_check check (priority in ('critical', 'high', 'medium', 'low')),
  constraint case_tasks_status_check check (status in ('new', 'assigned', 'in_progress', 'waiting', 'blocked', 'completed', 'cancelled', 'escalated'))
);

comment on table public.case_tasks is
  'Case Workspace tasks scoped by organization and case. These tasks support operational ownership without changing the global work_items foundation.';

create table public.case_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  case_id uuid not null,
  document_type text not null,
  filename text not null,
  storage_path text not null,
  uploaded_by uuid not null,
  verification_status text not null default 'pending',
  uploaded_at timestamptz not null default now(),
  constraint case_documents_case_same_organization_fk foreign key (case_id, organization_id) references public.cases(id, organization_id) on delete cascade,
  constraint case_documents_uploaded_by_same_organization_fk foreign key (uploaded_by, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint case_documents_verification_status_check check (verification_status in ('pending', 'verified', 'rejected', 'needs_review', 'expired'))
);

comment on table public.case_documents is
  'Case Workspace document metadata. Files will live in Supabase Storage later; this table stores organization-scoped metadata only.';

create table public.case_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  case_id uuid not null,
  sender_id uuid not null,
  recipient_id uuid,
  message text not null,
  created_at timestamptz not null default now(),
  constraint case_messages_case_same_organization_fk foreign key (case_id, organization_id) references public.cases(id, organization_id) on delete cascade,
  constraint case_messages_sender_same_organization_fk foreign key (sender_id, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint case_messages_recipient_same_organization_fk foreign key (recipient_id, organization_id) references public.user_profiles(id, organization_id) on delete restrict
);

comment on table public.case_messages is
  'Internal Case Workspace messages only. This is not WhatsApp, email, SMS, or external communication integration.';

create trigger case_notes_set_updated_at
before update on public.case_notes
for each row execute function public.set_updated_at();

create trigger case_tasks_set_updated_at
before update on public.case_tasks
for each row execute function public.set_updated_at();

create index case_notes_organization_id_idx on public.case_notes (organization_id);
create index case_notes_case_id_idx on public.case_notes (case_id);
create index case_notes_author_id_idx on public.case_notes (author_id);
create index case_notes_note_type_idx on public.case_notes (note_type);

create index case_tasks_organization_id_idx on public.case_tasks (organization_id);
create index case_tasks_case_id_idx on public.case_tasks (case_id);
create index case_tasks_assigned_to_idx on public.case_tasks (assigned_to);
create index case_tasks_created_by_idx on public.case_tasks (created_by);
create index case_tasks_status_idx on public.case_tasks (status);
create index case_tasks_due_date_idx on public.case_tasks (due_date);

create index case_documents_organization_id_idx on public.case_documents (organization_id);
create index case_documents_case_id_idx on public.case_documents (case_id);
create index case_documents_uploaded_by_idx on public.case_documents (uploaded_by);
create index case_documents_document_type_idx on public.case_documents (document_type);
create index case_documents_verification_status_idx on public.case_documents (verification_status);

create index case_messages_organization_id_idx on public.case_messages (organization_id);
create index case_messages_case_id_idx on public.case_messages (case_id);
create index case_messages_sender_id_idx on public.case_messages (sender_id);
create index case_messages_recipient_id_idx on public.case_messages (recipient_id);
create index case_messages_created_at_idx on public.case_messages (created_at);

alter table public.case_notes enable row level security;
alter table public.case_tasks enable row level security;
alter table public.case_documents enable row level security;
alter table public.case_messages enable row level security;

create policy "organization members can view case notes"
on public.case_notes
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert case notes"
on public.case_notes
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can update case notes"
on public.case_notes
for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can delete case notes"
on public.case_notes
for delete
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can view case tasks"
on public.case_tasks
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert case tasks"
on public.case_tasks
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can update case tasks"
on public.case_tasks
for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can delete case tasks"
on public.case_tasks
for delete
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can view case documents"
on public.case_documents
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert case documents"
on public.case_documents
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can update case documents"
on public.case_documents
for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can delete case documents"
on public.case_documents
for delete
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can view case messages"
on public.case_messages
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert case messages"
on public.case_messages
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can update case messages"
on public.case_messages
for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can delete case messages"
on public.case_messages
for delete
to authenticated
using (organization_id = public.current_organization_id());
