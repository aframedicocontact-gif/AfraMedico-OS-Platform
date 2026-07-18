import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Admin-triggered: an internal Growth OS organization_administrator invites
// an approved_activation_pending live partner into the Phase 1B activation
// portal. The invited identity is a standalone auth.users row that is never
// added to this organization: it never gets a user_profiles row, an
// organization_users row, or a user_role_assignments row, and its
// app_metadata never receives organization_id. Every other RLS policy in
// this schema keys off app_metadata.organization_id, so omitting it is what
// keeps a partner-portal session from ever reading or writing any
// organization-scoped table directly.
//
// This function never returns a session, access token, refresh token, OTP,
// or raw action link to the caller — the partner authenticates entirely
// through the email Supabase's own Auth email delivery sends.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'apikey, authorization, content-type',
};

// SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY are
// injected automatically into every Edge Function by the Supabase runtime.
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// The deployed app's partner-activation URL. Hardcoded rather than read
// from a project secret: the previous PARTNER_ACTIVATE_REDIRECT_URL secret
// was the root cause of partners landing on the internal login page instead
// of /partner/activate -- it was either unset or stale, and nothing in this
// function could detect that at deploy time. This must stay in Supabase
// Auth's Redirect URL allow-list (Dashboard > Authentication > URL
// Configuration) for GoTrue to honor it.
const PARTNER_ACTIVATE_REDIRECT_URL = 'https://afra-medico-os-platform.vercel.app/partner/activate';

// The intended From identity for the activation email ("AfraMedico Partner
// Network" <partners@aframedico.com>) is a project-level Auth/SMTP setting,
// not something an Edge Function can set per invocation, and configuring it
// remains a separate, deferred dashboard step -- see the implementation
// report. Not modeled as a constant here since nothing in this function
// references it.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Safety cap on the existing-user lookup scan below -- see the comment at
// findAuthUserByEmail for why this scan exists at all.
const USER_LOOKUP_MAX_PAGES = 20;
const USER_LOOKUP_PAGE_SIZE = 1000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isValidUUID(v: unknown): v is string {
  return typeof v === 'string' && UUID_RE.test(v);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Uses the official supabase-js signInWithOtp API (an anon-key client, not
// a raw fetch) so emailRedirectTo goes through the same code path Supabase
// documents and tests -- a raw JSON body `redirect_to` field is silently
// ignored by GoTrue's /otp endpoint, which is what caused partners to land
// on the Site URL default (the internal login page) instead of
// /partner/activate. shouldCreateUser is false because the auth user is
// always created/found explicitly above, before this is ever called.
async function sendActivationOtpEmail(email: string) {
  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return authClient.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: PARTNER_ACTIVATE_REDIRECT_URL,
      shouldCreateUser: false,
    },
  });
}

type AdminClient = ReturnType<typeof createClient>;

