# Healthcare Provider Network (HPN) Architecture

AfraMedico Intelligent Care Operating System (ICOS)

This document defines the Healthcare Provider Network (HPN) architecture for AfraMedico ICOS.

HPN is a case-driven knowledge base. It is not a manually overbuilt hospital directory.

The provider database should grow from real cases, real referrals, real MSO responses, real quotes, and real operational experience.

The system should learn from every interaction. Every Case enriches the Provider Network.

Knowledge is accumulated through operational experience rather than manual data entry.

This is living architecture documentation and should evolve with the software.

## Mission

Healthcare Provider Network (HPN) gives AfraMedico a structured way to learn from every hospital interaction, physician interaction, MSO request, quote, coordinator note, patient outcome, and commission experience.

The purpose is not to create a perfect provider directory from day one.

The purpose is to gradually build a practical provider intelligence layer from real operational evidence.

## Core Principle

The provider database grows from real work.

Provider records should be created lightly, linked to real Cases, and enriched over time as AfraMedico gains experience with each provider, branch, department, treatment program, physician, coordinator, and regional contact.

Do not require full provider data from day one.

## What Provider Can Mean

In HPN, a Provider can include:

- Hospital Group
- Hospital Branch
- Department
- Treatment Program
- Center of Excellence
- Physician
- International Office
- Regional Coordinator
- Financial Office
- Imaging Center
- IVF Center
- Genomics Laboratory
- Rehab Center
- Home Care Provider
- Air Ambulance Provider
- Medical Transport Provider
- Hotel partner
- Other healthcare service provider

This broad definition matters because real medical tourism operations depend on a network, not only a hospital name.

For example, a successful oncology referral may depend on the hospital group, a specific hospital branch, the oncology department, one physician, the international office, the regional coordinator, the finance office, and a preferred imaging center.

## Business Rule: Case-driven Provider Growth

When a new Case is sent to a provider, the system should check:

1. Is this an existing provider, contact, doctor, or program?
2. If yes, link the Case to the existing record.
3. If not, create a lightweight new provider or contact record.
4. Enrich the record gradually through future cases.

The system should not block Case progress because a provider profile is incomplete.

The provider record should grow naturally from future operational events.

### Do Not Require Complete Data

Provider records should begin with minimal information.

Example:

- Hospital Name
- Country
- City
- Treatment Area
- Primary Contact

Everything else should grow later from real interactions.

### Case-driven Growth Steps

When a Case is referred:

1. Search existing Provider records. If the Provider exists, link the Case and do not duplicate.
2. Search Department. If the Department exists, link it. Otherwise create a lightweight Department record.
3. Search Physician. If the Physician exists, link it. Otherwise create a lightweight Physician record.
4. Search Coordinator Contact. If the Coordinator exists, link it. Otherwise create a lightweight Contact record.
5. Future Cases enrich all linked records.

## Evidence Sources

Provider records should grow from:

- Hospital Referral
- Medical Review
- MSO Request
- MSO Response
- Quotation
- Treatment Outcome
- Treatment
- Coordinator Communication
- Coordinator Notes
- Patient Feedback
- Operational Notes
- Response Time
- Case Completion
- Commission Experience
- Clinical Outcome
- Real operational experience

Every meaningful provider insight should link back to a real Case or interaction.

The system should never invent provider knowledge.

## Provider Hierarchy

HPN should support a practical hierarchy:

1. Provider Network
2. Provider Organization
3. Hospital Branch
4. Department
5. Treatment Program
6. Physician
7. Coordinator
8. Regional Contact
9. Case History

The hierarchy is not meant to slow down operations. It exists so that each Case can enrich the correct level of provider knowledge.

## Example Provider Structures

### Acibadem Healthcare Group

Possible network records:

- Acibadem Healthcare Group
- Altunizade Hospital
- Gamma Knife
- Prof. Koray
- International Office
- Regional contacts for Iran and Africa

This structure lets ICOS understand the difference between the hospital group, a specific branch, a treatment program, a physician, and regional contacts.

### Acibadem Maslak

Possible network records:

- Acibadem Maslak
- CyberKnife
- Prof. Enis
- International Office

This allows the system to remember whether Maslak is strong for a certain treatment type, which physician responded well, and how fast the international office handled the case.

### Acibadem Atasehir

Possible network records:

- Acibadem Atasehir
- Robotic Surgery
- Related physicians
- Coordinator contacts

This supports gradual learning about treatment strengths, physician responsiveness, and coordinator reliability.

## Core Entities

HPN should include these entities:

- Provider Network
- Provider Organization
- Hospital Branch
- Department
- Treatment Program
- Physician
- Coordinator Contact
- Regional Contact
- Hospital Referral
- Hospital MSO
- Hospital Quote
- Provider Performance Record
- Provider Relationship Note

