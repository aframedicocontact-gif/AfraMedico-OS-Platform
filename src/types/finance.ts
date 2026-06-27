export type FinanceRisk = "Low" | "Medium" | "High" | "Critical";

export type InvoiceStatus =
  | "Draft Invoice"
  | "Proforma Sent"
  | "Deposit Requested"
  | "Deposit Received"
  | "Balance Pending"
  | "Fully Paid"
  | "Refund Requested"
  | "Refunded"
  | "Cancelled";

export type PaymentStatus = "Pending" | "Partial" | "Paid" | "Overdue" | "External/Third-party" | "Cancelled";

export type CommissionStatus = "Pending" | "Approved" | "Paid" | "Disputed" | "Split" | "No Commission";

export type FinancialCase = {
  caseId: string;
  patientId: string;
  patient: string;
  country: string;
  treatment: string;
  hospitalId: string;
  hospital: string;
  quoteId: string;
  invoiceId: string;
  commissionId: string;
  quoteAmount: number;
  currency: string;
  patientInvoice: number;
  depositStatus: InvoiceStatus;
  paymentStatus: PaymentStatus;
  hospitalPaymentStatus: PaymentStatus;
  partnerCommission: number;
  commissionOwner: string;
  lifetimePartnerOwner: string;
  financialRisk: FinanceRisk;
  nextAction: string;
  expectedRevenue: number;
  confirmedRevenue: number;
  outstandingBalance: number;
  settlementStatus: string;
};

export type FinanceQuote = {
  quoteId: string;
  caseId: string;
  hospitalId: string;
  hospital: string;
  treatment: string;
  amount: number;
  currency: string;
  accepted: boolean;
  quoteDate: string;
  validUntil: string;
  notes: string;
};

export type Invoice = {
  invoiceId: string;
  caseId: string;
  quoteId: string;
  status: InvoiceStatus;
  amount: number;
  currency: string;
  issuedDate: string;
  dueDate: string;
  depositRequired: number;
  balanceDue: number;
};

export type Payment = {
  paymentId: string;
  caseId: string;
  invoiceId: string;
  type: "Deposit" | "Balance" | "Hospital Payment" | "Refund" | "Travel External";
  status: PaymentStatus;
  amount: number;
  currency: string;
  method: "Bank Transfer" | "Wise" | "Stripe" | "Cash" | "External/Third-party";
  date: string;
  notes: string;
};

export type PartnerCommission = {
  commissionId: string;
  caseId: string;
  partnerId: string;
  partner: string;
  partnerType: string;
  commissionOwner: string;
  commissionRate: number;
  commissionAmount: number;
  aframedicoShare: number;
  hospitalCommission: number;
  splitCommission: boolean;
  manualOverride: boolean;
  overrideReason: string;
  approvedBy: string;
  decisionDate: string;
  status: CommissionStatus;
};

export type PartnerSettlement = {
  partnerId: string;
  partner: string;
  cases: string[];
  totalCommission: number;
  pending: number;
  approved: number;
  paid: number;
  disputed: number;
  nextPaymentDate: string;
};

export type CommissionDispute = {
  id: string;
  caseId: string;
  partner: string;
  issue: string;
  status: "Open" | "Under Review" | "Resolved";
  owner: string;
  evidence: string;
};

export type FinancialAuditEvent = {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  oldValue: string;
  newValue: string;
  reason: string;
  evidence: string;
  relatedCase: string;
  relatedPartner: string;
  relatedHospital: string;
};

export type FinanceData = {
  financialCases: FinancialCase[];
  quotes: FinanceQuote[];
  invoices: Invoice[];
  payments: Payment[];
  partnerCommissions: PartnerCommission[];
  settlements: PartnerSettlement[];
  commissionDisputes: CommissionDispute[];
  auditTrail: FinancialAuditEvent[];
};
