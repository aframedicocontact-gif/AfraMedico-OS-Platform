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
