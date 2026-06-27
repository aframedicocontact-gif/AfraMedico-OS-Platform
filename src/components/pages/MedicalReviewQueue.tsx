import { ArrowLeft, Search, Stethoscope } from "lucide-react";
import type { AppView } from "../../app/App";
import type { MedicalReviewRecord } from "../../types/medicalReview";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

type MedicalReviewQueueProps = {
  reviews: MedicalReviewRecord[];
  onNavigate: (view: AppView) => void;
};

export function MedicalReviewQueue({ reviews, onNavigate }: MedicalReviewQueueProps) {
  return (
    <div className="space-y-5">
      <div>
        <Button
          variant="ghost"
          className="-ml-3 mb-2"
          type="button"
          onClick={() => onNavigate({ name: "medical-review-dashboard" })}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Medical Review Center</p>
            <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">Medical Review Queue</h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Prioritize case-level reviews and move complete medical packages toward hospital referral.
            </p>
          </div>
          <Button type="button" onClick={() => onNavigate({ name: "medical-review-workspace", reviewId: reviews[0]?.id ?? "MR-1001" })}>
            <Stethoscope className="h-4 w-4" />
            Open First Review
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <label className="relative block max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              className="h-10 w-full rounded-md border bg-white pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Search case, patient, treatment, reviewer"
              type="search"
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table className="min-w-[1080px]">
            <TableHeader>
              <TableRow className="bg-emerald-50/70">
                <TableHead>Case ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Treatment</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assigned Reviewer</TableHead>
                <TableHead>Submission Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="font-medium text-emerald-950">{review.caseId}</TableCell>
                  <TableCell>{review.patientName}</TableCell>
                  <TableCell>{review.country}</TableCell>
                  <TableCell>{review.treatment}</TableCell>
                  <TableCell><PriorityBadge priority={review.priority} /></TableCell>
                  <TableCell>{review.assignedReviewer}</TableCell>
                  <TableCell>{review.submissionDate}</TableCell>
                  <TableCell><StatusBadge status={review.status} /></TableCell>
                  <TableCell>
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => onNavigate({ name: "medical-review-workspace", reviewId: review.id })}
                    >
                      Open Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: MedicalReviewRecord["priority"] }) {
  const tone = priority === "Urgent" ? "danger" : priority === "High" ? "warning" : priority === "Medium" ? "gold" : "muted";
  return <Badge tone={tone}>{priority}</Badge>;
}

function StatusBadge({ status }: { status: MedicalReviewRecord["status"] }) {
  const tone =
    status === "Completed" || status === "Ready for Referral"
      ? "success"
      : status === "Under Review"
        ? "info"
        : status === "Waiting for Documents"
          ? "warning"
          : "muted";
  return <Badge tone={tone}>{status}</Badge>;
}
