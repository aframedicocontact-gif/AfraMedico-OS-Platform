-- ICOS Backend Sprint 5: Patient Travel Coordination Foundation
-- ICOS is not a booking platform.
--
-- This migration records medical travel coordination only. Travel, hotel,
-- flight, transfer, interpreter, and escort reservations remain with patients,
-- trusted travel providers, hospital partners, or future external integrations.

create table public.travel_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  case_id uuid not null,
  patient_id uuid not null,
  travel_plan_code text not null,
  destination_country text,
  destination_city text,
  travel_status text not null default 'planning',
  coordination_owner_id uuid,
  external_booking_provider text,
  booking_responsibility text not null default 'patient_or_external_provider',
  expected_departure_date date,
  expected_return_date date,
  arrival_date date,
  departure_date date,
  notes text,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint travel_plans_case_patient_same_organization_fk foreign key (case_id, patient_id, organization_id) references public.cases(id, patient_id, organization_id) on delete cascade,
  constraint travel_plans_owner_same_organization_fk foreign key (coordination_owner_id, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint travel_plans_created_by_same_organization_fk foreign key (created_by, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint travel_plans_id_organization_unique unique (id, organization_id),
  constraint travel_plans_code_unique unique (organization_id, travel_plan_code),
  constraint travel_plans_status_check check (travel_status in ('planning', 'waiting_documents', 'visa_in_progress', 'travel_ready', 'in_transit', 'arrived', 'under_treatment', 'return_planning', 'completed', 'cancelled')),
  constraint travel_plans_booking_responsibility_check check (booking_responsibility in ('patient_direct', 'external_provider', 'hospital_partner', 'aframedico_coordination_only', 'patient_or_external_provider'))
);

comment on table public.travel_plans is
  'Case-linked medical travel coordination plans. ICOS coordinates travel workflows but does not act as a booking platform.';

create table public.travel_milestones (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  travel_plan_id uuid not null,
  case_id uuid not null,
  patient_id uuid not null,
  milestone_type text not null,
  milestone_status text not null default 'planned',
  title text not null,
  description text,
  scheduled_at timestamptz,
  completed_at timestamptz,
  event_type text not null default 'travel_milestone',
  event_title text not null,
  event_description text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint travel_milestones_plan_same_organization_fk foreign key (travel_plan_id, organization_id) references public.travel_plans(id, organization_id) on delete cascade,
  constraint travel_milestones_case_patient_same_organization_fk foreign key (case_id, patient_id, organization_id) references public.cases(id, patient_id, organization_id) on delete cascade,
  constraint travel_milestones_created_by_same_organization_fk foreign key (created_by, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint travel_milestones_type_check check (milestone_type in ('visa_started', 'visa_approved', 'flight_planned', 'flight_confirmed', 'hotel_coordinated', 'airport_pickup', 'hospital_admission', 'treatment_started', 'discharge', 'return_travel', 'follow_up')),
  constraint travel_milestones_status_check check (milestone_status in ('planned', 'in_progress', 'completed', 'delayed', 'cancelled'))
);

comment on table public.travel_milestones is
  'Append-only travel timeline milestones. Milestones are timeline-compatible and preserve coordination history.';

create table public.visa_processes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  travel_plan_id uuid not null,
  case_id uuid not null,
  visa_country text not null,
  visa_type text,
  visa_status text not null default 'not_started',
  application_reference text,
  invitation_letter_required boolean not null default false,
  invitation_letter_requested_at timestamptz,
  invitation_letter_received_at timestamptz,
  application_submitted_at timestamptz,
  expected_decision_at timestamptz,
  decision_received_at timestamptz,
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint visa_processes_plan_same_organization_fk foreign key (travel_plan_id, organization_id) references public.travel_plans(id, organization_id) on delete cascade,
  constraint visa_processes_case_same_organization_fk foreign key (case_id, organization_id) references public.cases(id, organization_id) on delete cascade,
  constraint visa_processes_created_by_same_organization_fk foreign key (created_by, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint visa_processes_status_check check (visa_status in ('not_started', 'documents_requested', 'in_progress', 'submitted', 'approved', 'rejected', 'expired', 'not_required', 'cancelled'))
);

comment on table public.visa_processes is
  'Visa coordination records for a Case travel plan. ICOS tracks status and documents; it does not submit visa applications.';

create table public.travel_companions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  travel_plan_id uuid not null,
  case_id uuid not null,
  full_name text not null,
  relationship text,
  phone text,
  email text,
  passport_status text not null default 'unknown',
  visa_status text not null default 'unknown',
  travel_status text not null default 'planning',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint travel_companions_plan_same_organization_fk foreign key (travel_plan_id, organization_id) references public.travel_plans(id, organization_id) on delete cascade,
  constraint travel_companions_case_same_organization_fk foreign key (case_id, organization_id) references public.cases(id, organization_id) on delete cascade,
  constraint travel_companions_passport_status_check check (passport_status in ('unknown', 'valid', 'expired', 'missing', 'renewal_required')),
  constraint travel_companions_visa_status_check check (visa_status in ('unknown', 'not_required', 'not_started', 'in_progress', 'approved', 'rejected')),
  constraint travel_companions_travel_status_check check (travel_status in ('planning', 'confirmed', 'traveling', 'arrived', 'returned', 'cancelled'))
);

comment on table public.travel_companions is
  'Companion coordination records for a medical travel Case. Companions remain part of the travel plan context.';

create table public.airport_transfers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  travel_plan_id uuid not null,
  case_id uuid not null,
  transfer_type text not null,
  transfer_status text not null default 'coordination_pending',
  pickup_location text,
  dropoff_location text,
  scheduled_at timestamptz,
  external_provider text,
  hospital_partner_contact text,
  confirmation_reference text,
  coordinated_by uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint airport_transfers_plan_same_organization_fk foreign key (travel_plan_id, organization_id) references public.travel_plans(id, organization_id) on delete cascade,
  constraint airport_transfers_case_same_organization_fk foreign key (case_id, organization_id) references public.cases(id, organization_id) on delete cascade,
  constraint airport_transfers_coordinated_by_same_organization_fk foreign key (coordinated_by, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint airport_transfers_type_check check (transfer_type in ('airport_pickup', 'airport_dropoff', 'hospital_transfer', 'hotel_transfer', 'other')),
  constraint airport_transfers_status_check check (transfer_status in ('coordination_pending', 'requested', 'confirmed', 'completed', 'cancelled', 'external_provider_managed'))
);

comment on table public.airport_transfers is
  'Airport and local transfer coordination records. Reservations remain external unless separately contracted.';

create table public.hotel_coordination (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  travel_plan_id uuid not null,
  case_id uuid not null,
  hotel_status text not null default 'coordination_pending',
  preferred_area text,
  hotel_name text,
  check_in_date date,
  check_out_date date,
  external_provider text,
  booking_reference text,
  booking_responsibility text not null default 'patient_or_external_provider',
  coordinated_by uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hotel_coordination_plan_same_organization_fk foreign key (travel_plan_id, organization_id) references public.travel_plans(id, organization_id) on delete cascade,
  constraint hotel_coordination_case_same_organization_fk foreign key (case_id, organization_id) references public.cases(id, organization_id) on delete cascade,
  constraint hotel_coordination_coordinated_by_same_organization_fk foreign key (coordinated_by, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint hotel_coordination_status_check check (hotel_status in ('coordination_pending', 'options_shared', 'requested', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'external_provider_managed')),
  constraint hotel_coordination_booking_responsibility_check check (booking_responsibility in ('patient_direct', 'external_provider', 'hospital_partner', 'aframedico_coordination_only', 'patient_or_external_provider'))
);

comment on table public.hotel_coordination is
  'Hotel coordination metadata for a Case travel plan. ICOS records coordination and external references, not bookings.';

create table public.flight_coordination (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  travel_plan_id uuid not null,
  case_id uuid not null,
  flight_status text not null default 'coordination_pending',
  airline text,
  flight_number text,
  departure_airport text,
  arrival_airport text,
  departure_at timestamptz,
  arrival_at timestamptz,
  external_provider text,
  booking_reference text,
  booking_responsibility text not null default 'patient_or_external_provider',
  coordinated_by uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint flight_coordination_plan_same_organization_fk foreign key (travel_plan_id, organization_id) references public.travel_plans(id, organization_id) on delete cascade,
  constraint flight_coordination_case_same_organization_fk foreign key (case_id, organization_id) references public.cases(id, organization_id) on delete cascade,
  constraint flight_coordination_coordinated_by_same_organization_fk foreign key (coordinated_by, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint flight_coordination_status_check check (flight_status in ('coordination_pending', 'options_shared', 'requested', 'confirmed', 'departed', 'arrived', 'changed', 'cancelled', 'external_provider_managed')),
  constraint flight_coordination_booking_responsibility_check check (booking_responsibility in ('patient_direct', 'external_provider', 'hospital_partner', 'aframedico_coordination_only', 'patient_or_external_provider'))
);

comment on table public.flight_coordination is
  'Flight coordination metadata for a Case travel plan. ICOS records travel status and external references, not ticket sales.';

create table public.interpreter_services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  travel_plan_id uuid not null,
  case_id uuid not null,
  language text not null,
  service_status text not null default 'coordination_pending',
  service_provider text,
  scheduled_start_at timestamptz,
  scheduled_end_at timestamptz,
  hospital_provided boolean not null default false,
  external_reference text,
  coordinated_by uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint interpreter_services_plan_same_organization_fk foreign key (travel_plan_id, organization_id) references public.travel_plans(id, organization_id) on delete cascade,
  constraint interpreter_services_case_same_organization_fk foreign key (case_id, organization_id) references public.cases(id, organization_id) on delete cascade,
  constraint interpreter_services_coordinated_by_same_organization_fk foreign key (coordinated_by, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint interpreter_services_status_check check (service_status in ('coordination_pending', 'requested', 'confirmed', 'in_progress', 'completed', 'cancelled', 'external_provider_managed'))
);

comment on table public.interpreter_services is
  'Interpreter coordination records for medical travel support. Services may be hospital-provided or externally coordinated.';

create table public.medical_escort_services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  travel_plan_id uuid not null,
  case_id uuid not null,
  escort_type text not null,
  service_status text not null default 'coordination_pending',
  medical_clearance_required boolean not null default false,
  clearance_status text not null default 'not_required',
  service_provider text,
  scheduled_start_at timestamptz,
  scheduled_end_at timestamptz,
  external_reference text,
  coordinated_by uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint medical_escort_services_plan_same_organization_fk foreign key (travel_plan_id, organization_id) references public.travel_plans(id, organization_id) on delete cascade,
  constraint medical_escort_services_case_same_organization_fk foreign key (case_id, organization_id) references public.cases(id, organization_id) on delete cascade,
  constraint medical_escort_services_coordinated_by_same_organization_fk foreign key (coordinated_by, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint medical_escort_services_escort_type_check check (escort_type in ('nurse', 'doctor', 'paramedic', 'air_ambulance', 'wheelchair_assistance', 'other')),
  constraint medical_escort_services_status_check check (service_status in ('coordination_pending', 'requested', 'confirmed', 'in_progress', 'completed', 'cancelled', 'external_provider_managed')),
  constraint medical_escort_services_clearance_status_check check (clearance_status in ('not_required', 'required', 'requested', 'received', 'approved', 'rejected'))
);

comment on table public.medical_escort_services is
  'Medical escort coordination records. ICOS tracks coordination and clearance status while external providers deliver the service.';

create table public.travel_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  travel_plan_id uuid not null,
  case_id uuid not null,
  case_document_id uuid,
  document_type text not null,
  document_status text not null default 'missing',
  filename text,
  storage_path text,
  issued_at date,
  expires_at date,
  verified_by uuid,
  verified_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint travel_documents_plan_same_organization_fk foreign key (travel_plan_id, organization_id) references public.travel_plans(id, organization_id) on delete cascade,
  constraint travel_documents_case_same_organization_fk foreign key (case_id, organization_id) references public.cases(id, organization_id) on delete cascade,
  constraint travel_documents_case_document_same_organization_fk foreign key (case_document_id, organization_id) references public.case_documents(id, organization_id) on delete restrict,
  constraint travel_documents_verified_by_same_organization_fk foreign key (verified_by, organization_id) references public.user_profiles(id, organization_id) on delete restrict,
  constraint travel_documents_type_check check (document_type in ('passport', 'visa', 'invitation_letter', 'flight_confirmation', 'hotel_confirmation', 'travel_insurance', 'medical_clearance', 'consent', 'other')),
  constraint travel_documents_status_check check (document_status in ('missing', 'requested', 'received', 'verified', 'expired', 'rejected', 'not_required'))
);

comment on table public.travel_documents is
  'Travel document metadata linked to a Case travel plan. This table does not create storage buckets.';

create trigger travel_plans_set_updated_at
before update on public.travel_plans
for each row execute function public.set_updated_at();

create trigger travel_milestones_set_updated_at
before update on public.travel_milestones
for each row execute function public.set_updated_at();

create trigger visa_processes_set_updated_at
before update on public.visa_processes
for each row execute function public.set_updated_at();

create trigger travel_companions_set_updated_at
before update on public.travel_companions
for each row execute function public.set_updated_at();

create trigger airport_transfers_set_updated_at
before update on public.airport_transfers
for each row execute function public.set_updated_at();

create trigger hotel_coordination_set_updated_at
before update on public.hotel_coordination
for each row execute function public.set_updated_at();

create trigger flight_coordination_set_updated_at
before update on public.flight_coordination
for each row execute function public.set_updated_at();

create trigger interpreter_services_set_updated_at
before update on public.interpreter_services
for each row execute function public.set_updated_at();

create trigger medical_escort_services_set_updated_at
before update on public.medical_escort_services
for each row execute function public.set_updated_at();

create trigger travel_documents_set_updated_at
before update on public.travel_documents
for each row execute function public.set_updated_at();

create index travel_plans_organization_id_idx on public.travel_plans (organization_id);
create index travel_plans_case_id_idx on public.travel_plans (case_id);
create index travel_plans_patient_id_idx on public.travel_plans (patient_id);
create index travel_plans_status_idx on public.travel_plans (travel_status);
create index travel_plans_owner_id_idx on public.travel_plans (coordination_owner_id);

create index travel_milestones_organization_id_idx on public.travel_milestones (organization_id);
create index travel_milestones_plan_id_idx on public.travel_milestones (travel_plan_id);
create index travel_milestones_case_id_idx on public.travel_milestones (case_id);
create index travel_milestones_patient_id_idx on public.travel_milestones (patient_id);
create index travel_milestones_type_idx on public.travel_milestones (milestone_type);
create index travel_milestones_scheduled_at_idx on public.travel_milestones (scheduled_at);
create index travel_milestones_created_at_idx on public.travel_milestones (created_at);

create index visa_processes_organization_id_idx on public.visa_processes (organization_id);
create index visa_processes_plan_id_idx on public.visa_processes (travel_plan_id);
create index visa_processes_case_id_idx on public.visa_processes (case_id);
create index visa_processes_status_idx on public.visa_processes (visa_status);

create index travel_companions_organization_id_idx on public.travel_companions (organization_id);
create index travel_companions_plan_id_idx on public.travel_companions (travel_plan_id);
create index travel_companions_case_id_idx on public.travel_companions (case_id);

create index airport_transfers_organization_id_idx on public.airport_transfers (organization_id);
create index airport_transfers_plan_id_idx on public.airport_transfers (travel_plan_id);
create index airport_transfers_case_id_idx on public.airport_transfers (case_id);
create index airport_transfers_status_idx on public.airport_transfers (transfer_status);
create index airport_transfers_scheduled_at_idx on public.airport_transfers (scheduled_at);

create index hotel_coordination_organization_id_idx on public.hotel_coordination (organization_id);
create index hotel_coordination_plan_id_idx on public.hotel_coordination (travel_plan_id);
create index hotel_coordination_case_id_idx on public.hotel_coordination (case_id);
create index hotel_coordination_status_idx on public.hotel_coordination (hotel_status);

create index flight_coordination_organization_id_idx on public.flight_coordination (organization_id);
create index flight_coordination_plan_id_idx on public.flight_coordination (travel_plan_id);
create index flight_coordination_case_id_idx on public.flight_coordination (case_id);
create index flight_coordination_status_idx on public.flight_coordination (flight_status);
create index flight_coordination_departure_at_idx on public.flight_coordination (departure_at);

create index interpreter_services_organization_id_idx on public.interpreter_services (organization_id);
create index interpreter_services_plan_id_idx on public.interpreter_services (travel_plan_id);
create index interpreter_services_case_id_idx on public.interpreter_services (case_id);
create index interpreter_services_status_idx on public.interpreter_services (service_status);

create index medical_escort_services_organization_id_idx on public.medical_escort_services (organization_id);
create index medical_escort_services_plan_id_idx on public.medical_escort_services (travel_plan_id);
create index medical_escort_services_case_id_idx on public.medical_escort_services (case_id);
create index medical_escort_services_status_idx on public.medical_escort_services (service_status);

create index travel_documents_organization_id_idx on public.travel_documents (organization_id);
create index travel_documents_plan_id_idx on public.travel_documents (travel_plan_id);
create index travel_documents_case_id_idx on public.travel_documents (case_id);
create index travel_documents_case_document_id_idx on public.travel_documents (case_document_id);
create index travel_documents_type_idx on public.travel_documents (document_type);
create index travel_documents_status_idx on public.travel_documents (document_status);

alter table public.travel_plans enable row level security;
alter table public.travel_milestones enable row level security;
alter table public.visa_processes enable row level security;
alter table public.travel_companions enable row level security;
alter table public.airport_transfers enable row level security;
alter table public.hotel_coordination enable row level security;
alter table public.flight_coordination enable row level security;
alter table public.interpreter_services enable row level security;
alter table public.medical_escort_services enable row level security;
alter table public.travel_documents enable row level security;

create policy "organization members can manage travel plans"
on public.travel_plans
for all
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can view travel milestones"
on public.travel_milestones
for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can insert travel milestones"
on public.travel_milestones
for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "organization members can manage visa processes"
on public.visa_processes
for all
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can manage travel companions"
on public.travel_companions
for all
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can manage airport transfers"
on public.airport_transfers
for all
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can manage hotel coordination"
on public.hotel_coordination
for all
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can manage flight coordination"
on public.flight_coordination
for all
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can manage interpreter services"
on public.interpreter_services
for all
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can manage medical escort services"
on public.medical_escort_services
for all
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members can manage travel documents"
on public.travel_documents
for all
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());
