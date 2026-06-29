import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const actions = [
  "Request Missing Documents",
  "Start Clinical Review",
  "Prepare Hospital Package",
  "Send Hospital Referral",
  "Create Travel Plan",
  "Review Financials",
];

export function CaseActionsPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => (
          <Button key={action} type="button" variant="secondary">
            {action}
          </Button>
        ))}
        <p className="md:col-span-2 xl:col-span-3 text-xs text-muted-foreground">
          Action buttons are placeholders only. No backend writes are enabled in this sprint.
        </p>
      </CardContent>
    </Card>
  );
}
