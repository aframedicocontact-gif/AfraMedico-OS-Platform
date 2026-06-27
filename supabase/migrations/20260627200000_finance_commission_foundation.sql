-- ICOS Backend Sprint 6: Finance & Commission Foundation
-- Finance belongs to Case.
--
-- This migration creates the financial operating layer for Cases, invoices,
-- patient payments, hospital payment tracking, partner commissions,
-- settlements, disputes, and audit events.
--
-- Boundary:
-- No Stripe, Wise, bank, tax, accounting, booking, or external payment APIs
-- are created here. This migration stores financial coordination records only.

alter table public.partners
  add constraint partners_id_organization_unique unique (id, organization_id);

alter table public.hospital_quotes
  add constraint hospital_quotes_id_provider_case_organization_unique unique (id, provider_id, case_id, organization_id);

create table public.case_financials (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  case_id uuid not null,
  patient_id uuid not null,
  expected_revenue numeric(14,2) not null default 0,
  confirmed_revenue numeric(14,2) not null default 0,
  pending_revenue numeric(14,2) not null default 0,
  currency text not null default 'USD',
  accepted_quote_id uuid,
  financial_status text not null default 'pending',
  risk_level text not null default 'medium',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint case_financials_case_patient_same_organization_fk foreign key (case_id, patient_id, organization_id) references public.cases(id, patient_id, organization_id) on delete cascade,
  constraint case_financials_quote_same_organization_fk foreign key (accepted_quote_id, organization_id) references public.hospital_quotes(id, organization_id) on delete restrict,
  constraint case_financials_id_organization_unique unique (id, organization_id),
  constraint case_financials_case_unique unique (organization_id, case_id),
  constraint case_financials_status_check check (financial_status in ('pending', 'quote_received', 'invoice_draft', 'deposit_requested', 'deposit_received', 'partially_paid', 'fully_paid', 'settlement_ready', 'closed', 'cancelled', 'refunded')),
  constraint case_financials_risk_level_check check (risk_level in ('critical', 'high', 'medium', 'low'))
);

comment on table public.case_financials is
  'Case-level financial summary. Finance belongs to the Case while preserving the Patient relationship across multiple Cases.';

create table public.patient_invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  invoice_number text not null,
  case_id uuid not null,
  patient_id uuid not null,
  accepted_quote_id uuid,
  invoice_status text not null default 'draft',
  issue_date date,
  due_date date,
  total_amount numeric(14,2) not null default 0,
  paid_amount numeric(14,2) not null default 0,
  balance_amount numeric(14,2) not null default 0,
  currency text not null default 'USD',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint patient_invoices_case_patient_same_organization_fk foreign key (case_id, patient_id, organization_id) references public.cases(id, patient_id, organization_id) on delete cascade,
  constraint patient_invoices_quote_same_organization_fk foreign key (accepted_quote_id, organization_id) references public.hospital_quotes(id, organization_id) on delete restrict,
  constraint patient_invoices_created_by_same_organization_fk foreign key (created_by, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint patient_invoices_id_organization_unique unique (id, organization_id),
  constraint patient_invoices_id_case_patient_organization_unique unique (id, case_id, patient_id, organization_id),
  constraint patient_invoices_number_unique unique (organization_id, invoice_number),
  constraint patient_invoices_status_check check (invoice_status in ('draft', 'proforma_sent', 'deposit_requested', 'deposit_received', 'balance_pending', 'partially_paid', 'fully_paid', 'refund_requested', 'refunded', 'cancelled'))
);

comment on table public.patient_invoices is
  'Patient invoice records linked to a Case and Patient. Invoices may link to the accepted hospital quote when available.';

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  invoice_id uuid not null,
  item_type text not null,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(14,2) not null default 0,
  total_price numeric(14,2) not null default 0,
  is_third_party boolean not null default false,
  third_party_provider text,
  created_at timestamptz not null default now(),
  constraint invoice_items_invoice_same_organization_fk foreign key (invoice_id, organization_id) references public.patient_invoices(id, organization_id) on delete cascade,
  constraint invoice_items_type_check check (item_type in ('treatment', 'hospital_fee', 'doctor_fee', 'medical_review', 'coordination_fee', 'travel_external', 'hotel_external', 'flight_external', 'visa_external', 'other'))
);

comment on table public.invoice_items is
  'Invoice line items. Third-party travel, hotel, and flight costs must be marked external when AfraMedico is not merchant of record.';

