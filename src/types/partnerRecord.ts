export type LivePartner = {
  id: string;
  partner_code: string;
  name: string;
  country: string | null;
  type: string | null;
  status: string;
  acquisition_source: string | null;
  lifecycle_stage: string | null;
  created_at: string;
};

export type PartnerAuthLinkStatus = "invited" | "active" | "revoked";

export type PartnerAuthLink = {
  id: string;
  partner_id: string;
  status: PartnerAuthLinkStatus;
  invited_at: string;
  activated_at: string | null;
};

export type PartnerEntityType = "individual" | "organization";
export type PartnerCommunicationMethod = "email" | "phone" | "whatsapp";

export type PartnerOnboardingProfile = {
  id: string;
  partner_id: string;
  legal_full_name: string | null;
  legal_address: string | null;
  entity_type: PartnerEntityType | null;
  authorized_representative_name: string | null;
  preferred_communication_method: PartnerCommunicationMethod | null;
  completed_at: string | null;
};

export type LiveNetworkIntake = {
  id: string;
  partner_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  city: string | null;
  organization_name: string | null;
  professional_title: string | null;
  applicant_category: string | null;
  years_experience: number | null;
  languages: string[] | null;
  target_countries: string[] | null;
  network_description: string | null;
  relevant_experience: string | null;
  motivation: string | null;
  linkedin: string | null;
  application_date: string | null;
  created_at: string;
};

// Allowlisted read model returned by the partner-activation Edge Function's
// get_profile action. Deliberately excludes organization_id, internal ids,
// resume paths, IP, gender, reviewer info, internal notes, and any
// payment/tax/banking/secret fields -- this is the only shape a
// partner-portal session is ever allowed to see.
export type PartnerActivationProfilePartner = {
  id: string;
  partner_code: string;
  name: string;
  country: string | null;
  type: string | null;
  status: string;
  lifecycle_stage: string | null;
};

export type PartnerActivationProfileIntake = {
  full_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  city: string | null;
  organization_name: string | null;
  professional_title: string | null;
  applicant_category: string | null;
  years_experience: number | null;
  languages: string[] | null;
  target_countries: string[] | null;
  network_description: string | null;
  relevant_experience: string | null;
  motivation: string | null;
  linkedin: string | null;
};

export type PartnerActivationProfileOnboarding = {
  legal_full_name: string | null;
  legal_address: string | null;
  entity_type: PartnerEntityType | null;
  authorized_representative_name: string | null;
  preferred_communication_method: PartnerCommunicationMethod | null;
  completed_at: string | null;
};

export type PartnerActivationProfileAuthLink = {
  status: PartnerAuthLinkStatus;
  invited_at: string;
  activated_at: string | null;
};

export type PartnerActivationProfile = {
  partner: PartnerActivationProfilePartner;
  intake: PartnerActivationProfileIntake | null;
  onboarding_profile: PartnerActivationProfileOnboarding | null;
  auth_link: PartnerActivationProfileAuthLink;
};

export type PartnerPortalAgreementStatus =
  | "pending_signature"
  | "signed"
  | "void"
  | "pending_partner_signature"
  | "pending_aframedico_signature"
  | "fully_executed";

export type PartnerPortalAgreement = {
  id: string;
  title: string;
  template_version: string;
  agreement_text: string;
  commission_rate: number;
  status: PartnerPortalAgreementStatus;
  issued_at: string;
  signed_at: string | null;
  signer_name: string | null;
  signer_title: string | null;
  partner_signed_at: string | null;
  fully_executed_at: string | null;
  has_final_pdf: boolean;
};

export type PartnerPortalReferral = {
  id: string;
  referral_code: string;
  patient_full_name: string;
  patient_country: string;
  requested_treatment: string;
  referral_status: string;
  submitted_at: string;
};

export type PartnerPortalDashboard = {
  partner: {
    partner_code: string;
    name: string;
    country: string | null;
    type: string | null;
    status: string;
    lifecycle_stage: string | null;
  };
  profile: {
    legal_full_name: string;
    entity_type: PartnerEntityType;
    authorized_representative_name: string | null;
  };
  agreement: PartnerPortalAgreement;
  can_submit_referral: boolean;
  referrals: PartnerPortalReferral[];
};
