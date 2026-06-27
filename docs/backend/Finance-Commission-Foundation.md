# Finance & Commission Foundation

## Purpose

Backend Sprint 6 creates the Finance & Commission Foundation for AfraMedico OS Platform.

Finance belongs to the Case. A Patient may have multiple Cases, and each Case may have its own quotes, invoices, payments, hospital payment records, partner commissions, disputes, settlements, and audit events.

This sprint creates database structure only. It does not add Stripe, Wise, bank transfer APIs, accounting exports, tax logic, payment processing, or frontend changes.

## Architecture

Tables created:

- `case_financials`
- `patient_invoices`
- `invoice_items`
- `patient_payments`
- `hospital_payment_records`
- `partner_commissions`
- `commission_splits`
- `commission_disputes`
- `partner_settlements`
- `financial_audit_events`

Every table includes `organization_id`.

Every table enables Row Level Security.

Finance records link back to stable operational entities:

- Case
- Patient
- Hospital Quote
- Provider
- Partner
- Hospital Referral
- Invoice
- Payment
- Commission
- User

## Workflow

The financial workflow is:

1. A Case receives a `case_financials` summary.
2. An accepted hospital quote may become the financial baseline.
3. A patient invoice is created in `patient_invoices`.
4. Invoice line items are stored in `invoice_items`.
5. Patient payments are tracked in `patient_payments`.
6. Hospital payment obligations are tracked separately in `hospital_payment_records`.
7. Partner commissions are calculated in `partner_commissions`.
8. Split commissions are recorded in `commission_splits`.
9. Disputes are managed through `commission_disputes`.
10. Partner payout periods are tracked in `partner_settlements`.
11. Important financial changes are appended to `financial_audit_events`.

## Entity Relationships

`case_financials` links one financial summary to one Case.

`patient_invoices` link a Case and Patient to an invoice and optionally to an accepted Hospital Quote.

`invoice_items` belong to a Patient Invoice.

`patient_payments` belong to an Invoice and preserve Case and Patient context.

`hospital_payment_records` belong to a Case and Provider, and may link to a Hospital Quote.

`partner_commissions` belong to a Case and Partner. They may link to a Hospital Referral when referral protection context exists.

`commission_splits` belong to a Partner Commission.

`commission_disputes` belong to a Partner Commission, Case, and Partner.

`partner_settlements` summarize commission payout periods for a Partner.

`financial_audit_events` can link to Case, Invoice, Payment, Commission, and User.

## Business Rules

- Finance belongs to Case.
- Patient may have multiple Cases.
- Each Case may have multiple Quotes.
- Accepted Quote becomes financial baseline.
- Invoice should be linked to accepted Quote when available.
- Patient payments may be partial.
- Hospital payment records are tracked separately from patient payments.
- Commission should connect to Partner Attribution and Referral Protection where possible.
- Partner commission owner may differ only with admin or finance reason.
- Commission changes must create audit history.
- Financial history must never be overwritten.
- Refunds, disputes, overrides, and settlements must be traceable.
- AfraMedico should not become merchant of record for optional third-party travel services unless explicitly contracted.
- Travel, hotel, and flight payments should be marked as external or third-party when applicable.

## Relationship To Hospital Quotes

Hospital Quotes come from the Hospital Referral Foundation.

`case_financials.accepted_quote_id` and `patient_invoices.accepted_quote_id` may point to the accepted Hospital Quote.

`hospital_payment_records.quote_id` may link hospital payment obligations to the relevant Quote.

The Quote remains the clinical/provider financial source. The invoice becomes the patient-facing financial record.

## Relationship To Partner Attribution And Referral Protection

`partner_commissions.partner_id` links commission calculation to a Partner.

`partner_commissions.commission_owner_id` allows the commission owner to differ from the original Partner when an admin or finance decision requires it.

`partner_commissions.hospital_referral_id` allows commission records to connect to referral protection context where available.

Every override should be supported by:

- `override_reason`
- approval fields
- `financial_audit_events`

Future attribution and referral protection migrations may add deeper ownership history and attribution evidence links.

## External Payment Principle

ICOS records financial coordination.

ICOS does not become a payment processor in this sprint.

Optional travel, hotel, flight, visa, and other third-party services should be clearly marked using:

- `invoice_items.is_third_party`
- `invoice_items.third_party_provider`
- external payment statuses and references

This protects AfraMedico from accidentally becoming merchant of record for optional third-party services.

## RLS Rules

All tables enable Row Level Security.

Policies restrict access using:

`organization_id = public.current_organization_id()`

`financial_audit_events` is append-only by policy. Organization members can select and insert audit events, but normal RLS policies do not allow update or delete.

## Future Stripe, Wise, And Bank Transfer Integrations

Future payment integrations may include:

- Stripe payment links.
- Wise transfers.
- Bank transfer reconciliation.
- Hospital payment portal references.
- Partner payout automation.
- Refund workflows.

These integrations should write references and status updates into ICOS while preserving audit history.

## Future Accounting Export

Future accounting workflows may add:

- journal export tables
- accounting system mapping
- invoice export status
- payment reconciliation status
- partner payout export
- hospital payable export

## Future Tax / HST / GST Logic

Future tax migrations may add:

- tax jurisdiction rules
- HST/GST applicability
- exempt services
- tax-inclusive and tax-exclusive invoice logic
- country-specific finance reporting

Tax logic should remain separate from the core financial history tables.

## Sprint Boundary

This sprint does not add:

- React UI changes.
- Frontend JSON changes.
- Seed data.
- Stripe.
- Wise.
- Bank APIs.
- Accounting exports.
- Tax calculation.
- Payment processing.
- External integrations.