create table public.patient_payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  invoice_id uuid not null,
  case_id uuid not null,
  patient_id uuid not null,
  payment_type text not null,
  payment_method text not null,
  amount numeric(14,2) not null,
  currency text not null default 'USD',
  payment_status text not null default 'pending',
  paid_at timestamptz,
  external_reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint patient_payments_invoice_case_patient_same_organization_fk foreign key (invoice_id, case_id, patient_id, organization_id) references public.patient_invoices(id, case_id, patient_id, organization_id) on delete restrict,
  constraint patient_payments_id_organization_unique unique (id, organization_id),
  constraint patient_payments_type_check check (payment_type in ('deposit', 'balance', 'partial_payment', 'refund', 'third_party_external', 'other')),
  constraint patient_payments_method_check check (payment_method in ('bank_transfer', 'cash', 'card', 'stripe_future', 'wise_future', 'external_third_party', 'other')),
  constraint patient_payments_status_check check (payment_status in ('pending', 'received', 'partial', 'failed', 'refunded', 'cancelled', 'external_third_party'))
);

comment on table public.patient_payments is
  'Patient payment records. Payments may be partial and external third-party travel payments must be marked accordingly.';

create table public.hospital_payment_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  case_id uuid not null,
  provider_id uuid not null,
  quote_id uuid,
  amount_due numeric(14,2) not null default 0,
  amount_paid numeric(14,2) not null default 0,
  currency text not null default 'USD',
  payment_status text not null default 'pending',
  due_date date,
  paid_at timestamptz,
  reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hospital_payment_records_case_same_organization_fk foreign key (case_id, organization_id) references public.cases(id, organization_id) on delete cascade,
  constraint hospital_payment_records_provider_same_organization_fk foreign key (provider_id, organization_id) references public.providers(id, organization_id) on delete restrict,
  constraint hospital_payment_records_quote_provider_case_same_organization_fk foreign key (quote_id, provider_id, case_id, organization_id) references public.hospital_quotes(id, provider_id, case_id, organization_id) on delete restrict,
  constraint hospital_payment_records_status_check check (payment_status in ('pending', 'scheduled', 'partial', 'paid', 'overdue', 'disputed', 'cancelled'))
);

comment on table public.hospital_payment_records is
  'Hospital payment tracking records, separated from patient payments and linked to Provider and accepted Quote when available.';

create table public.partner_commissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  case_id uuid not null,
  partner_id uuid not null,
  commission_owner_id uuid,
  hospital_referral_id uuid,
  commission_type text not null default 'standard',
  commission_rate numeric(7,4),
  commission_amount numeric(14,2) not null default 0,
  currency text not null default 'USD',
  commission_status text not null default 'pending',
  calculation_basis text,
  approved_by uuid,
  approved_at timestamptz,
  paid_at timestamptz,
  override_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_commissions_case_same_organization_fk foreign key (case_id, organization_id) references public.cases(id, organization_id) on delete cascade,
  constraint partner_commissions_partner_same_organization_fk foreign key (partner_id, organization_id) references public.partners(id, organization_id) on delete restrict,
  constraint partner_commissions_owner_same_organization_fk foreign key (commission_owner_id, organization_id) references public.partners(id, organization_id) on delete restrict,
  constraint partner_commissions_referral_same_organization_fk foreign key (hospital_referral_id, organization_id) references public.hospital_referrals(id, organization_id) on delete restrict,
  constraint partner_commissions_approved_by_same_organization_fk foreign key (approved_by, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint partner_commissions_id_organization_unique unique (id, organization_id),
  constraint partner_commissions_status_check check (commission_status in ('pending', 'calculated', 'approved', 'paid', 'disputed', 'split', 'no_commission', 'cancelled')),
  constraint partner_commissions_type_check check (commission_type in ('standard', 'split', 'override', 'no_commission', 'manual'))
);

comment on table public.partner_commissions is
  'Partner commission records linked to Cases, Partners, and Referral Protection where possible. Owner changes require reason and audit history.';

create table public.commission_splits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  commission_id uuid not null,
  partner_id uuid not null,
  split_percentage numeric(7,4) not null,
  split_amount numeric(14,2) not null default 0,
  reason text not null,
  approved_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commission_splits_commission_same_organization_fk foreign key (commission_id, organization_id) references public.partner_commissions(id, organization_id) on delete cascade,
  constraint commission_splits_partner_same_organization_fk foreign key (partner_id, organization_id) references public.partners(id, organization_id) on delete restrict,
  constraint commission_splits_approved_by_same_organization_fk foreign key (approved_by, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint commission_splits_percentage_check check (split_percentage >= 0 and split_percentage <= 100)
);

comment on table public.commission_splits is
  'Commission split records. Splits preserve approval reason and partner allocation history.';

