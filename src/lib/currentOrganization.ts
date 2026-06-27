export type DevelopmentOrganizationContext = {
  id: string | null;
  slug: string;
  name: string;
  mode: "development-placeholder";
};

export const developmentOrganizationContext: DevelopmentOrganizationContext = {
  id: import.meta.env.VITE_DEV_ORGANIZATION_ID?.trim() || null,
  slug: "aframedico",
  name: "AfraMedico",
  mode: "development-placeholder",
};

export function getDevelopmentOrganizationContext() {
  return developmentOrganizationContext;
}
