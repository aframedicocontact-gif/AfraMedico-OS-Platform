import {
  AlertTriangle,
  Banknote,
  CircleDollarSign,
  FileText,
  HandCoins,
  Receipt,
  Scale,
  ShieldAlert,
} from "lucide-react";
import type { ReactNode } from "react";
import type { AppView } from "../../app/App";
import type {
  FinanceData,
  FinanceRisk,
  FinancialCase,
  InvoiceStatus,
  PaymentStatus,
} from "../../types/finance";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

type FinancePage =
  | "dashboard"
  | "queue"
  | "workspace"
  | "invoice-tracker"
  | "commission-engine"
  | "partner-settlement"
  | "revenue-protection"
  | "audit-trail";

type FinanceProps = {
  data: FinanceData;
  page: FinancePage;
  caseId?: string;
  onNavigate: (view: AppView) => void;
};

const financePages: Array<{ label: string; view: AppView }> = [
  { label: "Dashboard", view: { name: "finance-dashboard" } },
  { label: "Case Queue", view: { name: "finance-case-queue" } },
  { label: "Case Workspace", view: { name: "finance-case-workspace", caseId: "CASE-2026-000001" } },
  { label: "Invoice Tracker", view: { name: "finance-invoice-tracker" } },
  { label: "Commission Engine", view: { name: "finance-commission-engine" } },
  { label: "Partner Settlement", view: { name: "finance-partner-settlement" } },
  { label: "Revenue Protection", view: { name: "finance-revenue-protection" } },
  { label: "Audit Trail", view: { name: "finance-audit-trail" } },
];

export function FinanceCommissionCenter({ data, page, caseId, onNavigate }: FinanceProps) {
  const selectedCase = data.financialCases.find((item) => item.caseId === caseId) ?? data.financialCases[0];

  return (
    <div className="space-y-6">
      <FinanceHeader page={page} selectedCase={selectedCase} onNavigate={onNavigate} />
      {page === "dashboard" ? <FinanceDashboard data={data} onNavigate={onNavigate} /> : null}
      {page === "queue" ? <CaseFinancialQueue data={data} onNavigate={onNavigate} /> : null}
      {page === "workspace" ? <CaseFinanceWorkspace data={data} financialCase={selectedCase} onNavigate={onNavigate} /> : null}
      {page === "invoice-tracker" ? <InvoicePaymentTracker data={data} /> : null}
      {page === "commission-engine" ? <CommissionEngine data={data} onNavigate={onNavigate} /> : null}
      {page === "partner-settlement" ? <PartnerSettlement data={data} /> : null}
      {page === "revenue-protection" ? <RevenueProtection data={data} onNavigate={onNavigate} /> : null}
      {page === "audit-trail" ? <FinancialAuditTrail data={data} /> : null}
    </div>
  );
}

