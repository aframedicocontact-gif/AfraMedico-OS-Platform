import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useAuth } from "../../contexts/AuthContext";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Checking access</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Preparing the development session.</p>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Login Required</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This area will require Supabase authentication. During Phase 2, the app remains usable while protected routing is introduced gradually.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
