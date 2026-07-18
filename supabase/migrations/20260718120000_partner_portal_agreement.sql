-- Phase 1C: isolated partner dashboard, electronic agreement, and gated patient referrals.
-- Partner-portal identities still receive no organization_id JWT claim and therefore
-- cannot use the existing organization-scoped Data API policies. All partner access
-- below is mediated by the partner-portal Edge Function with explicit field allowlists.

create table public.partner_agreement_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  version text not null,
  title text not null,
  agreement_text text not null,
  commission_rate numeric(7,4) not null default 40.0000,
  status text not null default 'approved',
  effective_from date not null default current_date,
  approved_by uuid references public.user_profiles(id) on delete restrict,
  approved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint partner_agreement_templates_version_unique unique (organization_id, version),
  constraint partner_agreement_templates_commission_check check (commission_rate = 40.0000),
  constraint partner_agreement_templates_status_check check (status in ('draft', 'approved', 'retired'))
);

create table public.partner_agreements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  partner_id uuid not null references public.partners(id) on delete restrict,
  template_id uuid not null references public.partner_agreement_templates(id) on delete restrict,
  template_version text not null,
  agreement_snapshot text not null,
  commission_rate numeric(7,4) not null default 40.0000,
  status text not null default 'pending_signature',
  issued_at timestamptz not null default now(),
  signed_at timestamptz,
  signer_name text,
  signer_title text,
  signer_email text,
  auth_user_id uuid references auth.users(id) on delete restrict,
  signature_method text,
  signature_text text,
  agreement_sha256 text,
  signature_evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_agreements_partner_template_unique unique (partner_id, template_id),
  constraint partner_agreements_commission_check check (commission_rate = 40.0000),
  constraint partner_agreements_status_check check (status in ('pending_signature', 'signed', 'void')),
  constraint partner_agreements_signature_method_check check (signature_method is null or signature_method = 'typed_name')
);

create table public.partner_agreement_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  agreement_id uuid not null references public.partner_agreements(id) on delete restrict,
  partner_id uuid not null references public.partners(id) on delete restrict,
  auth_user_id uuid references auth.users(id) on delete restrict,
  event_type text not null,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint partner_agreement_events_type_check check (event_type in ('issued', 'viewed', 'signed', 'voided'))
);

create table public.partner_patient_referrals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  partner_id uuid not null references public.partners(id) on delete restrict,
  agreement_id uuid not null references public.partner_agreements(id) on delete restrict,
  referral_code text not null,
  patient_full_name text not null,
  patient_email text,
  patient_phone text not null,
  patient_country text not null,
  requested_treatment text not null,
  medical_summary text not null,
  initial_records_ready boolean not null default false,
  patient_consent_confirmed boolean not null,
  referral_status text not null default 'submitted',
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_patient_referrals_code_unique unique (organization_id, referral_code),
  constraint partner_patient_referrals_status_check check (referral_status in ('submitted', 'under_review', 'documents_requested', 'qualified', 'case_created', 'declined')),
  constraint partner_patient_referrals_consent_check check (patient_consent_confirmed = true)
);

create index partner_agreement_templates_org_status_idx on public.partner_agreement_templates (organization_id, status);
create index partner_agreements_partner_status_idx on public.partner_agreements (partner_id, status);
create index partner_agreements_organization_idx on public.partner_agreements (organization_id);
create index partner_agreement_events_agreement_idx on public.partner_agreement_events (agreement_id, created_at);
create index partner_patient_referrals_partner_idx on public.partner_patient_referrals (partner_id, submitted_at desc);
create index partner_patient_referrals_status_idx on public.partner_patient_referrals (organization_id, referral_status);

create trigger partner_agreements_set_updated_at
before update on public.partner_agreements
for each row execute function public.set_updated_at();

create trigger partner_patient_referrals_set_updated_at
before update on public.partner_patient_referrals
for each row execute function public.set_updated_at();

alter table public.partner_agreement_templates enable row level security;
alter table public.partner_agreements enable row level security;
alter table public.partner_agreement_events enable row level security;
alter table public.partner_patient_referrals enable row level security;

create policy partner_agreement_templates_staff_select on public.partner_agreement_templates
for select to authenticated using (organization_id = public.current_organization_id());
create policy partner_agreements_staff_select on public.partner_agreements
for select to authenticated using (organization_id = public.current_organization_id());
create policy partner_agreement_events_staff_select on public.partner_agreement_events
for select to authenticated using (organization_id = public.current_organization_id());
create policy partner_patient_referrals_staff_select on public.partner_patient_referrals
for select to authenticated using (organization_id = public.current_organization_id());

-- Keep the legally significant signature, audit event, and partner activation in
-- one database transaction. This RPC is callable only by the service-role Edge Function.
create or replace function public.activate_partner_agreement(
  p_agreement_id uuid,
  p_partner_id uuid,
  p_auth_user_id uuid,
  p_signer_name text,
  p_signer_title text,
  p_signer_email text,
  p_agreement_sha256 text,
  p_signature_evidence jsonb
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
  set status = 'signed',
      signed_at = now(),
      signer_name = p_signer_name,
      signer_title = p_signer_title,
      signer_email = p_signer_email,
      auth_user_id = p_auth_user_id,
      signature_method = 'typed_name',
      signature_text = p_signer_name,
      agreement_sha256 = p_agreement_sha256,
      signature_evidence = p_signature_evidence
  where id = p_agreement_id
    and partner_id = p_partner_id
    and status = 'pending_signature'
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
    jsonb_build_object(
      'agreement_sha256', p_agreement_sha256,
      'signature_method', 'typed_name'
    )
  );

  update public.partners
  set status = 'active', lifecycle_stage = 'active_partner'
  where id = p_partner_id
    and organization_id = v_organization_id;

  if not found then
    raise exception 'Partner activation target not found';
  end if;

  return true;
end;
$$;

revoke all on function public.activate_partner_agreement(uuid, uuid, uuid, text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.activate_partner_agreement(uuid, uuid, uuid, text, text, text, text, jsonb) to service_role;

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
  '1.0',
  'AfraMedico Referral Partner Agreement',
  $agreement$
AFRAMEDICO REFERRAL PARTNER AGREEMENT — VERSION 1.0

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
The Partner agrees to use electronic records and signatures. Typing the authorized signer’s name, checking the acceptance confirmations, and selecting “Sign Agreement” constitutes the Partner’s electronic signature. AfraMedico may retain the Agreement version, Partner ID, signer identity, authenticated user ID, timestamp, and technical audit evidence.

17. Entire Agreement
This Agreement and the applicable Commission Statement or written schedule constitute the entire agreement on this relationship and replace prior discussions on the same subject. A material change to the commission rate or Agreement requires a new version presented for electronic acceptance. If one provision is unenforceable, the remaining provisions continue.
$agreement$,
  40.0000,
  'approved',
  current_date
from public.organizations o
where o.slug = 'aframedico'
on conflict (organization_id, version) do nothing;
