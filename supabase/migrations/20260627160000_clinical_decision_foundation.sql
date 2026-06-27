-- ICOS Backend Sprint 3: Clinical Decision Center Foundation
-- Adds clinical workflow database tables only.
--
-- Boundary:
-- This migration stores clinical workflow records and future AI output.
-- It does not call AI services, create storage buckets, generate documents,
-- or integrate external clinical systems.

alter table public.cases
  add constraint cases_id_patient_organization_unique unique (id, patient_id, organization_id);

create table public.clinical_reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  case_id uuid not null,
  patient_id uuid not null,
  review_code text not null,
  review_status text not null default 'pending',
  urgency text not null default 'routine',
  assigned_reviewer_id uuid,
  clinical_lead_id uuid,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_reviews_case_patient_same_organization_fk foreign key (case_id, patient_id, organization_id) references public.cases(id, patient_id, organization_id) on delete cascade,
  constraint clinical_reviews_reviewer_same_organization_fk foreign key (assigned_reviewer_id, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint clinical_reviews_lead_same_organization_fk foreign key (clinical_lead_id, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint clinical_reviews_created_by_same_organization_fk foreign key (created_by, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint clinical_reviews_id_organization_unique unique (id, organization_id),
  constraint clinical_reviews_review_code_unique unique (organization_id, review_code),
  constraint clinical_reviews_status_check check (review_status in ('pending', 'waiting_documents', 'under_review', 'ai_draft_ready', 'internal_validation', 'clinical_lead_approval', 'hospital_package_ready', 'mso_requested', 'mso_received', 'recommendation_ready', 'patient_opinion_sent', 'ready_for_quotation', 'completed', 'cancelled')),
  constraint clinical_reviews_urgency_check check (urgency in ('emergency', 'urgent', 'routine', 'low'))
);

comment on table public.clinical_reviews is
  'Clinical Decision Center review records. A clinical review belongs to an organization, patient, and Case.';

create table public.clinical_required_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  clinical_review_id uuid not null,
  case_id uuid not null,
  document_type text not null,
  requirement_level text not null default 'required',
  status text not null default 'missing',
  requested_from text,
  requested_at timestamptz,
  received_at timestamptz,
  verified_by uuid,
  verified_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_required_documents_review_same_organization_fk foreign key (clinical_review_id, organization_id) references public.clinical_reviews(id, organization_id) on delete cascade,
  constraint clinical_required_documents_case_same_organization_fk foreign key (case_id, organization_id) references public.cases(id, organization_id) on delete cascade,
  constraint clinical_required_documents_verified_by_same_organization_fk foreign key (verified_by, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint clinical_required_documents_requirement_level_check check (requirement_level in ('required', 'recommended', 'optional', 'conditional')),
  constraint clinical_required_documents_status_check check (status in ('missing', 'requested', 'received', 'verified', 'rejected', 'not_required'))
);

comment on table public.clinical_required_documents is
  'Document completeness checklist for each clinical review. This tracks requirements and verification, not file storage.';

create table public.clinical_ai_drafts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  clinical_review_id uuid not null,
  case_id uuid not null,
  draft_version integer not null default 1,
  clinical_summary text,
  diagnosis text,
  key_findings text,
  red_flags text[],
  urgency_assessment text,
  suggested_specialties text[],
  suggested_destinations text[],
  suggested_providers text[],
  hospital_questions text[],
  confidence_level numeric(5,2),
  validation_status text not null default 'human_validation_required',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_ai_drafts_review_same_organization_fk foreign key (clinical_review_id, organization_id) references public.clinical_reviews(id, organization_id) on delete cascade,
  constraint clinical_ai_drafts_case_same_organization_fk foreign key (case_id, organization_id) references public.cases(id, organization_id) on delete cascade,
  constraint clinical_ai_drafts_reviewed_by_same_organization_fk foreign key (reviewed_by, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint clinical_ai_drafts_version_unique unique (organization_id, clinical_review_id, draft_version),
  constraint clinical_ai_drafts_confidence_level_check check (confidence_level is null or (confidence_level >= 0 and confidence_level <= 100)),
  constraint clinical_ai_drafts_validation_status_check check (validation_status in ('draft', 'human_validation_required', 'approved', 'needs_correction', 'rejected'))
);

comment on table public.clinical_ai_drafts is
  'Stores future AI-generated clinical draft output for human review. This table does not generate AI output or call AI services.';

create table public.clinical_validations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  clinical_review_id uuid not null,
  case_id uuid not null,
  validator_id uuid not null,
  validation_decision text not null,
  correction_required boolean not null default false,
  escalation_required boolean not null default false,
  ethics_review_required boolean not null default false,
  governance_notes text,
  validated_at timestamptz,
  created_at timestamptz not null default now(),
  constraint clinical_validations_review_same_organization_fk foreign key (clinical_review_id, organization_id) references public.clinical_reviews(id, organization_id) on delete cascade,
  constraint clinical_validations_case_same_organization_fk foreign key (case_id, organization_id) references public.cases(id, organization_id) on delete cascade,
  constraint clinical_validations_validator_same_organization_fk foreign key (validator_id, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint clinical_validations_decision_check check (validation_decision in ('approved', 'needs_correction', 'escalated', 'second_reviewer_required', 'emergency', 'ethics_review', 'clinical_governance'))
);

comment on table public.clinical_validations is
  'Human internal validation decisions for clinical reviews. Clinical, ethical, and governance decisions remain human-controlled.';

create table public.clinical_hospital_packages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  clinical_review_id uuid not null,
  case_id uuid not null,
  package_status text not null default 'draft',
  readiness_score numeric(5,2) not null default 0,
  referral_letter_ready boolean not null default false,
  medical_summary_ready boolean not null default false,
  imaging_ready boolean not null default false,
  pathology_ready boolean not null default false,
  labs_ready boolean not null default false,
  timeline_ready boolean not null default false,
  hospital_questions_ready boolean not null default false,
  prepared_by uuid,
  prepared_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_hospital_packages_review_same_organization_fk foreign key (clinical_review_id, organization_id) references public.clinical_reviews(id, organization_id) on delete cascade,
  constraint clinical_hospital_packages_case_same_organization_fk foreign key (case_id, organization_id) references public.cases(id, organization_id) on delete cascade,
  constraint clinical_hospital_packages_prepared_by_same_organization_fk foreign key (prepared_by, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint clinical_hospital_packages_readiness_score_check check (readiness_score >= 0 and readiness_score <= 100),
  constraint clinical_hospital_packages_status_check check (package_status in ('draft', 'in_progress', 'ready_for_hospital', 'sent_to_hospital', 'returned_for_correction', 'completed'))
);

comment on table public.clinical_hospital_packages is
  'Hospital-ready package readiness tracker for a clinical review and Case.';

create table public.clinical_mso_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  clinical_review_id uuid not null,
  case_id uuid not null,
  provider_id uuid not null,
  request_status text not null default 'requested',
  requested_at timestamptz,
  response_due_at timestamptz,
  response_received_at timestamptz,
  hospital_questions_received boolean not null default false,
  clarification_requested boolean not null default false,
  mso_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_mso_requests_review_same_organization_fk foreign key (clinical_review_id, organization_id) references public.clinical_reviews(id, organization_id) on delete cascade,
  constraint clinical_mso_requests_case_same_organization_fk foreign key (case_id, organization_id) references public.cases(id, organization_id) on delete cascade,
  constraint clinical_mso_requests_provider_same_organization_fk foreign key (provider_id, organization_id) references public.providers(id, organization_id) on delete restrict,
  constraint clinical_mso_requests_status_check check (request_status in ('requested', 'under_review', 'questions_received', 'clarification_requested', 'mso_received', 'invoice_received', 'completed', 'cancelled'))
);

comment on table public.clinical_mso_requests is
  'Medical Second Opinion request tracking for providers. This tracks workflow state and response metadata only.';

create table public.clinical_recommendations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  clinical_review_id uuid not null,
  case_id uuid not null,
  recommendation_type text not null,
  recommendation_summary text not null,
  benefits text,
  risks text,
  reviewer_id uuid not null,
  recommendation_date date not null default current_date,
  patient_visible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_recommendations_review_same_organization_fk foreign key (clinical_review_id, organization_id) references public.clinical_reviews(id, organization_id) on delete cascade,
  constraint clinical_recommendations_case_same_organization_fk foreign key (case_id, organization_id) references public.cases(id, organization_id) on delete cascade,
  constraint clinical_recommendations_reviewer_same_organization_fk foreign key (reviewer_id, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint clinical_recommendations_type_check check (recommendation_type in ('Travel Recommended', 'Travel Recommended with Urgency', 'Travel After Local Stabilization', 'Seek Local Treatment First', 'Not Recommended for Travel', 'Palliative Care Appropriate', 'Observation Recommended'))
);

comment on table public.clinical_recommendations is
  'Human clinical recommendation outcomes for a Case. Recommendations may be patient-visible only after human approval.';

create table public.clinical_patient_opinions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  clinical_review_id uuid not null,
  case_id uuid not null,
  opinion_status text not null default 'draft',
  patient_friendly_summary text not null,
  disclaimer text not null default 'This is not the final hospital opinion. It is a preliminary AfraMedico clinical coordination opinion. The final recommendation will be provided after review by the selected hospital.',
  sent_to_patient_at timestamptz,
  sent_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_patient_opinions_review_same_organization_fk foreign key (clinical_review_id, organization_id) references public.clinical_reviews(id, organization_id) on delete cascade,
  constraint clinical_patient_opinions_case_same_organization_fk foreign key (case_id, organization_id) references public.cases(id, organization_id) on delete cascade,
  constraint clinical_patient_opinions_sent_by_same_organization_fk foreign key (sent_by, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint clinical_patient_opinions_status_check check (opinion_status in ('draft', 'review_ready', 'approved', 'sent', 'revised', 'cancelled'))
);

comment on table public.clinical_patient_opinions is
  'Patient-friendly preliminary AfraMedico clinical coordination opinions. These are not final hospital opinions.';

create trigger clinical_reviews_set_updated_at
before update on public.clinical_reviews
for each row execute function public.set_updated_at();

create trigger clinical_required_documents_set_updated_at
before update on public.clinical_required_documents
for each row execute function public.set_updated_at();

create trigger clinical_ai_drafts_set_updated_at
before update on public.clinical_ai_drafts
for each row execute function public.set_updated_at();

create trigger clinical_hospital_packages_set_updated_at
before update on public.clinical_hospital_packages
for each row execute function public.set_updated_at();

create trigger clinical_mso_requests_set_updated_at
before update on public.clinical_mso_requests
for each row execute function public.set_updated_at();

create trigger clinical_recommendations_set_updated_at
before update on public.clinical_recommendations
for each row execute function public.set_updated_at();

create trigger clinical_patient_opinions_set_updated_at
before update on public.clinical_patient_opinions
for each row execute function public.set_updated_at();

create index clinical_reviews_organization_id_idx on public.clinical_reviews (organization_id);
create index clinical_reviews_case_id_idx on public.clinical_reviews (case_id);
create index clinical_reviews_patient_id_idx on public.clinical_reviews (patient_id);
create index clinical_reviews_assigned_reviewer_id_idx on public.clinical_reviews (assigned_reviewer_id);
create index clinical_reviews_clinical_lead_id_idx on public.clinical_reviews (clinical_lead_id);
create index clinical_reviews_created_by_idx on public.clinical_reviews (created_by);
create index clinical_reviews_review_status_idx on public.clinical_reviews (review_status);

create index clinical_required_documents_organization_id_idx on public.clinical_required_documents (organization_id);
create index clinical_required_documents_clinical_review_id_idx on public.clinical_required_documents (clinical_review_id);
create index clinical_required_documents_case_id_idx on public.clinical_required_documents (case_id);
create index clinical_required_documents_verified_by_idx on public.clinical_required_documents (verified_by);
create index clinical_required_documents_status_idx on public.clinical_required_documents (status);

create index clinical_ai_drafts_organization_id_idx on public.clinical_ai_drafts (organization_id);
create index clinical_ai_drafts_clinical_review_id_idx on public.clinical_ai_drafts (clinical_review_id);
create index clinical_ai_drafts_case_id_idx on public.clinical_ai_drafts (case_id);
create index clinical_ai_drafts_reviewed_by_idx on public.clinical_ai_drafts (reviewed_by);
create index clinical_ai_drafts_validation_status_idx on public.clinical_ai_drafts (validation_status);

create index clinical_validations_organization_id_idx on public.clinical_validations (organization_id);
create index clinical_validations_clinical_review_id_idx on public.clinical_validations (clinical_review_id);
create index clinical_validations_case_id_idx on public.clinical_validations (case_id);
create index clinical_validations_validator_id_idx on public.clinical_validations (validator_id);

create index clinical_hospital_packages_organization_id_idx on public.clinical_hospital_packages (organization_id);
create index clinical_hospital_packages_clinical_review_id_idx on public.clinical_hospital_packages (clinical_review_id);
create index clinical_hospital_packages_case_id_idx on public.clinical_hospital_packages (case_id);
create index clinical_hospital_packages_prepared_by_idx on public.clinical_hospital_packages (prepared_by);
create index clinical_hospital_packages_package_status_idx on public.clinical_hospital_packages (package_status);

create index clinical_mso_requests_organization_id_idx on public.clinical_mso_requests (organization_id);
create index clinical_mso_requests_clinical_review_id_idx on public.clinical_mso_requests (clinical_review_id);
create index clinical_mso_requests_case_id_idx on public.clinical_mso_requests (case_id);
create index clinical_mso_requests_provider_id_idx on public.clinical_mso_requests (provider_id);
create index clinical_mso_requests_request_status_idx on public.clinical_mso_requests (request_status);

create index clinical_recommendations_organization_id_idx on public.clinical_recommendations (organization_id);
create index clinical_recommendations_clinical_review_id_idx on public.clinical_recommendations (clinical_review_id);
create index clinical_recommendations_case_id_idx on public.clinical_recommendations (case_id);
create index clinical_recommendations_reviewer_id_idx on public.clinical_recommendations (reviewer_id);
create index clinical_recommendations_type_idx on public.clinical_recommendations (recommendation_type);

create index clinical_patient_opinions_organization_id_idx on public.clinical_patient_opinions (organization_id);
create index clinical_patient_opinions_clinical_review_id_idx on public.clinical_patient_opinions (clinical_review_id);
create index clinical_patient_opinions_case_id_idx on public.clinical_patient_opinions (case_id);
create index clinical_patient_opinions_sent_by_idx on public.clinical_patient_opinions (sent_by);
create index clinical_patient_opinions_status_idx on public.clinical_patient_opinions (opinion_status);

alter table public.clinical_reviews enable row level security;
alter table public.clinical_required_documents enable row level security;
alter table public.clinical_ai_drafts enable row level security;
alter table public.clinical_validations enable row level security;
alter table public.clinical_hospital_packages enable row level security;
alter table public.clinical_mso_requests enable row level security;
alter table public.clinical_recommendations enable row level security;
alter table public.clinical_patient_opinions enable row level security;

create policy "organization members can view clinical reviews"
on public.clinical_reviews
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert clinical reviews"
on public.clinical_reviews
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can update clinical reviews"
on public.clinical_reviews
for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can delete clinical reviews"
on public.clinical_reviews
for delete
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can view clinical required documents"
on public.clinical_required_documents
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert clinical required documents"
on public.clinical_required_documents
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can update clinical required documents"
on public.clinical_required_documents
for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can delete clinical required documents"
on public.clinical_required_documents
for delete
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can view clinical ai drafts"
on public.clinical_ai_drafts
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert clinical ai drafts"
on public.clinical_ai_drafts
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can update clinical ai drafts"
on public.clinical_ai_drafts
for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can delete clinical ai drafts"
on public.clinical_ai_drafts
for delete
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can view clinical validations"
on public.clinical_validations
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert clinical validations"
on public.clinical_validations
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can update clinical validations"
on public.clinical_validations
for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can delete clinical validations"
on public.clinical_validations
for delete
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can view clinical hospital packages"
on public.clinical_hospital_packages
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert clinical hospital packages"
on public.clinical_hospital_packages
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can update clinical hospital packages"
on public.clinical_hospital_packages
for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can delete clinical hospital packages"
on public.clinical_hospital_packages
for delete
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can view clinical mso requests"
on public.clinical_mso_requests
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert clinical mso requests"
on public.clinical_mso_requests
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can update clinical mso requests"
on public.clinical_mso_requests
for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can delete clinical mso requests"
on public.clinical_mso_requests
for delete
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can view clinical recommendations"
on public.clinical_recommendations
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert clinical recommendations"
on public.clinical_recommendations
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can update clinical recommendations"
on public.clinical_recommendations
for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can delete clinical recommendations"
on public.clinical_recommendations
for delete
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can view clinical patient opinions"
on public.clinical_patient_opinions
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert clinical patient opinions"
on public.clinical_patient_opinions
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can update clinical patient opinions"
on public.clinical_patient_opinions
for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can delete clinical patient opinions"
on public.clinical_patient_opinions
for delete
to authenticated
using (organization_id = public.current_organization_id());
