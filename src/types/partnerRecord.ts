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
