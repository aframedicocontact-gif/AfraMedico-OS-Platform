import {
  AlertTriangle,
  BadgeCheck,
  Clock3,
  FileQuestion,
  FileSearch,
  Inbox,
  Plus,
  Send,
  Stethoscope,
} from "lucide-react";
import type { ReactNode } from "react";
import type { AppView } from "../../app/App";
import type { MedicalReviewRecord } from "../../types/medicalReview";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type MedicalReviewDashboardProps = {
  reviews: MedicalReviewRecord[];
  onNavigate: (view: AppView) => void;
};

export function MedicalReviewDashboard({ reviews, onNavigate }: MedicalReviewDashboardProps) {
  const pending = reviews.filter((review) => review.status === "Pending").length;
  const underReview = reviews.filter((review) => review.status === "Under Review").length;
  const waitingDocuments = reviews.filter((review) => review.status === "Waiting for Documents").length;
  const readyForReferral = reviews.filter((review) => review.status === "Ready for Referral").length;
  const completed = reviews.filter((review) => review.status === "Completed").length;
  const urgent = reviews.filter((review) => review.priority === "Urgent").length;
  const averageReviewTime = Math.round(
    reviews.reduce((total, review) => total + review.reviewTimeHours, 0) / reviews.length,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Medical Review Center</p>
          <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">Clinical Decision Center</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Transform raw case documents into hospital-ready clinical packages for detailed quote requests, specialty matching, and destination recommendations.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "medical-review-queue" })}>
            <Inbox className="h-4 w-4" />
            Open Queue
          </Button>
          <Button type="button" onClick={() => onNavigate({ name: "medical-review-workspace", reviewId: reviews[0]?.id ?? "MR-1001" })}>
            <Plus className="h-4 w-4" />
            Review Workspace
          </Button>
        </div>
      </div>

      <Card className="border-emerald-200 bg-emerald-50/70">
        <CardContent className="p-4">
          <p className="font-semibold text-emerald-950">Medical Review does not block early hospital registration.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Referral Protection may register the patient early with minimum data to preserve commission rights. Medical Review is required before sending a full clinical package or requesting a detailed treatment quote.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <Metric icon={<FileSearch className="h-4 w-4" />} label="Medical Reviews Pending" value={pending} />
        <Metric icon={<Stethoscope className="h-4 w-4" />} label="Under Review" value={underReview} />
        <Metric icon={<FileQuestion className="h-4 w-4" />} label="Waiting for Documents" value={waitingDocuments} />
        <Metric icon={<Send className="h-4 w-4" />} label="Ready for Referral" value={readyForReferral} />
        <Metric icon={<BadgeCheck className="h-4 w-4" />} label="Completed" value={completed} />
        <Metric icon={<AlertTriangle className="h-4 w-4" />} label="Urgent Reviews" value={urgent} />
        <Metric icon={<Clock3 className="h-4 w-4" />} label="Average Review Time" value={`${averageReviewTime}h`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Review Status Command Board</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {["Pending", "Under Review", "Waiting for Documents", "Ready for Referral", "Completed"].map((status) => {
              const count = reviews.filter((review) => review.status === status).length;
              const width = Math.max((count / reviews.length) * 100, count > 0 ? 8 : 0);

              return (
                <button
                  key={status}
                  className="grid w-full gap-2 rounded-md p-2 text-left hover:bg-muted sm:grid-cols-[190px_1fr_36px] sm:items-center"
                  type="button"
                  onClick={() => onNavigate({ name: "medical-review-queue" })}
                >
                  <div className="text-sm font-medium">{status}</div>
                  <div className="h-2 overflow-hidden rounded-full bg-emerald-50">
                    <div className="h-full rounded-full bg-emerald-600" style={{ width: `${width}%` }} />
                  </div>
                  <div className="text-sm font-semibold text-emerald-900">{count}</div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-gradient-to-br from-white to-yellow-50">
          <CardHeader>
            <CardTitle>Clinical Risk Focus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reviews
              .filter((review) => review.priority === "Urgent" || review.priority === "High")
              .slice(0, 4)
              .map((review) => (
                <button
                  key={review.id}
                  className="w-full rounded-md border bg-white p-3 text-left hover:bg-muted"
                  type="button"
                  onClick={() => onNavigate({ name: "medical-review-workspace", reviewId: review.id })}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-emerald-950">{review.patientName}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {review.caseId} | {review.treatment}
                      </p>
                    </div>
                    <PriorityBadge priority={review.priority} />
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">{review.outcome}</p>
                </button>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <Card className="border-emerald-100">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-md bg-emerald-50 p-2 text-emerald-800">{icon}</span>
          <span className="text-xl font-semibold text-emerald-950">{value}</span>
        </div>
        <p className="mt-4 min-h-10 text-sm font-medium text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function PriorityBadge({ priority }: { priority: MedicalReviewRecord["priority"] }) {
  const tone = priority === "Urgent" ? "danger" : priority === "High" ? "warning" : priority === "Medium" ? "gold" : "muted";
  return <Badge tone={tone}>{priority}</Badge>;
}
