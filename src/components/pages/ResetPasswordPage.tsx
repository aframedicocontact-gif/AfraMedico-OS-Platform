import { useMemo, useState, type FormEvent } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import {
  getPasswordRecoveryTokensFromLocation,
  updatePasswordWithRecoveryToken,
} from "../../services/authService";

type ResetPasswordPageProps = {
  onComplete: () => void;
};

export function ResetPasswordPage({ onComplete }: ResetPasswordPageProps) {
  const recoveryTokens = useMemo(() => getPasswordRecoveryTokensFromLocation(), []);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatusMessage(null);

    if (!recoveryTokens?.accessToken) {
      setError("Password recovery token is missing. Open the latest Supabase reset email link.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsUpdating(true);

    try {
      await updatePasswordWithRecoveryToken(recoveryTokens.accessToken, newPassword);
      setStatusMessage("Password updated. Returning to login...");
      window.history.replaceState({}, "", "/login");
      window.setTimeout(onComplete, 700);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update password.");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            AfraMedico OS Platform
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-emerald-950">Reset Password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Development password recovery for the Supabase authentication foundation.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Choose New Password</CardTitle>
          </CardHeader>
          <CardContent>
            {!recoveryTokens?.accessToken ? (
              <div className="space-y-4">
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  No recovery token was found in the URL. Open the latest Supabase password reset email link.
                </div>
                <Button type="button" variant="secondary" onClick={onComplete}>
                  Back to Login
                </Button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="new-password">
                    New password
                  </label>
                  <Input
                    autoComplete="new-password"
                    id="new-password"
                    minLength={6}
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="confirm-password">
                    Confirm password
                  </label>
                  <Input
                    autoComplete="new-password"
                    id="confirm-password"
                    minLength={6}
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                  />
                </div>
                {error ? (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}
                {statusMessage ? (
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                    {statusMessage}
                  </div>
                ) : null}
                <Button className="w-full" disabled={isUpdating} type="submit">
                  {isUpdating ? "Updating..." : "Update Password"}
                </Button>
                <p className="text-xs leading-5 text-muted-foreground">
                  This is a minimal development-only recovery handler. It updates the password through Supabase Auth and returns to login.
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