## Provider Network

Provider Network is the top-level structure that groups related providers, contacts, branches, physicians, programs, and relationship notes.

Example:

- Provider Network: Acibadem Healthcare Group
- Branches: Altunizade, Maslak, Atasehir
- Programs: Gamma Knife, CyberKnife, Robotic Surgery
- Contacts: International Office, regional coordinators, financial office
- Physicians: linked by specialty and case experience

## Provider Organization

Provider Organization represents the legal or brand-level entity.

Examples:

- Acibadem Healthcare Group
- Medipol
- Memorial
- Bumrungrad
- Andalos

The organization may have multiple branches, departments, programs, contacts, and quote processes.

## Hospital Branch

Hospital Branch represents the physical operating location.

Examples:

- Acibadem Altunizade
- Acibadem Maslak
- Acibadem Atasehir

Branch-level performance matters because response time, treatment programs, physicians, pricing, and coordinator quality can differ between branches.

## Department

Department represents a clinical or operational department inside a provider.

Examples:

- Neurosurgery
- Cardiology
- Oncology
- Orthopedics
- IVF
- International Office
- Financial Office

Departments can have their own contacts, response patterns, quote behavior, and case outcomes.

## Treatment Program

Treatment Program represents a defined treatment capability or branded service line.

Examples:

- Gamma Knife
- CyberKnife
- Robotic Surgery
- Bone Marrow Transplant
- IVF Program
- Oncology Tumor Board

Treatment programs should be linked to real cases and outcomes rather than manually asserted without evidence.

## Physician

Physician records should grow from case interactions, MSO responses, patient outcomes, and coordinator notes.

Physician records may include:

- Name
- Specialty
- Provider Organization
- Hospital Branch
- Department
- Treatment Program
- Languages
- Regional responsiveness
- Average response time
- Case success notes
- Patient feedback

Doctor ranking should be a future intelligence feature, not a manually subjective list from day one.

## Coordinator and Regional Contacts

Contacts may differ by:

- Region
- Language
- Patient nationality
- Treatment type
- Hospital branch
- Department
- Urgency

HPN should allow multiple contacts for the same provider and preserve their historical performance.

Examples:

- International Office
- Iran regional contact
- Africa regional contact
- Finance coordinator
- Department coordinator
- Physician assistant

### Regional Contact Example

Acibadem International may have different coordinators for different regions.

Iran Coordinator:

- Name: Negin Attaran
- Countries Covered: Iran, Afghanistan
- Languages: Persian, English

Africa Coordinator:

- Name: Mehdi Pourrahim
- Countries Covered: Nigeria, Ghana, Kenya, Uganda
- Languages: English, Arabic

The system should preserve regional contact history because the best operational contact may depend on patient nationality, language, destination, urgency, or treatment type.

## Provider Performance Record

Provider Performance Records should be created from real interactions.

Performance metrics include:

- Average MSO response time
- Average quote response time
- Average surgery scheduling time
- Average admission time
- Acceptance rate
- Case completion rate
- Complication reports
- Specialty strength
- Regional responsiveness
- Coordinator responsiveness
- Coordinator reliability
- Patient satisfaction
- Commission reliability
- Clinical communication quality
- Follow-up quality
- Average case value
- Number of successful cases
- Treatment strength

Each metric should be traceable to Cases, MSO requests, quotes, outcomes, coordinator notes, or patient feedback.

## Relationship History

Every Provider keeps an immutable history.

Relationship history may include:

- Cases referred
- Meetings
- Contracts
- Email exchanges
- Visits
- Conferences
- Operational notes
- Relationship changes
- Coordinator changes

No historical data should ever be overwritten.

Relationship history should help AfraMedico understand both formal provider relationships and practical operating experience.

## Provider Relationship Note

Provider Relationship Notes capture operational knowledge that may not fit neatly into numeric metrics.

Examples:

- "Altunizade responds faster for neurosurgery cases when sent through the Africa regional contact."
- "Finance office requires deposit confirmation before issuing final admission letter."
- "This coordinator is reliable for urgent WhatsApp follow-up."
- "This physician gives detailed MSO responses but needs complete imaging."

Every relationship note should link to a real interaction where possible.

## Business Principles

### Evidence-grown Database

HPN should grow from evidence, not assumptions.

The system should prefer data from referrals, MSO responses, quotes, patient outcomes, coordinator notes, and commission experience.

### Never Overwrite Provider History

Provider history must not be overwritten.

If a provider changes contact person, response speed, pricing behavior, or commission behavior, the system should preserve the previous history and add a new record or timeline event.

### Every Provider Insight Should Link to a Real Case or Interaction

Operational insights are valuable only when they can be traced.

