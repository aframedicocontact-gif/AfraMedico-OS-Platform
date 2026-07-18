import { useEffect, useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { cn } from "../../lib/utils";
import { verifyPartnerAgreement, type PartnerAgreementVerification } from "../../services/partnerAgreementVerifyService";

type PartnerAgreementVerifyProps = { code: string };

type Stage = "loading" | "found" | "not_found" | "error";

// Fully public route (no auth, no AppShell) — calls the verify-agreement Edge
// Function directly with only the opaque code from the URL. Renders exactly
// the allowlisted fields the function returns; never fetches or displays
// anything else about the agreement or partner.
export function PartnerAgreementVerify({ code }: PartnerAgreementVerifyProps) {
  const [stage, setStage] = useState<Stage>("loading");
  const [result, setResult] = useState<PartnerAgreementVerification | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setStage("loading");
      const response = await verifyPartnerAgreement(code);
      if (cancelled) return;

      if (response.error) {
        if (response.error === "not_found") {
          setStage("not_found");
        } else {
          setErrorMessage(response.error);
          setStage("error");
        }
        return;
      }

      setResult(response.data);
      setStage("found");
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [code]);

  return (
    <VerifyShell>
      <Card>
        <CardHeader>
          <CardTitle>Agreement Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stage === "loading" ? (
            <p className="text-sm text-muted-foreground">Verifying…</p>
          ) : null}

          {stage === "not_found" ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              No agreement was found for this verification code.
            </div>
          ) : null}

          {stage === "error" ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errorMessage ?? "Unable to verify this code right now."}
            </div>
          ) : null}

          {stage === "found" && result ? (
            <>
              <StatusBadge status={result.status} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Contract ID" value={result.contract_id ?? "—"} />
                <Field label="Agreement Version" value={result.agreement_version} />
                <Field label="Execution Date" value={formatDate(result.execution_date)} />
                <Field label="Partner Organization" value={result.partner_organization_name ?? "—"} />
                <Field label="AfraMedico Entity" value={result.aframedico_organization_name} />
                <Field label="Signed PDF SHA-256" value={result.final_pdf_sha256 ?? "—"} mono />
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </VerifyShell>
  );
}

function StatusBadge({ status }: { status: PartnerAgreementVerification["status"] }) {
  const config = {
    valid: { label: "Valid — Fully Executed", className: "border-emerald-200 bg-emerald-50 text-emerald-800" },
    superseded: { label: "Superseded by a Later Agreement", className: "border-amber-200 bg-amber-50 text-amber-800" },
    void: { label: "Void / Not Executed", className: "border-red-200 bg-red-50 text-red-700" },
  }[status];

  return (
    <div className={cn("rounded-md border p-3 text-sm font-medium", config.className)}>{config.label}</div>
  );
}

function Field({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <div className={cn("mt-1 text-sm break-all", mono ? "font-mono text-xs" : undefined)}>{value}</div>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function VerifyShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">AfraMedico OS Platform</p>
          <h1 className="mt-2 text-3xl font-semibold text-emerald-950">Verify Partner Agreement</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This page confirms whether a partner agreement was fully executed by AfraMedico, using only
            the verification code printed on the signed document.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
