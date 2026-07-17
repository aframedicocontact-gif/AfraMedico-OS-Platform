import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { cn } from "../../lib/utils";
import {
  adoptSessionFromTokens,
  getPasswordRecoveryTokensFromLocation,
  getSession,
} from "../../services/authService";
import {
  completePartnerActivationProfile,
  getOwnActivationProfile,
  touchPartnerActivation,
} from "../../services/partnerActivationService";
import type {
  PartnerActivationProfileIntake,
  PartnerActivationProfilePartner,
  PartnerCommunicationMethod,
  PartnerEntityType,
} from "../../types/partnerRecord";

type PartnerActivationProps = {
  onDone: () => void;
};

type Stage = "adopting" | "loading" | "invalid" | "revoked" | "form" | "completed" | "error";

// Standalone route (bypasses AppShell entirely, like LoginPage/ResetPasswordPage).
// Establishes a session directly from Supabase's native invite-link tokens, then
// relies exclusively on the partner-activation Edge Function's allowlisted
// get_profile action for every read — no partner_id is ever taken from the
// client, and there is no partner-facing PostgREST policy on any table.
export function PartnerActivation({ onDone }: PartnerActivationProps) {
  const inviteTokens = useMemo(() => getPasswordRecoveryTokensFromLocation(), []);
  const [stage, setStage] = useState<Stage>("adopting");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [partner, setPartner] = useState<PartnerActivationProfilePartner | null>(null);
  const [intake, setIntake] = useState<PartnerActivationProfileIntake | null>(null);

  const [legalFullName, setLegalFullName] = useState("");
  const [legalAddress, setLegalAddress] = useState("");
  const [entityType, setEntityType] = useState<PartnerEntityType | "">("");
  const [authorizedRepresentativeName, setAuthorizedRepresentativeName] = useState("");
  const [preferredCommunicationMethod, setPreferredCommunicationMethod] = useState<
    PartnerCommunicationMethod | ""
  >("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function establishSessionAndLoad() {
      if (inviteTokens?.accessToken) {
        try {
          await adoptSessionFromTokens(inviteTokens);
          window.history.replaceState({}, "", "/partner/activate");
        } catch (adoptError) {
          if (!cancelled) {
            setStatusMessage(
              adoptError instanceof Error ? adoptError.message : "This activation link is invalid or has expired.",
            );
            setStage("invalid");
          }
          return;
        }
      } else {
        const existingSession = await getSession();
        if (cancelled) return;
        if (!existingSession?.access_token) {
          setStage("invalid");
          return;
        }
      }

      if (cancelled) return;
      setStage("loading");

      const touchResult = await touchPartnerActivation();
      if (cancelled) return;
      if (touchResult.error) {
        if (touchResult.error === "invite_revoked") {
          setStage("revoked");
        } else {
          setStatusMessage(touchResult.error);
          setStage("error");
        }
        return;
      }

      const profileResult = await getOwnActivationProfile();
      if (cancelled) return;

      if (profileResult.error || !profileResult.data) {
        setStatusMessage(profileResult.error ?? "Unable to load your partner profile.");
        setStage("error");
        return;
      }

      if (profileResult.data.auth_link.status === "revoked") {
        setStage("revoked");
        return;
      }

      setPartner(profileResult.data.partner);
      setIntake(profileResult.data.intake);

      if (profileResult.data.partner.lifecycle_stage === "profile_completed") {
        setStage("completed");
        return;
      }

      const existingProfile = profileResult.data.onboarding_profile;
      setLegalFullName(existingProfile?.legal_full_name ?? "");
      setLegalAddress(existingProfile?.legal_address ?? "");
      setEntityType(existingProfile?.entity_type ?? "");
      setAuthorizedRepresentativeName(existingProfile?.authorized_representative_name ?? "");
      setPreferredCommunicationMethod(existingProfile?.preferred_communication_method ?? "");

      setStage("form");
    }

    establishSessionAndLoad();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);

    if (!legalFullName.trim()) {
      setSaveError("Legal full name is required.");
      return;
    }
    if (!legalAddress.trim()) {
      setSaveError("Legal / business address is required.");
      return;
    }
    if (entityType !== "individual" && entityType !== "organization") {
      setSaveError("Select whether you are an individual or an organization.");
      return;
    }
    if (entityType === "organization" && !authorizedRepresentativeName.trim()) {
      setSaveError("Authorized representative is required for organization partners.");
      return;
    }
    if (
      preferredCommunicationMethod !== "email" &&
      preferredCommunicationMethod !== "phone" &&
      preferredCommunicationMethod !== "whatsapp"
    ) {
      setSaveError("Select a preferred communication method.");
      return;
    }

    setIsSaving(true);
    const result = await completePartnerActivationProfile({
      legal_full_name: legalFullName.trim(),
      legal_address: legalAddress.trim(),
      entity_type: entityType,
      authorized_representative_name: entityType === "organization" ? authorizedRepresentativeName.trim() : null,
      preferred_communication_method: preferredCommunicationMethod,
    });
    setIsSaving(false);

    if (result.error) {
      setSaveError(
        result.error === "already_completed"
          ? "This partner profile has already been completed."
          : result.error,
      );
      if (result.error === "already_completed") {
        setStage("completed");
      }
      return;
    }

    setStage("completed");
  }

  if (stage === "adopting" || stage === "loading") {
    return (
      <ActivationShell>
        <p className="text-sm text-muted-foreground">Verifying your activation link…</p>
      </ActivationShell>
    );
  }

  if (stage === "invalid") {
    return (
      <ActivationShell>
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {statusMessage ?? "This activation link is invalid or has expired."} Ask your Growth OS
          contact to resend your activation invite.
        </div>
        <Button className="mt-4" type="button" variant="secondary" onClick={onDone}>
          Back to Login
        </Button>
      </ActivationShell>
    );
  }

  if (stage === "revoked") {
    return (
      <ActivationShell>
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          This activation invite has been revoked. Contact your Growth OS representative if you
          believe this is a mistake.
        </div>
        <Button className="mt-4" type="button" variant="secondary" onClick={onDone}>
          Back to Login
        </Button>
      </ActivationShell>
    );
  }

  if (stage === "error") {
    return (
      <ActivationShell>
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {statusMessage ?? "Something went wrong loading your activation."}
        </div>
        <Button className="mt-4" type="button" variant="secondary" onClick={onDone}>
          Back to Login
        </Button>
      </ActivationShell>
    );
  }

  if (stage === "completed") {
    return (
      <ActivationShell>
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          Your partner profile has been completed. Our team will follow up with next steps.
        </div>
        <Button className="mt-4" type="button" variant="secondary" onClick={onDone}>
          Back to Login
        </Button>
      </ActivationShell>
    );
  }

  return (
    <ActivationShell wide>
      <div>
        <h2 className="text-2xl font-semibold text-emerald-950">Review Your Partner Profile</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We've pre-filled the details from your application. Confirm them below and complete the
          remaining fields to finish activating your partner account.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transferred Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <ReadOnlyField label="Partner Name" value={partner?.name ?? "—"} />
          <ReadOnlyField label="Country" value={partner?.country ?? "—"} />
          <ReadOnlyField label="Applicant Name" value={intake?.full_name ?? "—"} />
          <ReadOnlyField label="Email" value={intake?.email ?? "—"} />
          <ReadOnlyField label="Phone" value={intake?.phone ?? "—"} />
          <ReadOnlyField label="Organization" value={intake?.organization_name ?? "—"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="legal-full-name">
                Legal full name
              </label>
              <Input
                id="legal-full-name"
                value={legalFullName}
                onChange={(event) => setLegalFullName(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="legal-address">
                Legal / business address
              </label>
              <Input
                id="legal-address"
                value={legalAddress}
                onChange={(event) => setLegalAddress(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="entity-type">
                Individual or organization
              </label>
              <Select
                id="entity-type"
                value={entityType}
                onChange={(event) => setEntityType(event.target.value as PartnerEntityType)}
                required
              >
                <option value="">Select one…</option>
                <option value="individual">Individual</option>
                <option value="organization">Organization</option>
              </Select>
            </div>

            {entityType === "organization" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="authorized-representative">
                  Authorized representative
                </label>
                <Input
                  id="authorized-representative"
                  value={authorizedRepresentativeName}
                  onChange={(event) => setAuthorizedRepresentativeName(event.target.value)}
                  required
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="preferred-communication">
                Preferred communication method
              </label>
              <Select
                id="preferred-communication"
                value={preferredCommunicationMethod}
                onChange={(event) =>
                  setPreferredCommunicationMethod(event.target.value as PartnerCommunicationMethod)
                }
                required
              >
                <option value="">Select one…</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="whatsapp">WhatsApp</option>
              </Select>
            </div>

            {saveError ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {saveError}
              </div>
            ) : null}

            <Button className="w-full" disabled={isSaving} type="submit">
              {isSaving ? "Saving…" : "Complete Profile"}
            </Button>

            <p className="text-xs leading-5 text-muted-foreground">
              We only collect the details above. No payment, tax, or commission banking
              information is requested here.
            </p>
          </form>
        </CardContent>
      </Card>
    </ActivationShell>
  );
}

function ActivationShell({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className={cn("mx-auto flex w-full flex-col gap-6", wide ? "max-w-2xl" : "max-w-md")}>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            AfraMedico OS Platform
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-emerald-950">Partner Activation</h1>
        </div>
        {children}
      </div>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}
