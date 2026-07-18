-- Bilateral electronic signatures for Partner Agreements (v1.1).
-- Purely additive: every v1.0 column, constraint value, row, and RPC from
-- 20260718120000_partner_portal_agreement.sql is left intact. v1.1 is a
-- separate partner_agreement_templates row, which by construction (the
-- existing partner_agreements_partner_template_unique constraint plus lazy
-- per-template row creation in partner-portal's get_dashboard) produces an
-- entirely separate partner_agreements row per partner -- v1.0 rows (and the
-- test referral hanging off one via partner_patient_referrals.agreement_id)
-- are never touched.

-- ---------------------------------------------------------------------
-- partner_agreements: widen check constraints additively, add bilateral
-- signature / execution / final-PDF / email-delivery columns.
-- ---------------------------------------------------------------------

alter table public.partner_agreements
  add column partner_signature_strokes jsonb,
  add column partner_signature_sha256 text,
  add column partner_signed_at timestamptz,
  add column company_signer_name text,
  add column company_signer_title text,
  add column company_signature_strokes jsonb,
  add column company_signature_sha256 text,
  add column company_signed_at timestamptz,
  add column fully_executed_at timestamptz,
  add column countersigned_by uuid references public.user_profiles(id) on delete restrict,
  add column verification_code text,
  add column final_pdf_storage_path text,
  add column final_pdf_sha256 text,
  add column final_pdf_generated_at timestamptz,
  add column final_pdf_email_status text not null default 'not_sent',
  add column final_pdf_email_last_attempt_at timestamptz;

alter table public.partner_agreements
  add constraint partner_agreements_verification_code_unique unique (verification_code);

alter table public.partner_agreements
  add constraint partner_agreements_email_status_check
  check (final_pdf_email_status in ('not_sent', 'sent', 'failed'));

alter table public.partner_agreements
  drop constraint partner_agreements_status_check;
alter table public.partner_agreements
  add constraint partner_agreements_status_check
  check (status in (
    'pending_signature', 'signed', 'void',
    'pending_partner_signature', 'pending_aframedico_signature', 'fully_executed'
  ));

alter table public.partner_agreements
  drop constraint partner_agreements_signature_method_check;
alter table public.partner_agreements
  add constraint partner_agreements_signature_method_check
  check (signature_method is null or signature_method in ('typed_name', 'drawn_signature'));

-- ---------------------------------------------------------------------
-- partner_agreement_events: widen event_type for the new bilateral/PDF/
-- email audit trail.
-- ---------------------------------------------------------------------

alter table public.partner_agreement_events
  drop constraint partner_agreement_events_type_check;
alter table public.partner_agreement_events
  add constraint partner_agreement_events_type_check
  check (event_type in (
    'issued', 'viewed', 'signed', 'voided',
    'countersigned', 'pdf_generated', 'email_sent', 'email_failed'
  ));

-- ---------------------------------------------------------------------
-- partner_agreement_pdf_audit: private technical evidence for the executed
-- PDF, never exposed by the public verify-agreement function. Same
-- no-select-policy pattern as partner_auth_links / partner_onboarding_profiles
-- -- service-role (Edge Functions) only.
-- ---------------------------------------------------------------------

create table public.partner_agreement_pdf_audit (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null references public.partner_agreements(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  partner_signature_event_id uuid references public.partner_agreement_events(id) on delete restrict,
  company_signature_event_id uuid references public.partner_agreement_events(id) on delete restrict,
  partner_auth_method text not null,
  company_auth_method text not null,
  created_at timestamptz not null default now()
);

create index partner_agreement_pdf_audit_agreement_idx
  on public.partner_agreement_pdf_audit (agreement_id);

alter table public.partner_agreement_pdf_audit enable row level security;

-- ---------------------------------------------------------------------
-- Private storage bucket for executed agreement PDFs. Not public; no
-- anon/authenticated policies are created on storage.objects, so only a
-- service-role client (the Edge Functions) can read or write objects here.
-- Every download is a short-lived signed URL minted server-side.
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('partner-agreements', 'partner-agreements', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- public.partner_sign_agreement_v2(...)
-- Partner's drawn-signature counterpart to the v1.0 activate_partner_agreement
-- RPC. Moves the agreement from pending_partner_signature to
-- pending_aframedico_signature only -- never all the way to fully_executed,
-- and never touches partners.status/lifecycle_stage (that only happens on
-- countersignature).
-- ---------------------------------------------------------------------

create or replace function public.partner_sign_agreement_v2(
  p_agreement_id uuid,
  p_partner_id uuid,
  p_auth_user_id uuid,
  p_agreement_sha256 text,
  p_signature_strokes jsonb,
  p_signature_sha256 text,
  p_evidence jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_organization_id uuid;
begin
  update public.partner_agreements
  set status = 'pending_aframedico_signature',
      partner_signature_strokes = p_signature_strokes,
      partner_signature_sha256 = p_signature_sha256,
      partner_signed_at = now(),
      auth_user_id = p_auth_user_id,
      signature_method = 'drawn_signature',
      agreement_sha256 = p_agreement_sha256,
      signature_evidence = p_evidence
  where id = p_agreement_id
    and partner_id = p_partner_id
    and status = 'pending_partner_signature'
  returning organization_id into v_organization_id;

  if v_organization_id is null then
    return false;
  end if;

  insert into public.partner_agreement_events (
    organization_id, agreement_id, partner_id, auth_user_id, event_type, event_data
  ) values (
    v_organization_id,
    p_agreement_id,
    p_partner_id,
    p_auth_user_id,
    'signed',
    jsonb_build_object('agreement_sha256', p_agreement_sha256, 'signature_method', 'drawn_signature')
  );

  return true;
end;
$$;

revoke all on function public.partner_sign_agreement_v2(uuid, uuid, uuid, text, jsonb, text, jsonb) from public, anon, authenticated;
grant execute on function public.partner_sign_agreement_v2(uuid, uuid, uuid, text, jsonb, text, jsonb) to service_role;

-- ---------------------------------------------------------------------
-- public.countersign_partner_agreement(...)
-- Atomically records AfraMedico's own drawn signature, marks the agreement
-- fully_executed, and activates the partner -- mirroring what
-- activate_partner_agreement already does for v1.0, but gated on an
-- organization-administrator countersignature rather than the partner's own
-- signature. Idempotent: replays against an already-fully_executed row are a
-- no-op that returns the existing row unchanged, so a retried countersign
-- click never double-signs or duplicates the audit trail.
-- ---------------------------------------------------------------------

create or replace function public.countersign_partner_agreement(
  p_agreement_id uuid,
  p_countersigned_by uuid,
  p_organization_id uuid,
  p_signer_name text,
  p_signer_title text,
  p_signature_strokes jsonb,
  p_signature_sha256 text,
  p_verification_code text
)
returns public.partner_agreements
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.partner_agreements;
begin
  select * into v_row
  from public.partner_agreements
  where id = p_agreement_id
    and organization_id = p_organization_id
  for update;

  if v_row.id is null then
    raise exception 'Agreement not found';
  end if;

  if v_row.status = 'fully_executed' then
    return v_row;
  end if;

  if v_row.status <> 'pending_aframedico_signature' then
    raise exception 'Agreement is not awaiting AfraMedico countersignature';
  end if;

  update public.partner_agreements
  set status = 'fully_executed',
      company_signer_name = p_signer_name,
      company_signer_title = p_signer_title,
      company_signature_strokes = p_signature_strokes,
      company_signature_sha256 = p_signature_sha256,
      company_signed_at = now(),
      fully_executed_at = now(),
      verification_code = p_verification_code,
      countersigned_by = p_countersigned_by
  where id = p_agreement_id
  returning * into v_row;

  insert into public.partner_agreement_events (
    organization_id, agreement_id, partner_id, auth_user_id, event_type, event_data
  ) values (
    p_organization_id,
    p_agreement_id,
    v_row.partner_id,
    p_countersigned_by,
    'countersigned',
    jsonb_build_object('verification_code', p_verification_code, 'signature_method', 'drawn_signature')
  );

  update public.partners
  set status = 'active', lifecycle_stage = 'active_partner'
  where id = v_row.partner_id
    and organization_id = p_organization_id;

  return v_row;
end;
$$;

revoke all on function public.countersign_partner_agreement(uuid, uuid, uuid, text, text, jsonb, text, text) from public, anon, authenticated;
grant execute on function public.countersign_partner_agreement(uuid, uuid, uuid, text, text, jsonb, text, text) to service_role;

-- ---------------------------------------------------------------------
-- public.claim_agreement_pdf_generation(...)
-- Optimistic-lock idempotency guard: only the caller that flips
-- final_pdf_generated_at from null actually renders and uploads a PDF.
-- Concurrent or retried countersign/resend calls see a non-null
-- final_pdf_storage_path already and simply re-serve it.
-- ---------------------------------------------------------------------

create or replace function public.claim_agreement_pdf_generation(p_agreement_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  update public.partner_agreements
  set final_pdf_generated_at = now()
  where id = p_agreement_id
    and status = 'fully_executed'
    and final_pdf_storage_path is null
  returning id into v_id;

  return v_id is not null;
end;
$$;

revoke all on function public.claim_agreement_pdf_generation(uuid) from public, anon, authenticated;
grant execute on function public.claim_agreement_pdf_generation(uuid) to service_role;

-- ---------------------------------------------------------------------
-- Seed Agreement template v1.1: identical terms to v1.0 except Section 16,
-- which is replaced per the bilateral electronic-signature requirement.
-- ---------------------------------------------------------------------

insert into public.partner_agreement_templates (
  organization_id,
  version,
  title,
  agreement_text,
  commission_rate,
  status,
  effective_from
)
select
  o.id,
  '1.1',
  'AfraMedico Referral Partner Agreement',
  $agreement$
AFRAMEDICO REFERRAL PARTNER AGREEMENT — VERSION 1.1

1. Parties and Purpose
This Agreement is between Afra Virtual Medical Tourism Inc., operating as AfraMedico (“AfraMedico”), and the Partner identified in the Partner Portal. The purpose is to establish a non-exclusive relationship through which the Partner may introduce patients who are interested in international healthcare services coordinated by AfraMedico.

2. Independent Relationship
The Partner acts as an independent contractor and not as an employee, agent, joint venturer, or legal representative of AfraMedico. The Partner has no authority to bind AfraMedico, a patient, or a healthcare provider. There is no minimum referral quota and either party may work with others.

3. Partner Responsibilities
The Partner will register each patient through the secure Partner Portal, confirm the patient’s consent to share information, provide available initial medical records through approved secure channels, and reasonably follow operational steps through evaluation, travel, and treatment coordination. The Partner will provide accurate information, respect patient choice, protect confidential information, and comply with applicable laws and professional rules. The Partner will not give medical advice, guarantee treatment or outcomes, select treatment on behalf of a patient, collect treatment or hospital fees, or make misleading statements.

4. AfraMedico Responsibilities
AfraMedico will review submitted referrals, coordinate with appropriate healthcare providers, support quotations and case logistics, keep the Partner reasonably informed through the Portal, maintain commission records, and protect personal information in accordance with applicable privacy requirements. Clinical decisions remain solely with qualified healthcare professionals and the patient.

5. Patient Attribution
A patient is attributed to the Partner when the Partner first submits a complete and verifiable referral through the Portal with the patient’s consent. A later submission of the same patient by the original Partner is not a duplicate. If competing partners claim the same patient, the earliest complete and verifiable referral generally controls, subject to documented correction, fraud, patient choice, or other compelling evidence.

6. Continuing Attribution
The Partner remains eligible for commission on later eligible treatments, staged procedures, repeat visits, and follow-up services for an attributed patient when those services are coordinated through AfraMedico and AfraMedico receives related Net Referral Revenue. This continuing right survives ordinary termination of this Agreement, but not fraud, falsified records, unlawful conduct, serious privacy breach, material misrepresentation, or a documented patient request for reassignment.

7. Commission
The Partner earns forty percent (40%) of Net Referral Revenue actually received and cleared by AfraMedico from the applicable healthcare provider or other authorized source for an eligible attributed patient. “Net Referral Revenue” means AfraMedico’s referral, coordination, marketing, or service revenue actually collected, excluding sales taxes, refunds, chargebacks, cancelled or uncollected amounts, directly attributable payment-processing charges, and amounts legally required to be returned. The commission is not forty percent of the patient’s total treatment cost.

8. Statement, Invoice, and Payment
After eligible revenue clears, AfraMedico will issue a Partner Commission Statement through the Portal. The Partner will issue a matching valid invoice to AfraMedico. AfraMedico will pay the undisputed amount within fifteen (15) business days after receiving and verifying the invoice. A disputed calculation must be raised before invoicing; any undisputed portion may be invoiced and paid separately.

9. Taxes
Commission amounts are exclusive of legally applicable GST, HST, VAT, sales taxes, and similar charges. Each party is responsible for its own income taxes, registrations, filings, and obligations. A properly registered Partner may add a legally required sales tax to a valid invoice and must provide its tax registration number. AfraMedico may withhold amounts required by law and will provide reasonable evidence of remittance. The parties acknowledge that detailed tax handling may vary by jurisdiction and will be implemented according to applicable law and professional accounting advice.

10. Privacy and Confidentiality
Each party will use patient and business information only for authorized coordination, protect it with reasonable safeguards, and promptly report suspected unauthorized access. The Partner will not retain, forward, or disclose medical information except through AfraMedico-approved secure channels and for the authorized purpose.

11. Ethical Marketing and Professional Rules
The Partner will use only accurate, approved information and will not use coercion, spam, false testimonials, improper inducements, or promises of preferential clinical treatment. A regulated health professional is responsible for confirming that referral or coordination compensation is permitted under the laws and professional rules applicable to that Partner. If prohibited, AfraMedico may use a lawful alternative structure or decline payment.

12. Brand Use
The Partner may use AfraMedico’s name and approved materials only for this relationship and must stop using them when authorization ends. No ownership of AfraMedico intellectual property is transferred.

13. Term and Termination
This Agreement begins when electronically signed and continues until terminated. Either party may terminate on thirty (30) days’ written notice. AfraMedico may suspend or terminate immediately for fraud, unlawful conduct, serious privacy or security breach, material misrepresentation, harm to patients, or unauthorized use of the AfraMedico brand. Accrued lawful payment rights and continuing attribution under section 6 survive as stated there.

14. Liability
Each party is responsible for its own acts and omissions. AfraMedico does not provide medical treatment and does not guarantee provider decisions, clinical outcomes, visas, travel approvals, or patient payment. Nothing in this Agreement excludes liability that cannot legally be excluded.

15. Governing Law and Notices
This Agreement is governed by the laws of Ontario and the federal laws of Canada applicable there. The parties submit to the courts of Ontario. Formal notices may be delivered through the Partner Portal or to partners@aframedico.com and the Partner’s registered email address.

16. Electronic Agreement
The signer’s verified legal name is displayed automatically. Drawing the signature, accepting the confirmations, and selecting “Sign Agreement” constitutes the electronic signature. The Agreement becomes effective only after countersignature by an authorized AfraMedico representative. AfraMedico may retain the Agreement version, Partner ID, signer identity, authenticated user ID, drawn-signature evidence, timestamps, and technical audit evidence for both parties’ signatures.

17. Entire Agreement
This Agreement and the applicable Commission Statement or written schedule constitute the entire agreement on this relationship and replace prior discussions on the same subject. A material change to the commission rate or Agreement requires a new version presented for electronic acceptance. If one provision is unenforceable, the remaining provisions continue.
$agreement$,
  40.0000,
  'approved',
  current_date
from public.organizations o
where o.slug = 'aframedico'
on conflict (organization_id, version) do nothing;