// The supabase-js v2 admin API has no getUserByEmail method and this
// project does not expose the `auth` schema over PostgREST, so there is no
// direct query available to test "does an auth user with this email
// already exist." listUsers() is the only stable, documented method that
// can answer that question; it is paginated and does not filter
// server-side, so this scans up to USER_LOOKUP_MAX_PAGES pages looking for
// a case-insensitive email match. That is a genuine scalability ceiling
// (silently treats the user as "not found" past ~20k auth users) rather
// than an unbounded loop -- acceptable for this project's current auth
// user count, called out explicitly in the implementation report.
async function findAuthUserByEmail(adminClient: AdminClient, normalizedEmail: string) {
  for (let page = 1; page <= USER_LOOKUP_MAX_PAGES; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: USER_LOOKUP_PAGE_SIZE });
    if (error) {
      throw error;
    }
    const match = data.users.find((u) => u.email && normalizeEmail(u.email) === normalizedEmail);
    if (match) {
      return match;
    }
    if (data.users.length < USER_LOOKUP_PAGE_SIZE) {
      return null;
    }
  }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    // Step 1: identify the caller from their own access token. This is an
    // admin-only action, so the caller must be an authenticated internal
    // organization_administrator -- never a partner-portal session, never
    // anonymous, and never any other role.
    const authHeader = req.headers.get('authorization') ?? '';
    const callerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!callerToken) {
      return json({ error: 'Missing Authorization bearer token' }, 401);
    }

    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${callerToken}` } },
    });
    const { data: callerData, error: callerError } = await callerClient.auth.getUser(callerToken);
    if (callerError || !callerData?.user) {
      return json({ error: 'Invalid or expired session' }, 401);
    }

    const callerAppMetadata = (callerData.user.app_metadata ?? {}) as Record<string, unknown>;
    const callerOrganizationId = callerAppMetadata.organization_id;
    const callerIsPartnerPortal = callerAppMetadata.partner_portal === true;

    if (callerIsPartnerPortal || !isValidUUID(callerOrganizationId)) {
      return json({ error: 'Forbidden' }, 403);
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Step 1b: the caller must hold an active, non-revoked, non-expired
    // organization_administrator role assignment in their own organization.
    // Reuses the existing role -- no new role or role assignment is created
    // for admins by this function.
    const { data: isAdmin, error: adminCheckErr } = await adminClient.rpc('is_active_org_admin', {
      p_auth_user_id: callerData.user.id,
      p_organization_id: callerOrganizationId,
    });
    if (adminCheckErr) {
      console.error('is_active_org_admin check error:', adminCheckErr);
      return json({ error: 'Failed to verify caller authorization' }, 500);
    }
    if (!isAdmin) {
      return json({ error: 'Forbidden' }, 403);
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid request body' }, 400);
    }

    const partnerId = body.partner_id;
    if (!isValidUUID(partnerId)) {
      return json({ error: 'Invalid partner_id' }, 400);
    }

    // Step 2: load and gate the target partner.
    const { data: partner, error: partnerErr } = await adminClient
      .from('partners')
      .select('id, organization_id, name, status, lifecycle_stage')
      .eq('id', partnerId)
      .maybeSingle();

    if (partnerErr) {
      console.error('partner lookup error:', partnerErr);
      return json({ error: 'Failed to load partner' }, 500);
    }
    if (!partner) {
      return json({ error: 'Partner not found' }, 404);
    }
    if (partner.organization_id !== callerOrganizationId) {
      return json({ error: 'Forbidden' }, 403);
    }
    // 'invitation_sent' is included so a resend for a partner who hasn't
    // yet authenticated is still allowed -- the authoritative gate against
    // re-inviting an already-activated partner is the existingLink.status
    // === 'active' check below, not this lifecycle_stage check.
    if (
      partner.lifecycle_stage !== 'approved_activation_pending' &&
      partner.lifecycle_stage !== 'invitation_sent'
    ) {
      return json(
        { error: 'not_eligible', message: 'Partner is not in approved_activation_pending stage.' },
        409,
      );
    }

    const { data: intake, error: intakeErr } = await adminClient
      .from('partner_network_intake')
      .select('email, full_name')
      .eq('partner_id', partnerId)
      .maybeSingle();

    if (intakeErr) {
      console.error('intake lookup error:', intakeErr);
      return json({ error: 'Failed to load transferred application details' }, 500);
    }
    if (!intake?.email) {
      return json(
        { error: 'no_transferred_email', message: 'No transferred application email found for this partner.' },
        422,
      );
    }

    const normalizedEmail = normalizeEmail(intake.email);

    // Step 3: idempotency -- reuse or create the auth_link row keyed on
    // partner_id (unique constraint), never on email, so a resend never
    // creates a second link row for the same partner.
    const { data: existingLink, error: existingLinkErr } = await adminClient
      .from('partner_auth_links')
      .select('id, auth_user_id, status')
      .eq('partner_id', partnerId)
      .maybeSingle();

    if (existingLinkErr) {
      console.error('auth link lookup error:', existingLinkErr);
      return json({ error: 'Failed to check existing activation link' }, 500);
    }

    if (existingLink && existingLink.status === 'active') {
      return json(
        { error: 'already_activated', message: 'Partner has already signed in and activated the portal.' },
        409,
      );
    }

    // Step 4: determine whether an auth user already exists for this email.
    let foundUser: Awaited<ReturnType<typeof findAuthUserByEmail>>;
    try {
      foundUser = await findAuthUserByEmail(adminClient, normalizedEmail);
    } catch (lookupErr) {
      console.error('findAuthUserByEmail error:', lookupErr);
      return json({ error: 'Failed to check existing account for this email' }, 500);
    }

    let authUserId: string;
    // Always 'magic_link_email': both branches below create/find the auth
    // user first and then send Supabase's native OTP email, never the
    // separate inviteUserByEmail flow.
    const deliveryMethod: 'magic_link_email' = 'magic_link_email';

    if (!foundUser) {
      // Step 5a: brand-new auth user. Create the identity and record the
      // partner_auth_links row *before* any email goes out -- the
      // magic-link email is only sent once both are confirmed in place, so
      // a caller never receives an activation email for an identity that
      // isn't actually linked yet.
      const { data: createdUser, error: createErr } = await adminClient.auth.admin.createUser({
        email: intake.email,
        email_confirm: false,
        app_metadata: { partner_portal: true },
        user_metadata: { full_name: intake.full_name ?? null },
      });
      if (createErr || !createdUser?.user) {
        console.error('createUser error:', createErr);
        return json({ error: 'Failed to create partner account' }, 500);
      }
      authUserId = createdUser.user.id;

      const { error: linkErr } = await adminClient.from('partner_auth_links').upsert(
        {
          organization_id: partner.organization_id,
          partner_id: partner.id,
          auth_user_id: authUserId,
          status: 'invited',
          invited_by: callerData.user.id,
          invited_at: new Date().toISOString(),
        },
        { onConflict: 'partner_id' },
      );
      if (linkErr) {
        console.error('partner_auth_links upsert error:', linkErr);
        // The auth identity was created but never got linked -- remove it
        // rather than leaving an orphaned, unlinked auth user behind.
        const { error: cleanupErr } = await adminClient.auth.admin.deleteUser(authUserId);
        if (cleanupErr) {
          console.error('cleanup deleteUser error after failed partner_auth_links insert:', cleanupErr);
        }
        return json({ error: 'Failed to record activation link' }, 500);
      }

      // Send Supabase's native magic-link email only now that both the
      // auth identity and its partner_auth_links row exist. shouldCreateUser
      // is explicitly false since the user was just created above. This
      // does not return the generated link to the caller -- Supabase
      // delivers it by email using the project's already-configured Auth
      // email delivery.
      const { error: otpError } = await sendActivationOtpEmail(intake.email);
      if (otpError) {
        console.error('native OTP email dispatch failed:', otpError);
        return json({ error: 'Failed to send activation email' }, 500);
      }

      const { error: lifecycleErr } = await adminClient
        .from('partners')
        .update({ lifecycle_stage: 'invitation_sent' })
        .eq('id', partner.id);
      if (lifecycleErr) {
        console.error('partners lifecycle_stage update error (invitation_sent):', lifecycleErr);
      }
    } else {
      // Step 5b: an auth user already exists for this email. Internal
      // Growth OS staff accounts always carry organization_id in
      // app_metadata (that is exactly what grants their organization-scoped
      // session) -- never convert or link one of those as a partner.
      const foundAppMetadata = (foundUser.app_metadata ?? {}) as Record<string, unknown>;
      if (isValidUUID(foundAppMetadata.organization_id)) {
        return json(
          {
            error: 'email_belongs_to_internal_account',
            message: 'This email belongs to an internal staff account and cannot be used for a partner invite.',
          },
          409,
        );
      }

      // An existing non-staff auth user may already be linked to a
      // *different* partner. That is a conflict requiring manual admin
      // resolution, not something this function silently overwrites.
      const { data: reverseLink, error: reverseLinkErr } = await adminClient
        .from('partner_auth_links')
        .select('partner_id')
        .eq('auth_user_id', foundUser.id)
        .maybeSingle();
      if (reverseLinkErr) {
        console.error('reverse auth link lookup error:', reverseLinkErr);
        return json({ error: 'Failed to check existing account links' }, 500);
      }
      if (reverseLink && reverseLink.partner_id !== partnerId) {
        return json(
          {
            error: 'email_already_linked_to_different_partner',
            message: 'This email is already linked to a different partner and requires manual admin resolution.',
          },
          409,
        );
      }

      // An existing auth user that isn't already linked to *this* partner
      // is never auto-converted into one -- that would silently repurpose
      // an identity nothing here can verify the ownership of. It requires
      // manual admin review instead.
      if (!reverseLink) {
        return json(
          {
            error: 'existing_auth_user_requires_manual_review',
            message: 'An auth account already exists for this email but is not linked to any partner. Manual review is required before an invite can be sent.',
          },
          409,
        );
      }

      // reverseLink.partner_id === partnerId: this is a resend to an
      // identity already linked to this exact partner.
      authUserId = foundUser.id;

      const mergedAppMetadata = {
        ...foundAppMetadata,
        partner_portal: true,
      };
      const { error: updateMetaErr } = await adminClient.auth.admin.updateUserById(authUserId, {
        app_metadata: mergedAppMetadata,
      });
      if (updateMetaErr) {
        console.error('updateUserById app_metadata error:', updateMetaErr);
        return json({ error: 'Failed to configure invited user access' }, 500);
      }

      // Send Supabase's native magic-link email. shouldCreateUser is
      // explicitly false since the user already exists. This does not
      // return the generated link to the caller -- Supabase delivers it by
      // email using the project's already-configured Auth email delivery.
      const { error: otpError } = await sendActivationOtpEmail(intake.email);
      if (otpError) {
        console.error('native OTP email dispatch failed:', otpError);
        return json({ error: 'Failed to send activation email' }, 500);
      }

      const { error: lifecycleErr } = await adminClient
        .from('partners')
        .update({ lifecycle_stage: 'invitation_sent' })
        .eq('id', partner.id);
      if (lifecycleErr) {
        console.error('partners lifecycle_stage update error (invitation_sent):', lifecycleErr);
      }

      // Step 6: refresh the existing auth link row (invited_at/invited_by)
      // now that the resend has succeeded.
      const { error: linkErr } = await adminClient.from('partner_auth_links').upsert(
        {
          organization_id: partner.organization_id,
          partner_id: partner.id,
          auth_user_id: authUserId,
          status: 'invited',
          invited_by: callerData.user.id,
          invited_at: new Date().toISOString(),
        },
        { onConflict: 'partner_id' },
      );
      if (linkErr) {
        console.error('partner_auth_links upsert error:', linkErr);
        return json({ error: 'Failed to record activation link' }, 500);
      }
    }

    return json({
      success: true,
      partner_id: partner.id,
      already_invited: Boolean(existingLink),
      delivery_method: deliveryMethod,
      message: existingLink ? 'Activation invite resent.' : 'Activation invite sent.',
    });
  } catch (error) {
    console.error('Error in send-partner-activation-invite:', error);
    return json({ error: 'Internal server error' }, 500);
  }
});