HPN should connect insights to:

- Case ID
- Hospital Referral ID
- MSO Request ID
- Quote ID
- Coordinator Note
- Patient Feedback
- Commission Record

### Provider Performance Improves With Each Case

Each new Case should make the provider database more useful.

The system should learn:

- Which provider responds fastest.
- Which physician is strongest for a specialty.
- Which branch is best for a treatment type.
- Which coordinator is reliable for a region.
- Which provider gives clear quotes.
- Which provider creates commission or follow-up problems.
- Which providers work best for each nationality.
- Which providers are strongest for urgent cases.
- Which providers produce the highest patient satisfaction.

### Recommendation Should Be Based on Accumulated Experience

The system should help recommend the best provider based on accumulated operational evidence.

Recommendations should consider:

- Treatment type
- Destination country
- Patient nationality
- Language
- Urgency
- Budget
- Prior outcomes
- Response time
- Quote quality
- Historical performance
- Clinical outcomes
- Response speed
- Coordinator reliability
- Commission reliability
- Follow-up quality

### Contacts May Differ by Context

The best contact may differ by region, language, patient nationality, treatment type, hospital branch, and urgency.

HPN must support multiple contact paths instead of assuming one universal hospital contact.

## Case-driven Workflow

When a Case is ready for provider interaction:

1. The coordinator selects or searches for a Provider.
2. ICOS checks whether the Provider Organization, Branch, Department, Physician, Program, or Contact already exists.
3. If the record exists, the Case links to it.
4. If it does not exist, a lightweight Provider or Contact record is created.
5. The Hospital Referral, MSO Request, Quote, and later outcome enrich the provider record.
6. Coordinator notes and patient feedback add qualitative evidence.
7. Performance metrics update as more real cases are completed.

This keeps HPN practical and prevents overbuilding.

## Relationship to Hospital Referrals

Hospital Referrals create provider evidence.

Each referral should link:

- Case
- Patient
- Provider Organization
- Branch
- Department
- Program
- Physician if known
- Coordinator Contact
- Regional Contact if relevant
- Registration status
- Hospital Case ID
- Evidence
- Timeline

Referral Protection remains responsible for commission protection and evidence.

HPN uses the same interactions to improve provider intelligence.

## Relationship to Hospital MSO

Hospital MSO records create clinical and performance evidence.

Each MSO should help answer:

- Which provider responded?
- Which physician or department reviewed the case?
- How long did response take?
- Was the response clinically useful?
- Did the provider ask good questions?
- Did the provider require missing documents?
- Was the patient accepted?

## Relationship to Hospital Quotes

Hospital Quotes create financial and operational evidence.

Each quote should help answer:

- How fast did the quote arrive?
- Was pricing clear?
- Was currency clear?
- Were inclusions and exclusions clear?
- Did the provider require deposit?
- Did the provider issue invoice reliably?
- Was commission handling reliable?

## Relationship to Treatment Outcomes

Treatment outcomes create long-term provider intelligence.

Outcome data may include:

- Treatment completed
- Complications
- Patient satisfaction
- Hospital communication quality
- Discharge document quality
- Follow-up quality
- Repeat treatment suitability

Outcome evidence should strengthen future provider recommendations.

## Future Features

Future HPN features may include:

- Provider recommendation engine
- Doctor ranking by specialty
- Hospital response SLA tracking
- Regional coordinator mapping
- Commission reliability score
- Provider portal
- Contract management
- API integration with hospital systems
- Hospital APIs
- Booking platforms
- Airline APIs
- WhatsApp
- Email
- Calendar
- AI recommendation engine

## Related Modules

HPN should connect to:

- Case Workspace
- Clinical Decision Center
- Referral Protection
- Hospital Referrals
- Patient Journey
- Operations Center
- Finance & Commission
- Mission Control

## Stable IDs

Future backend architecture should connect HPN records through stable IDs:

- `provider_network_id`
- `provider_organization_id`
- `hospital_branch_id`
- `department_id`
- `treatment_program_id`
- `physician_id`
- `coordinator_contact_id`
- `regional_contact_id`
- `hospital_referral_id`
- `hospital_mso_id`
- `hospital_quote_id`
- `provider_performance_record_id`
- `provider_relationship_note_id`
- `case_id`
- `patient_id`
- `audit_event_id`

## Architecture Rule

Healthcare Provider Network is a living provider intelligence layer.

It should not become:

- A manually bloated hospital directory
- A static contact list
- A marketing brochure for providers
- A replacement for case evidence
- A disconnected provider CRM

It should become:

- A case-driven knowledge base
- A provider performance memory
- A hospital relationship intelligence layer
- A future recommendation engine foundation
- A source of evidence for better clinical, operational, financial, and patient journey decisions