create table public.commission_disputes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  commission_id uuid not null,
  case_id uuid not null,
  partner_id uuid not null,
  dispute_status text not null default 'open',
  dispute_reason text not null,
  opened_by uuid,
  resolved_by uuid,
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commission_disputes_commission_same_organization_fk foreign key (commission_id, organization_id) references public.partner_commissions(id, organization_id) on delete cascade,
  constraint commission_disputes_case_same_organization_fk foreign key (case_id, organization_id) references public.cases(id, organization_id) on delete cascade,
  constraint commission_disputes_partner_same_organization_fk foreign key (partner_id, organization_id) references public.partners(id, organization_id) on delete restrict,
  constraint commission_disputes_opened_by_same_organization_fk foreign key (opened_by, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint commission_disputes_resolved_by_same_organization_fk foreign key (resolved_by, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint commission_disputes_status_check check (dispute_status in ('open', 'under_review', 'resolved', 'rejected', 'cancelled'))
);

comment on table public.commission_disputes is
  'Commission dispute records. Refunds, overrides, disputes, and resolutions must remain traceable.';

create table public.partner_settlements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  partner_id uuid not null,
  settlement_period_start date not null,
  settlement_period_end date not null,
  total_commission numeric(14,2) not null default 0,
  paid_amount numeric(14,2) not null default 0,
  pending_amount numeric(14,2) not null default 0,
  disputed_amount numeric(14,2) not null default 0,
  currency text not null default 'USD',
  settlement_status text not null default 'pending',
  paid_at timestamptz,
  reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_settlements_partner_same_organization_fk foreign key (partner_id, organization_id) references public.partners(id, organization_id) on delete restrict,
  constraint partner_settlements_period_unique unique (organization_id, partner_id, settlement_period_start, settlement_period_end),
  constraint partner_settlements_status_check check (settlement_status in ('pending', 'approved', 'paid', 'partially_paid', 'disputed', 'cancelled'))
);

comment on table public.partner_settlements is
  'Partner settlement period records for pending, approved, paid, and disputed commissions.';

create table public.financial_audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  case_id uuid,
  invoice_id uuid,
  payment_id uuid,
  commission_id uuid,
  user_id uuid,
  action text not null,
  old_value text,
  new_value text,
  reason text,
  evidence text,
  created_at timestamptz not null default now(),
  constraint financial_audit_events_case_same_organization_fk foreign key (case_id, organization_id) references public.cases(id, organization_id) on delete restrict,
  constraint financial_audit_events_invoice_same_organization_fk foreign key (invoice_id, organization_id) references public.patient_invoices(id, organization_id) on delete restrict,
  constraint financial_audit_events_payment_same_organization_fk foreign key (payment_id, organization_id) references public.patient_payments(id, organization_id) on delete restrict,
  constraint financial_audit_events_commission_same_organization_fk foreign key (commission_id, organization_id) references public.partner_commissions(id, organization_id) on delete restrict,
  constraint financial_audit_events_user_same_organization_fk foreign key (user_id, organization_id) references public.user_profiles(id, organization_id) on delete restrict
);

comment on table public.financial_audit_events is
  'Append-only financial audit trail for invoices, payments, commission changes, overrides, disputes, refunds, and settlements.';

create trigger case_financials_set_updated_at
before update on public.case_financials
for each row execute function public.set_updated_at();

create trigger patient_invoices_set_updated_at
before update on public.patient_invoices
for each row execute function public.set_updated_at();

create trigger patient_payments_set_updated_at
before update on public.patient_payments
for each row execute function public.set_updated_at();

create trigger hospital_payment_records_set_updated_at
before update on public.hospital_payment_records
for each row execute function public.set_updated_at();

create trigger partner_commissions_set_updated_at
before update on public.partner_commissions
for each row execute function public.set_updated_at();

create trigger commission_splits_set_updated_at
before update on public.commission_splits
for each row execute function public.set_updated_at();

create trigger commission_disputes_set_updated_at
before update on public.commission_disputes
for each row execute function public.set_updated_at();

create trigger partner_settlements_set_updated_at
before update on public.partner_settlements
for each row execute function public.set_updated_at();

create index case_financials_organization_id_idx on public.case_financials (organization_id);
create index case_financials_case_id_idx on public.case_financials (case_id);
create index case_financials_patient_id_idx on public.case_financials (patient_id);
create index case_financials_accepted_quote_id_idx on public.case_financials (accepted_quote_id);
create index case_financials_status_idx on public.case_financials (financial_status);

