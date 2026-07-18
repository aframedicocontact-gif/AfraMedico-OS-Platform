-- Corrected-PDF artifact versioning for executed Partner Agreements.
-- Purely additive: every existing partner_agreements row, its
-- final_pdf_storage_path/final_pdf_sha256/final_pdf_generated_at, every
-- partner_agreement_pdf_audit row, and every signature/agreement-snapshot
-- column from 20260718170000_partner_agreement_bilateral_signatures.sql is
-- left completely untouched. This migration only adds a way to render and
-- track a *corrected* PDF from the same immutable agreement/signature data
-- without ever overwriting or deleting the original artifact.

-- ---------------------------------------------------------------------
-- partner_agreements: track which PDF renderer produced the current
-- final_pdf_* pointer (nullable/additive; backfilled below for existing
-- executed agreements).
-- ---------------------------------------------------------------------

alter table public.partner_agreements
  add column final_pdf_renderer_version text;

-- ---------------------------------------------------------------------
-- partner_agreement_pdf_artifacts: one row per generated PDF file for an
-- agreement. The original (first-generated) artifact is never mutated or
-- removed here -- a correction only ever inserts a new row and flips the
-- prior current row(s) to 'superseded', preserving their storage_path/sha256
-- for audit. Service-role only, same no-select-policy pattern as
-- partner_agreement_pdf_audit.
-- ---------------------------------------------------------------------

create table public.partner_agreement_pdf_artifacts (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null references public.partner_agreements(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  storage_path text not null,
  sha256 text not null,
  renderer_version text not null,
  status text not null default 'current',
  email_status text not null default 'not_sent',
  email_last_attempt_at timestamptz,
  generated_by uuid references public.user_profiles(id) on delete restrict,
  generated_at timestamptz not null default now(),
  superseded_at timestamptz,
  created_at timestamptz not null default now(),
  constraint partner_agreement_pdf_artifacts_status_check check (status in ('current', 'superseded')),
  constraint partner_agreement_pdf_artifacts_email_status_check check (email_status in ('not_sent', 'sent', 'failed'))
);

create index partner_agreement_pdf_artifacts_agreement_idx
  on public.partner_agreement_pdf_artifacts (agreement_id, status);

alter table public.partner_agreement_pdf_artifacts enable row level security;

-- ---------------------------------------------------------------------
-- Backfill: every agreement that already has a generated PDF gets exactly
-- one 'current' artifact row recording that original file's existing path
-- and hash, tagged as the pre-versioning renderer ('v1'). No new PDF is
-- rendered, no storage object is touched -- this only makes the existing
-- artifact visible in the new tracking table.
-- ---------------------------------------------------------------------

insert into public.partner_agreement_pdf_artifacts (
  agreement_id, organization_id, storage_path, sha256, renderer_version, status, email_status, generated_at
)
select
  id,
  organization_id,
  final_pdf_storage_path,
  coalesce(final_pdf_sha256, ''),
  'v1',
  'current',
  final_pdf_email_status,
  coalesce(final_pdf_generated_at, now())
from public.partner_agreements
where final_pdf_storage_path is not null;

update public.partner_agreements
set final_pdf_renderer_version = 'v1'
where final_pdf_storage_path is not null;

-- ---------------------------------------------------------------------
-- partner_agreement_events: allow logging a corrected-PDF generation event.
-- ---------------------------------------------------------------------

alter table public.partner_agreement_events
  drop constraint partner_agreement_events_type_check;
alter table public.partner_agreement_events
  add constraint partner_agreement_events_type_check
  check (event_type in (
    'issued', 'viewed', 'signed', 'voided',
    'countersigned', 'pdf_generated', 'email_sent', 'email_failed',
    'pdf_corrected'
  ));

-- ---------------------------------------------------------------------
-- public.record_corrected_agreement_pdf(...)
-- Atomically supersedes the agreement's current PDF artifact row(s) (their
-- storage_path/sha256/status history is retained, never deleted) and
-- inserts the new one as 'current', then repoints partner_agreements'
-- final_pdf_* columns at it. Never touches signatures, the agreement
-- snapshot, or any prior artifact's storage object. Only callable for an
-- agreement that is already fully_executed -- this never creates a
-- signature or changes execution status.
-- ---------------------------------------------------------------------

create or replace function public.record_corrected_agreement_pdf(
  p_agreement_id uuid,
  p_storage_path text,
  p_sha256 text,
  p_renderer_version text,
  p_generated_by uuid
)
returns public.partner_agreement_pdf_artifacts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_organization_id uuid;
  v_new_artifact public.partner_agreement_pdf_artifacts;
begin
  select organization_id into v_organization_id
  from public.partner_agreements
  where id = p_agreement_id
    and status = 'fully_executed'
  for update;

  if v_organization_id is null then
    raise exception 'Agreement not found or not fully executed';
  end if;

  update public.partner_agreement_pdf_artifacts
  set status = 'superseded', superseded_at = now()
  where agreement_id = p_agreement_id
    and status = 'current';

  insert into public.partner_agreement_pdf_artifacts (
    agreement_id, organization_id, storage_path, sha256, renderer_version, status, generated_by
  ) values (
    p_agreement_id, v_organization_id, p_storage_path, p_sha256, p_renderer_version, 'current', p_generated_by
  )
  returning * into v_new_artifact;

  update public.partner_agreements
  set final_pdf_storage_path = p_storage_path,
      final_pdf_sha256 = p_sha256,
      final_pdf_renderer_version = p_renderer_version,
      final_pdf_generated_at = v_new_artifact.generated_at,
      final_pdf_email_status = 'not_sent',
      final_pdf_email_last_attempt_at = null
  where id = p_agreement_id;

  return v_new_artifact;
end;
$$;

revoke all on function public.record_corrected_agreement_pdf(uuid, text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.record_corrected_agreement_pdf(uuid, text, text, text, uuid) to service_role;