function FinanceHeader({ page, selectedCase, onNavigate }: { page: FinancePage; selectedCase: FinancialCase; onNavigate: (view: AppView) => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 p-5 text-white shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-yellow-200">Finance & Commission Center</p>
            <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">{pageTitle(page)}</h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-emerald-50">
              Manage quote baseline, invoices, deposits, hospital payments, AfraMedico margin, partner commissions, settlements, disputes, and audit evidence at Case level.
            </p>
          </div>
          <Badge className="bg-yellow-100 text-yellow-950 ring-1 ring-yellow-200">Finance belongs to Case</Badge>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white p-2 shadow-sm">
        <div className="flex min-w-max gap-2">
          {financePages.map((item) => {
            const active = currentPageName(page) === item.view.name;
            return (
              <Button
                key={item.label}
                className={active ? "" : "bg-white text-emerald-950 ring-1 ring-border hover:bg-emerald-50"}
                type="button"
                variant={active ? "primary" : "ghost"}
                onClick={() => onNavigate(item.view)}
              >
                {item.label}
              </Button>
            );
          })}
        </div>
      </div>

      {page === "workspace" ? (
        <Card>
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Selected financial case</p>
              <p className="mt-1 font-semibold text-emerald-950">{selectedCase.caseId} | {selectedCase.patient}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "case-profile", caseId: "CASE-1001-CARDIAC" })}>Open Case Workspace</Button>
              <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "protection-dashboard" })}>Open Referral Protection</Button>
              <Button variant="secondary" type="button" onClick={() => onNavigate({ name: "operations-work-items" })}>Create Finance Task</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function FinanceDashboard({ data, onNavigate }: { data: FinanceData; onNavigate: (view: AppView) => void }) {
  const totalExpected = sum(data.financialCases, "expectedRevenue");
  const confirmed = sum(data.financialCases, "confirmedRevenue");
  const outstanding = sum(data.financialCases, "outstandingBalance");
  const pendingRevenue = totalExpected - confirmed;
  const hospitalPending = data.financialCases.filter((item) => item.hospitalPaymentStatus === "Pending").length;
  const commissionsPending = data.partnerCommissions.filter((item) => item.status === "Pending").length;
  const disputed = data.partnerCommissions.filter((item) => item.status === "Disputed").length;
  const paidCommissions = data.partnerCommissions.filter((item) => item.status === "Paid").length;
  const awaitingDeposit = data.financialCases.filter((item) => item.depositStatus === "Deposit Requested" || item.depositStatus === "Proforma Sent").length;
  const readySettlement = data.financialCases.filter((item) => item.settlementStatus.toLowerCase().includes("ready")).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard icon={<CircleDollarSign />} label="Total Expected Revenue" value={money(totalExpected)} helper="Projected AfraMedico revenue" />
        <MetricCard icon={<Banknote />} label="Confirmed Revenue" value={money(confirmed)} helper="Revenue confirmed by payments" tone="success" />
        <MetricCard icon={<Receipt />} label="Pending Revenue" value={money(pendingRevenue)} helper="Expected but not confirmed" tone="warning" />
        <MetricCard icon={<AlertTriangle />} label="Outstanding Patient Payments" value={money(outstanding)} helper="Open patient balance" tone="danger" />
        <MetricCard icon={<Banknote />} label="Hospital Payments Pending" value={hospitalPending} helper="Cases waiting hospital payment" tone="warning" />
        <MetricCard icon={<HandCoins />} label="Partner Commissions Pending" value={commissionsPending} helper="Awaiting approval/payment" />
        <MetricCard icon={<ShieldAlert />} label="Disputed Commissions" value={disputed} helper="Needs manager decision" tone="danger" />
        <MetricCard icon={<HandCoins />} label="Paid Commissions" value={paidCommissions} helper="Settled partner payouts" tone="success" />
        <MetricCard icon={<FileText />} label="Cases Awaiting Deposit" value={awaitingDeposit} helper="Deposit still needed" tone="warning" />
        <MetricCard icon={<Scale />} label="Cases Ready for Settlement" value={readySettlement} helper="Can move to settlement" tone="gold" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Financial Case Queue Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.financialCases.map((item) => (
              <button key={item.caseId} className="w-full rounded-lg border bg-white p-4 text-left hover:border-emerald-300 hover:bg-emerald-50" type="button" onClick={() => onNavigate({ name: "finance-case-workspace", caseId: item.caseId })}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-emerald-950">{item.caseId} | {item.patient}</p>
                    <p className="text-sm text-muted-foreground">{item.treatment} at {item.hospital}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <RiskBadge risk={item.financialRisk} />
                    <InvoiceStatusBadge status={item.depositStatus} />
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Finance Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Accepted Quote becomes the financial baseline.",
              "Invoice should be linked to the accepted Quote.",
              "Commission must connect to Partner Attribution and Referral Protection.",
              "Commission Owner changes require reason and audit trail.",
              "Optional travel payments must be marked external/third-party unless explicitly contracted.",
            ].map((item) => (
              <div key={item} className="rounded-md border bg-slate-50 p-3 text-sm text-emerald-950">{item}</div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Future Finance Integrations</CardTitle>
          <p className="text-sm text-muted-foreground">
            Placeholders only. Sprint 6 remains frontend-only with local JSON.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            "Stripe",
            "Wise",
            "Bank Transfer",
            "Hospital Payment Portal",
            "Partner Payout",
            "Currency Conversion",
            "Tax / HST / GST Logic",
            "Refund Workflow",
          ].map((item) => (
            <div key={item} className="rounded-lg border bg-slate-50 px-4 py-3 text-sm font-medium text-emerald-950">
              {item}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function CaseFinancialQueue({ data, onNavigate }: { data: FinanceData; onNavigate: (view: AppView) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Case Financial Queue</CardTitle>
        <p className="text-sm text-muted-foreground">Every row is a Case-level financial lifecycle record.</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="min-w-[1500px]">
            <TableHeader>
              <TableRow className="bg-emerald-50/70">
                <TableHead>Case ID</TableHead><TableHead>Patient</TableHead><TableHead>Country</TableHead><TableHead>Treatment</TableHead><TableHead>Hospital</TableHead><TableHead>Quote Amount</TableHead><TableHead>Patient Invoice</TableHead><TableHead>Deposit Status</TableHead><TableHead>Payment Status</TableHead><TableHead>Hospital Payment</TableHead><TableHead>Partner Commission</TableHead><TableHead>Commission Owner</TableHead><TableHead>Risk</TableHead><TableHead>Next Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.financialCases.map((item) => (
                <TableRow key={item.caseId} className="cursor-pointer" onClick={() => onNavigate({ name: "finance-case-workspace", caseId: item.caseId })}>
                  <TableCell className="font-medium text-emerald-950">{item.caseId}</TableCell><TableCell>{item.patient}</TableCell><TableCell>{item.country}</TableCell><TableCell>{item.treatment}</TableCell><TableCell>{item.hospital}</TableCell><TableCell>{money(item.quoteAmount)}</TableCell><TableCell>{money(item.patientInvoice)}</TableCell><TableCell><InvoiceStatusBadge status={item.depositStatus} /></TableCell><TableCell><PaymentStatusBadge status={item.paymentStatus} /></TableCell><TableCell><PaymentStatusBadge status={item.hospitalPaymentStatus} /></TableCell><TableCell>{money(item.partnerCommission)}</TableCell><TableCell>{item.commissionOwner}</TableCell><TableCell><RiskBadge risk={item.financialRisk} /></TableCell><TableCell className="max-w-96">{item.nextAction}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function CaseFinanceWorkspace({ data, financialCase, onNavigate }: { data: FinanceData; financialCase: FinancialCase; onNavigate: (view: AppView) => void }) {
  const quote = data.quotes.find((item) => item.quoteId === financialCase.quoteId);
  const invoice = data.invoices.find((item) => item.invoiceId === financialCase.invoiceId);
  const commission = data.partnerCommissions.find((item) => item.commissionId === financialCase.commissionId);
  const payments = data.payments.filter((item) => item.caseId === financialCase.caseId);
  const audit = data.auditTrail.filter((item) => item.relatedCase === financialCase.caseId);
  const dispute = data.commissionDisputes.find((item) => item.caseId === financialCase.caseId);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-2">
        <Card><CardHeader><CardTitle>Case Summary</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><Field label="Case" value={financialCase.caseId} /><Field label="Patient" value={financialCase.patient} /><Field label="Treatment" value={financialCase.treatment} /><Field label="Hospital" value={financialCase.hospital} /><Field label="Country" value={financialCase.country} /><Field label="Financial Risk" value={financialCase.financialRisk} /></CardContent></Card>
        <Card><CardHeader><CardTitle>AfraMedico Margin</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><Field label="Expected Revenue" value={money(financialCase.expectedRevenue)} /><Field label="Confirmed Revenue" value={money(financialCase.confirmedRevenue)} /><Field label="Outstanding Balance" value={money(financialCase.outstandingBalance)} /><Field label="Settlement Status" value={financialCase.settlementStatus} /></CardContent></Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <InfoCard title="Patient Invoice" rows={[["Invoice", invoice?.invoiceId], ["Status", invoice?.status], ["Amount", invoice ? money(invoice.amount) : undefined], ["Due", invoice?.dueDate]]} />
        <InfoCard title="Hospital Quote" rows={[["Quote", quote?.quoteId], ["Accepted", quote?.accepted ? "Yes" : "No"], ["Amount", quote ? money(quote.amount) : undefined], ["Valid Until", quote?.validUntil]]} />
        <InfoCard title="Deposit Tracking" rows={[["Deposit Required", invoice ? money(invoice.depositRequired) : undefined], ["Deposit Status", financialCase.depositStatus], ["Balance Due", invoice ? money(invoice.balanceDue) : undefined], ["Payment Status", financialCase.paymentStatus]]} />
        <InfoCard title="Hospital Payment" rows={[["Hospital", financialCase.hospital], ["Payment Status", financialCase.hospitalPaymentStatus], ["Hospital ID", financialCase.hospitalId], ["Quote ID", financialCase.quoteId]]} />
        <InfoCard title="Partner Commission" rows={[["Partner", commission?.partner], ["Rate", commission ? `${commission.commissionRate}%` : undefined], ["Commission", commission ? money(commission.commissionAmount) : undefined], ["Status", commission?.status]]} />
        <InfoCard title="Commission Owner" rows={[["Owner", financialCase.commissionOwner], ["Lifetime Owner", financialCase.lifetimePartnerOwner], ["Manual Override", commission?.manualOverride ? "Yes" : "No"], ["Reason", commission?.overrideReason]]} />
      </div>

      <Card>
        <CardHeader><CardTitle>Payment Schedule</CardTitle></CardHeader>
        <CardContent className="space-y-3">{payments.map((payment) => <div key={payment.paymentId} className="rounded-md border bg-slate-50 p-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium text-emerald-950">{payment.paymentId} | {payment.type}</span><PaymentStatusBadge status={payment.status} /></div><p className="mt-1 text-muted-foreground">{money(payment.amount)} via {payment.method} | {payment.notes}</p></div>)}</CardContent>
      </Card>

      {dispute ? <Card><CardHeader><CardTitle>Commission Dispute</CardTitle></CardHeader><CardContent><div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-950"><p className="font-semibold">{dispute.issue}</p><p className="mt-1">Owner: {dispute.owner} | Status: {dispute.status}</p><p className="mt-1">Evidence: {dispute.evidence}</p></div></CardContent></Card> : null}

      <Card><CardHeader><CardTitle>Audit Trail</CardTitle></CardHeader><CardContent className="space-y-3">{audit.map((event) => <AuditEvent key={event.id} event={event} />)}</CardContent></Card>
    </div>
  );
}

function InvoicePaymentTracker({ data }: { data: FinanceData }) {
  return <ScrollableTable title="Invoice & Payment Tracker" description="Tracks invoice lifecycle from draft to refund/cancelled states." minWidth="1200px" headers={["Invoice", "Case", "Quote", "Status", "Amount", "Issued", "Due", "Deposit", "Balance"]} rows={data.invoices.map((item) => [item.invoiceId, item.caseId, item.quoteId, <InvoiceStatusBadge key="s" status={item.status} />, money(item.amount), item.issuedDate, item.dueDate, money(item.depositRequired), money(item.balanceDue)])} />;
}

function CommissionEngine({ data, onNavigate }: { data: FinanceData; onNavigate: (view: AppView) => void }) {
  return <ScrollableTable title="Commission Engine" description="Commission Owner changes are visual-only here, but every future override must require reason and audit trail." minWidth="1500px" headers={["Commission", "Case", "Owner", "Partner", "Partner Type", "Rate", "Amount", "AfraMedico Share", "Hospital Commission", "Split", "Manual Override", "Reason", "Approved By", "Decision Date", "Status"]} rows={data.partnerCommissions.map((item) => [item.commissionId, item.caseId, item.commissionOwner, item.partner, item.partnerType, `${item.commissionRate}%`, money(item.commissionAmount), money(item.aframedicoShare), money(item.hospitalCommission), item.splitCommission ? "Yes" : "No", item.manualOverride ? "Yes" : "No", item.overrideReason, item.approvedBy, item.decisionDate, <Badge key="s" tone={item.status === "Disputed" ? "danger" : item.status === "Paid" || item.status === "Approved" ? "success" : "warning"}>{item.status}</Badge>])} onRowClick={(index) => onNavigate({ name: "finance-case-workspace", caseId: data.partnerCommissions[index].caseId })} />;
}

function PartnerSettlement({ data }: { data: FinanceData }) {
  return <ScrollableTable title="Partner Settlement" description="Settlement readiness by partner and case portfolio." minWidth="1100px" headers={["Partner", "Cases", "Total Commission", "Pending", "Approved", "Paid", "Disputed", "Next Payment Date"]} rows={data.settlements.map((item) => [item.partner, item.cases.join(", "), money(item.totalCommission), money(item.pending), money(item.approved), money(item.paid), money(item.disputed), item.nextPaymentDate])} />;
}

function RevenueProtection({ data, onNavigate }: { data: FinanceData; onNavigate: (view: AppView) => void }) {
  const disputed = data.commissionDisputes.length;
  const missingInvoice = data.financialCases.filter((item) => !item.invoiceId).length;
  const missingOwner = data.financialCases.filter((item) => !item.commissionOwner).length;
  const unprotectedRisk = data.financialCases.filter((item) => item.financialRisk === "High" || item.financialRisk === "Critical").length;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<ShieldAlert />} label="Referral Protected Cases" value={data.financialCases.length - unprotectedRisk} helper="Finance linked to protection evidence" />
        <MetricCard icon={<AlertTriangle />} label="Unprotected Financial Risk" value={unprotectedRisk} helper="High or critical finance risk" tone="danger" />
        <MetricCard icon={<Scale />} label="Duplicate Ownership Review" value={disputed} helper="Commission conflict reviews" tone="warning" />
        <MetricCard icon={<HandCoins />} label="Commission Disputes" value={disputed} helper="Open or under review" tone="danger" />
        <MetricCard icon={<Banknote />} label="Hospital Payment Risk" value={data.financialCases.filter((item) => item.hospitalPaymentStatus === "Pending").length} helper="Hospital payment pending" tone="warning" />
        <MetricCard icon={<Receipt />} label="Cases Missing Invoice" value={missingInvoice} helper="Should remain zero" tone={missingInvoice ? "danger" : "success"} />
        <MetricCard icon={<HandCoins />} label="Cases Missing Commission Owner" value={missingOwner} helper="Should remain zero" tone={missingOwner ? "danger" : "success"} />
      </div>
      <Card><CardHeader><CardTitle>Revenue Protection Actions</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2"><Button onClick={() => onNavigate({ name: "duplicate-review" })}>Open Duplicate Review</Button><Button variant="secondary" onClick={() => onNavigate({ name: "protection-dashboard" })}>Open Referral Protection</Button><Button variant="secondary" onClick={() => onNavigate({ name: "finance-commission-engine" })}>Open Commission Engine</Button></CardContent></Card>
    </div>
  );
}

function FinancialAuditTrail({ data }: { data: FinanceData }) {
  return <Card><CardHeader><CardTitle>Financial Audit Trail</CardTitle><p className="text-sm text-muted-foreground">Every financial action preserves timestamp, user, action, reason, evidence, case, partner, and hospital.</p></CardHeader><CardContent className="space-y-3">{data.auditTrail.map((event) => <AuditEvent key={event.id} event={event} />)}</CardContent></Card>;
}

function ScrollableTable({ title, description, headers, rows, minWidth, onRowClick }: { title: string; description: string; headers: string[]; rows: ReactNode[][]; minWidth: string; onRowClick?: (index: number) => void }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle><p className="text-sm text-muted-foreground">{description}</p></CardHeader><CardContent><div className="overflow-x-auto"><Table style={{ minWidth }}><TableHeader><TableRow className="bg-emerald-50/70">{headers.map((header) => <TableHead key={header}>{header}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.map((row, index) => <TableRow key={index} className={onRowClick ? "cursor-pointer" : undefined} onClick={() => onRowClick?.(index)}>{row.map((cell, cellIndex) => <TableCell key={cellIndex}>{cell}</TableCell>)}</TableRow>)}</TableBody></Table></div></CardContent></Card>;
}

function InfoCard({ title, rows }: { title: string; rows: Array<[string, string | undefined]> }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent className="space-y-2">{rows.map(([label, value]) => <Field key={label} label={label} value={value ?? "Pending"} />)}</CardContent></Card>;
}

function MetricCard({ icon, label, value, helper, tone = "success" }: { icon: ReactNode; label: string; value: number | string; helper: string; tone?: "success" | "warning" | "danger" | "gold" }) {
  const toneClass = { success: "bg-emerald-50 text-emerald-700", warning: "bg-amber-50 text-amber-700", danger: "bg-rose-50 text-rose-700", gold: "bg-yellow-50 text-yellow-700" }[tone];
  return <Card><CardContent className="flex gap-4 p-5"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneClass}`}><span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span></div><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold text-emerald-950">{value}</p><p className="mt-1 text-xs text-muted-foreground">{helper}</p></div></CardContent></Card>;
}

function Field({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border bg-slate-50 px-3 py-2"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium text-emerald-950">{value}</p></div>;
}

function AuditEvent({ event }: { event: FinanceData["auditTrail"][number] }) {
  return <div className="rounded-lg border bg-white p-4"><div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>{event.timestamp}</span><Badge tone="info">{event.user}</Badge><Badge tone="muted">{event.relatedCase}</Badge></div><p className="mt-2 text-sm font-semibold text-emerald-950">{event.action}</p><p className="mt-1 text-sm text-muted-foreground">Old: {event.oldValue} | New: {event.newValue}</p><p className="mt-1 text-sm text-muted-foreground">Reason: {event.reason}</p><p className="mt-1 text-sm text-muted-foreground">Evidence: {event.evidence} | Partner: {event.relatedPartner} | Hospital: {event.relatedHospital}</p></div>;
}

function RiskBadge({ risk }: { risk: FinanceRisk }) {
  const tone = risk === "Critical" ? "danger" : risk === "High" ? "warning" : risk === "Medium" ? "gold" : "success";
  return <Badge tone={tone}>{risk}</Badge>;
}

function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const tone = status === "Fully Paid" || status === "Deposit Received" ? "success" : status === "Refund Requested" || status === "Cancelled" ? "danger" : status === "Balance Pending" || status === "Deposit Requested" ? "warning" : "info";
  return <Badge tone={tone}>{status}</Badge>;
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const tone = status === "Paid" ? "success" : status === "Overdue" ? "danger" : status === "External/Third-party" ? "gold" : status === "Pending" || status === "Partial" ? "warning" : "muted";
  return <Badge tone={tone}>{status}</Badge>;
}

function sum(items: FinancialCase[], key: keyof Pick<FinancialCase, "expectedRevenue" | "confirmedRevenue" | "outstandingBalance">) {
  return items.reduce((total, item) => total + Number(item[key]), 0);
}

function money(value: number) {
  return `$${value.toLocaleString("en-US")}`;
}

function pageTitle(page: FinancePage) {
  const titles: Record<FinancePage, string> = {
    dashboard: "Finance Dashboard",
    queue: "Case Financial Queue",
    workspace: "Case Finance Workspace",
    "invoice-tracker": "Invoice & Payment Tracker",
    "commission-engine": "Commission Engine",
    "partner-settlement": "Partner Settlement",
    "revenue-protection": "Revenue Protection",
    "audit-trail": "Financial Audit Trail",
  };
  return titles[page];
}

function currentPageName(page: FinancePage): AppView["name"] {
  const names: Record<FinancePage, AppView["name"]> = {
    dashboard: "finance-dashboard",
    queue: "finance-case-queue",
    workspace: "finance-case-workspace",
    "invoice-tracker": "finance-invoice-tracker",
    "commission-engine": "finance-commission-engine",
    "partner-settlement": "finance-partner-settlement",
    "revenue-protection": "finance-revenue-protection",
    "audit-trail": "finance-audit-trail",
  };
  return names[page];
}
