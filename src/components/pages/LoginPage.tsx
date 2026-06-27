import { useState, type FormEvent } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { useAuth } from "../../contexts/AuthContext";

type LoginPageProps = {
  onSignedIn: () => void;
};

export function LoginPage({ onSignedIn }: LoginPageProps) {
  const { isAuthenticated, loading, signIn, signOut, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await signIn(email, password);
      onSignedIn();
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Unable to sign in.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            AfraMedico OS Platform
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-emerald-950">Development Login</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Supabase authentication foundation for the development backend only.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isAuthenticated ? "Signed In" : "Sign In"}</CardTitle>
          </CardHeader>
          <CardContent>
            {isAuthenticated ? (
              <div className="space-y-4">
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
                  Signed in as {user?.email ?? "development user"}.
                </div>
                <div className="flex gap-2">
                  <Button type="button" onClick={onSignedIn}>
                    Open Mission Control
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => void signOut()}>
                    Sign Out
                  </Button>
                </div>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="email">
                    Email
                  </label>
                  <Input
                    autoComplete="email"
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="password">
                    Password
                  </label>
                  <Input
                    autoComplete="current-password"
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </div>
                {error ? (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}
                <Button className="w-full" disabled={loading} type="submit">
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
                <p className="text-xs leading-5 text-muted-foreground">
                  Development login only. Organization linking, role enforcement, and production access controls are not fully enabled yet.
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