create index patient_invoices_organization_id_idx on public.patient_invoices (organization_id);
create index patient_invoices_case_id_idx on public.patient_invoices (case_id);
create index patient_invoices_patient_id_idx on public.patient_invoices (patient_id);
create index patient_invoices_quote_id_idx on public.patient_invoices (accepted_quote_id);
create index patient_invoices_status_idx on public.patient_invoices (invoice_status);

create index invoice_items_organization_id_idx on public.invoice_items (organization_id);
create index invoice_items_invoice_id_idx on public.invoice_items (invoice_id);
create index invoice_items_third_party_idx on public.invoice_items (is_third_party);

create index patient_payments_organization_id_idx on public.patient_payments (organization_id);
create index patient_payments_invoice_id_idx on public.patient_payments (invoice_id);
create index patient_payments_case_id_idx on public.patient_payments (case_id);
create index patient_payments_patient_id_idx on public.patient_payments (patient_id);
create index patient_payments_status_idx on public.patient_payments (payment_status);
create index patient_payments_paid_at_idx on public.patient_payments (paid_at);

create index hospital_payment_records_organization_id_idx on public.hospital_payment_records (organization_id);
create index hospital_payment_records_case_id_idx on public.hospital_payment_records (case_id);
create index hospital_payment_records_provider_id_idx on public.hospital_payment_records (provider_id);
create index hospital_payment_records_quote_id_idx on public.hospital_payment_records (quote_id);
create index hospital_payment_records_status_idx on public.hospital_payment_records (payment_status);

create index partner_commissions_organization_id_idx on public.partner_commissions (organization_id);
create index partner_commissions_case_id_idx on public.partner_commissions (case_id);
create index partner_commissions_partner_id_idx on public.partner_commissions (partner_id);
create index partner_commissions_owner_id_idx on public.partner_commissions (commission_owner_id);
create index partner_commissions_referral_id_idx on public.partner_commissions (hospital_referral_id);
create index partner_commissions_status_idx on public.partner_commissions (commission_status);

create index commission_splits_organization_id_idx on public.commission_splits (organization_id);
create index commission_splits_commission_id_idx on public.commission_splits (commission_id);
create index commission_splits_partner_id_idx on public.commission_splits (partner_id);

create index commission_disputes_organization_id_idx on public.commission_disputes (organization_id);
create index commission_disputes_commission_id_idx on public.commission_disputes (commission_id);
create index commission_disputes_case_id_idx on public.commission_disputes (case_id);
create index commission_disputes_partner_id_idx on public.commission_disputes (partner_id);
create index commission_disputes_status_idx on public.commission_disputes (dispute_status);

create index partner_settlements_organization_id_idx on public.partner_settlements (organization_id);
create index partner_settlements_partner_id_idx on public.partner_settlements (partner_id);
create index partner_settlements_status_idx on public.partner_settlements (settlement_status);
create index partner_settlements_period_idx on public.partner_settlements (settlement_period_start, settlement_period_end);

create index financial_audit_events_organization_id_idx on public.financial_audit_events (organization_id);
create index financial_audit_events_case_id_idx on public.financial_audit_events (case_id);
create index financial_audit_events_invoice_id_idx on public.financial_audit_events (invoice_id);
create index financial_audit_events_payment_id_idx on public.financial_audit_events (payment_id);
create index financial_audit_events_commission_id_idx on public.financial_audit_events (commission_id);
create index financial_audit_events_user_id_idx on public.financial_audit_events (user_id);
create index financial_audit_events_created_at_idx on public.financial_audit_events (created_at);

alter table public.case_financials enable row level security;
alter table public.patient_invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.patient_payments enable row level security;
alter table public.hospital_payment_records enable row level security;
alter table public.partner_commissions enable row level security;
alter table public.commission_splits enable row level security;
alter table public.commission_disputes enable row level security;
alter table public.partner_settlements enable row level security;
alter table public.financial_audit_events enable row level security;

create policy "organization members can manage case financials"
on public.case_financials
for all
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can manage patient invoices"
on public.patient_invoices
for all
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can manage invoice items"
on public.invoice_items
for all
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can manage patient payments"
on public.patient_payments
for all
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can manage hospital payment records"
on public.hospital_payment_records
for all
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can manage partner commissions"
on public.partner_commissions
for all
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can manage commission splits"
on public.commission_splits
for all
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can manage commission disputes"
on public.commission_disputes
for all
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can manage partner settlements"
on public.partner_settlements
for all
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can view financial audit events"
on public.financial_audit_events
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert financial audit events"
on public.financial_audit_events
for insert
to authenticated
with check (organization_id = public.current_organization_id());
