# AfraMedico Business Growth OS

Standalone clickable UI prototype for AfraMedico internal business growth operations.

This project is separate from the public AfraMedico website. Sprint 1 contains no authentication, backend, API, Supabase integration, SQL, migrations, or mock services.

## Sprint 1: Authority CRM Prototype

Pages only:

- Dashboard
- Organizations List
- Organization Details
- Add Organization

Data comes from local JSON so the workflow can be reviewed before backend work begins.

## Architecture

```text
src/
  app/
    App.tsx
  components/
    layout/
      AppShell.tsx
    pages/
      AddOrganization.tsx
      Dashboard.tsx
      OrganizationDetails.tsx
      OrganizationsList.tsx
    ui/
      badge.tsx
      button.tsx
      card.tsx
      input.tsx
      select.tsx
      table.tsx
  data/
    organizations.json
  lib/
    utils.ts
  styles/
    globals.css
  types/
    organization.ts
```

## Local Run

```bash
npm install
npm run dev
```
