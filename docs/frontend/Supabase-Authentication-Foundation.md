# Supabase Authentication Foundation

Phase 2 Sprint 2 introduces the first frontend authentication layer for AfraMedico OS Platform.

This sprint does not protect the full application yet. It prepares the structure for safe Supabase Auth integration while the product still uses local JSON data for operational screens.

## Current Auth Model

The frontend now has:

- `src/services/authService.ts` for Supabase email/password auth calls.
- `src/contexts/AuthContext.tsx` for application-wide auth state.
- `src/components/auth/ProtectedRoute.tsx` for gradual protected-route rollout.
- `src/components/pages/LoginPage.tsx` for development sign-in.
- `src/lib/authHealthCheck.ts` for lightweight auth readiness checks.

The app remains usable without a session during this transition. Only `/login` is wired as a standalone development login page.

## Environment Variables

Required variables:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_DEV_ORGANIZATION_ID=
```

Real keys must never be committed to the repository. Local values belong in `.env.local`.

`VITE_DEV_ORGANIZATION_ID` is a non-secret development pointer to the bootstrapped AfraMedico organization. It should match the `ORGANIZATION_ID` used in the development bootstrap SQL template.

## Why The App Is Not Fully Protected Yet

The frontend still relies on local JSON data for most pages. Full protection will be introduced only after:

- First development admin user is created.
- User is linked to an organization.
- `app_metadata.organization_id` is available in the Supabase Auth token.
- Role and permission checks are connected to the operational access foundation.

This avoids breaking the prototype while backend integration is introduced module by module.

## Future organization_id Requirement

Backend RLS policies depend on organization-scoped access. Future authenticated users must include the correct organization context, most likely through:

- Supabase Auth user metadata.
- `app_metadata.organization_id`.
- Organization user membership records.
- Role and permission assignments.

Until that model is wired end to end, live database reads should remain limited and carefully tested.

## Future Role And Permission Enforcement

The backend already includes an operational access foundation for departments, roles, permissions, teams, sessions, and access audit logs.

Future frontend work should connect permissions to:

- Case access.
- Clinical decisions.
- Hospital referrals.
- Finance and commission actions.
- Provider network updates.
- Administration screens.

Clinical, financial, and commission-sensitive decisions must continue to require human approval.

## Next Step

Create the first development admin user in Supabase Auth, link that user to the AfraMedico organization, and verify a live Organization / Patient / Case workflow without removing mock data prematurely.

Phase 2 Sprint 3 adds the bootstrap path for linking the Supabase Auth user to:

- `organizations`
- `user_profiles`
- `organization_users`
- initial role assignment readiness

Use `docs/backend/First-Organization-Admin-Bootstrap.md` and `supabase/bootstrap/001_development_aframedico_admin.sql` as the development-only bootstrap guide. The app should not be fully protected until the first user has a valid organization link and future `app_metadata.organization_id` handling is confirmed.
