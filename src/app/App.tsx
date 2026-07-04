import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import type { UnifiedCaseContext } from "../components/context/UnifiedPatientContext";
import { AddLead } from "../components/pages/AddLead";
import { AddOrganization } from "../components/pages/AddOrganization";
import { AddPartner } from "../components/pages/AddPartner";
import { AuthorityDiscovery } from "../components/pages/AuthorityDiscovery";
import { BacklinkCampaigns } from "../components/pages/BacklinkCampaigns";
import { CasesPage } from "../components/pages/CasesPage";
import { CaseDetailPage } from "../components/pages/CaseDetailPage";
import { CaseProfile } from "../components/pages/CaseProfile";
import {
  ClinicalDecisionDashboard,
  ClinicalReviewQueue,
  ClinicalReviewWorkspace,
  DocumentCompletenessReview,
  HospitalCasePackage,
  HospitalMsoTracker,
  PreliminaryMedicalOpinion,
} from "../components/pages/ClinicalDecisionCenter";
import { CommissionOwnership } from "../components/pages/CommissionOwnership";
import { CsvImport } from "../components/pages/CsvImport";
import { DuplicateReviewCenter } from "../components/pages/DuplicateReviewCenter";
import { EnterpriseTaskBoard } from "../components/pages/EnterpriseTaskBoard";
import { FinanceCommissionCenter } from "../components/pages/FinanceCommissionCenter";
import { HealthcareProviderNetwork } from "../components/pages/HealthcareProviderNetwork";
import { HospitalReferrals } from "../components/pages/HospitalReferrals";
import { LeadDashboard } from "../components/pages/LeadDashboard";
import { LeadDirectory } from "../components/pages/LeadDirectory";
import { LeadPipeline } from "../components/pages/LeadPipeline";
import { LeadProfile } from "../components/pages/LeadProfile";
import { LoginPage } from "../components/pages/LoginPage";
import { MedicalReviewDashboard } from "../components/pages/MedicalReviewDashboard";
import { MedicalReviewQueue } from "../components/pages/MedicalReviewQueue";
import { MedicalReviewWorkspace } from "../components/pages/MedicalReviewWorkspace";
import { MissionControl } from "../components/pages/MissionControl";
import { OrganizationDetails } from "../components/pages/OrganizationDetails";
import { OrganizationsList } from "../components/pages/OrganizationsList";
import { OrganizationsPage } from "../components/pages/OrganizationsPage";
import { OpportunityIntelligence } from "../components/pages/OpportunityIntelligence";
import { OpportunityIntelligenceDashboard } from "../components/pages/OpportunityIntelligenceDashboard";
import { OutreachWorkspace } from "../components/pages/OutreachWorkspace";
import { OperationsCenter } from "../components/pages/OperationsCenter";
import { PartnerDirectory } from "../components/pages/PartnerDirectory";
import { PartnerProfile } from "../components/pages/PartnerProfile";
import { PatientsPage } from "../components/pages/PatientsPage";
import { ProtectionAuditTrail } from "../components/pages/ProtectionAuditTrail";
import { ProtectionDashboard } from "../components/pages/ProtectionDashboard";
import { ReferralDashboard } from "../components/pages/ReferralDashboard";
import { ReferralDetails } from "../components/pages/ReferralDetails";
import { ReferralPipeline } from "../components/pages/ReferralPipeline";
import { ResetPasswordPage } from "../components/pages/ResetPasswordPage";
import { RevenuePipeline } from "../components/pages/RevenuePipeline";
import { useAuth } from "../contexts/AuthContext";
import { supabaseConfig } from "../lib/supabaseClient";
import { mergeImportedAuthorityOrganizations } from "../services/authorityImportService";
import { getPasswordRecoveryTokensFromLocation } from "../services/authService";
import { getLeads } from "../services/leadService";
import organizationsJson from "../data/organizations.json";
import leadsJson from "../data/leads.json";
import referralPartnersJson from "../data/referral-partners.json";
import referralProtectionJson from "../data/referral-protection.json";
import caseProfilesJson from "../data/case-profiles.json";
import clinicalReviewsJson from "../data/clinical-reviews.json";
import medicalReviewsJson from "../data/medical-reviews.json";
import operationsJson from "../data/operations.json";
import hpnJson from "../data/hpn.json";
import financeJson from "../data/finance.json";
import type { CaseProfileRecord } from "../types/caseProfile";
import type { ClinicalReviewRecord } from "../types/clinicalDecision";
import type { HpnData } from "../types/hpn";
import type { FinanceData } from "../types/finance";
import type { Lead } from "../types/lead";
import type { MedicalReviewRecord } from "../types/medicalReview";
import type { Organization } from "../types/organization";
import type { OperationsData } from "../types/operations";
import type { ProtectedReferralCase } from "../types/referralProtection";
import type { ReferralPartner } from "../types/referralPartner";

export type AppView =
  | { name: "login" }
  | { name: "reset-password" }
  | { name: "dashboard" }
  | { name: "platform-organizations" }
  | { name: "patients" }
  | { name: "cases" }
  | { name: "case-detail"; caseId: string }
  | { name: "organizations" }
  | { name: "enterprise-task-board" }
  | { name: "opportunity-dashboard" }
  | { name: "revenue-pipeline" }
  | { name: "backlink-campaigns"; organizationIds?: string[]; campaignType?: string; openWizard?: boolean }
  | { name: "authority-discovery" }
  | { name: "organization-details"; organizationId: string }
  | { name: "outreach-workspace"; organizationId: string }
  | { name: "opportunity-intelligence"; organizationId: string }
  | { name: "add-organization" }
  | { name: "csv-import" }
  | { name: "referral-dashboard" }
  | { name: "partner-directory" }
  | { name: "referral-partner-profile"; partnerId: string }
  | { name: "add-referral-partner" }
  | { name: "referral-pipeline" }
  | { name: "lead-dashboard" }
  | { name: "lead-directory" }
  | { name: "lead-profile"; leadId: string }
  | { name: "add-lead" }
  | { name: "lead-pipeline" }
  | { name: "clinical-decision-dashboard" }
  | { name: "clinical-review-queue" }
  | { name: "clinical-review-workspace"; reviewId: string }
  | { name: "clinical-document-review"; reviewId: string }
  | { name: "preliminary-medical-opinion"; reviewId: string }
  | { name: "hospital-case-package"; reviewId: string }
  | { name: "hospital-mso-tracker"; reviewId: string }
  | { name: "medical-review-dashboard" }
  | { name: "medical-review-queue" }
  | { name: "medical-review-workspace"; reviewId: string }
  | { name: "protection-dashboard" }
  | { name: "hospital-referrals" }
  | { name: "referral-details"; caseId: string }
  | { name: "duplicate-review" }
  | { name: "commission-ownership" }
  | { name: "protection-audit-trail" }
  | { name: "case-profile"; caseId: string }
  | { name: "operations-dashboard" }
  | { name: "operations-workboard" }
  | { name: "operations-ownership" }
  | { name: "operations-role-matrix" }
  | { name: "operations-work-items" }
  | { name: "operations-handoffs" }
  | { name: "operations-department-dashboard" }
  | { name: "hpn-dashboard" }
  | { name: "hpn-directory" }
  | { name: "hpn-provider-profile"; providerId: string }
  | { name: "hpn-case-intelligence" }
  | { name: "hpn-regional-contacts" }
  | { name: "hpn-performance" }
  | { name: "hpn-relationship-management" }
  | { name: "hpn-add-provider" }
  | { name: "finance-dashboard" }
  | { name: "finance-case-queue" }
  | { name: "finance-case-workspace"; caseId: string }
  | { name: "finance-invoice-tracker" }
  | { name: "finance-commission-engine" }
  | { name: "finance-partner-settlement" }
  | { name: "finance-revenue-protection" }
  | { name: "finance-audit-trail" };

const baseOrganizations = organizationsJson as Organization[];
const referralPartners = referralPartnersJson as ReferralPartner[];
const seedLeads = leadsJson as Lead[];
const protectionCases = referralProtectionJson as ProtectedReferralCase[];
const caseProfiles = caseProfilesJson as CaseProfileRecord[];
const clinicalReviews = clinicalReviewsJson as ClinicalReviewRecord[];
const medicalReviews = medicalReviewsJson as MedicalReviewRecord[];
const operations = operationsJson as OperationsData;
const hpn = hpnJson as HpnData;
const finance = financeJson as FinanceData;

export function App() {
  const [view, setView] = useState<AppView>(() => getInitialView());
  const [organizations, setOrganizations] = useState<Organization[]>(() =>
    mergeImportedAuthorityOrganizations(baseOrganizations),
  );
  const [leads, setLeads] = useState<Lead[]>(() => getLeads(seedLeads));
  const { isAuthenticated, loading: authLoading, signOut } = useAuth();
  const authRequired = supabaseConfig.isConfigured;
  const publicView = isPublicView(view.name);

  useEffect(() => {
    if (authRequired && !authLoading && !isAuthenticated && !publicView) {
      window.history.replaceState({}, "", "/login");
      setView({ name: "login" });
    }
  }, [authLoading, authRequired, isAuthenticated, publicView]);

  const selectedOrganization = useMemo(() => {
    if (
      view.name !== "organization-details" &&
      view.name !== "outreach-workspace" &&
      view.name !== "opportunity-intelligence"
    ) {
      return organizations[0];
    }

    return (
      organizations.find((organization) => organization.id === view.organizationId) ??
      organizations[0]
    );
  }, [organizations, view]);

  const selectedReferralPartner = useMemo(() => {
    if (view.name !== "referral-partner-profile") {
      return referralPartners[0];
    }

    return (
      referralPartners.find((partner) => partner.id === view.partnerId) ??
      referralPartners[0]
    );
  }, [view]);

  const selectedLead = useMemo(() => {
    if (view.name !== "lead-profile") {
      return leads[0];
    }

    return leads.find((lead) => lead.id === view.leadId) ?? leads[0];
  }, [view]);

  const selectedProtectionCase = useMemo(() => {
    if (view.name !== "referral-details") {
      return protectionCases[0];
    }

    return protectionCases.find((item) => item.id === view.caseId) ?? protectionCases[0];
  }, [view]);

  const selectedCaseProfile = useMemo(() => {
    if (view.name !== "case-profile") {
      return caseProfiles[0];
    }

    return caseProfiles.find((item) => item.caseId === view.caseId) ?? caseProfiles[0];
  }, [view]);

  const selectedMedicalReview = useMemo(() => {
    if (view.name !== "medical-review-workspace") {
      return medicalReviews[0];
    }

    return medicalReviews.find((review) => review.id === view.reviewId) ?? medicalReviews[0];
  }, [view]);

  const selectedClinicalReview = useMemo(() => {
    if (
      view.name !== "clinical-review-workspace" &&
      view.name !== "clinical-document-review" &&
      view.name !== "preliminary-medical-opinion" &&
      view.name !== "hospital-case-package" &&
      view.name !== "hospital-mso-tracker"
    ) {
      return clinicalReviews[0];
    }

    return clinicalReviews.find((review) => review.id === view.reviewId) ?? clinicalReviews[0];
  }, [view]);

  const activeClinicalReview = useMemo(() => {
    if (
      view.name === "clinical-review-workspace" ||
      view.name === "clinical-document-review" ||
      view.name === "preliminary-medical-opinion" ||
      view.name === "hospital-case-package" ||
      view.name === "hospital-mso-tracker"
    ) {
      return selectedClinicalReview;
    }

    return (
      clinicalReviews.find((review) => review.patientName === selectedCaseProfile.patientName) ??
      clinicalReviews[0]
    );
  }, [selectedCaseProfile.patientName, selectedClinicalReview, view.name]);

  const unifiedCaseContext = useMemo<UnifiedCaseContext>(() => {
    const currentHospital =
      selectedCaseProfile.hospitalReferrals.find((referral) => referral.registrationStatus === "Confirmed")?.hospital ??
      selectedCaseProfile.hospitalReferrals[0]?.hospital ??
      "Pending";
    const stage = normalizeJourneyStage(selectedCaseProfile.currentStep ?? activeClinicalReview.status);
    const readinessScore = calculateReadiness(activeClinicalReview);
    const pendingDocuments = activeClinicalReview.status === "Waiting for Documents" || activeClinicalReview.documentStatus.toLowerCase().includes("missing");

    return {
      patientName: selectedCaseProfile.patientName,
      patientId: selectedCaseProfile.patientId,
      caseId: selectedCaseProfile.caseId,
      currentTreatment: selectedCaseProfile.treatmentRequested,
      country: selectedCaseProfile.country,
      priority: selectedCaseProfile.priority,
      urgency: activeClinicalReview.urgency,
      partner: selectedCaseProfile.referralPartner ?? selectedCaseProfile.primaryPartner,
      assignedCoordinator: selectedCaseProfile.coordinator,
      assignedClinicalReviewer: activeClinicalReview.assignedReviewer,
      currentHospital,
      currentStage: stage,
      clinicalReadinessScore: readinessScore,
      hospital: currentHospital,
      patientSummary: selectedCaseProfile.medicalReview.medicalSummary,
      timelineSummary: `${selectedCaseProfile.caseTimeline.length} case events, ${activeClinicalReview.timeline.length} clinical events`,
      openTasks: selectedCaseProfile.tasks.filter((task) => task.status !== "Done" && task.status !== "Completed").length,
      unreadCommunications: activeClinicalReview.communication.patientNotified ? 1 : 3,
      upcomingDeadlines: [
        activeClinicalReview.slaDeadline ? `Clinical SLA: ${activeClinicalReview.slaDeadline}` : "Clinical SLA pending",
        selectedCaseProfile.expectedTravelDate ? `Expected travel: ${selectedCaseProfile.expectedTravelDate}` : "Travel date pending",
        selectedCaseProfile.hospitalQuotes[0]?.responseDeadline ? `Quote response: ${selectedCaseProfile.hospitalQuotes[0].responseDeadline}` : "Quote response pending",
      ],
      badges: {
        emergency: activeClinicalReview.urgency === "Emergency",
        vip: Boolean(selectedCaseProfile.vipFlag),
        partnerProtected: selectedCaseProfile.ownershipStatus === "Confirmed First Referrer",
        duplicateFlag: selectedCaseProfile.partnerTimeline.some((event) => event.action?.toLowerCase().includes("duplicate")),
        lowBenefitTravel: activeClinicalReview.status === "Not Recommended for Travel",
        pendingDocuments,
      },
      reviewId: activeClinicalReview.id,
      timeline: buildUnifiedTimeline(selectedCaseProfile, activeClinicalReview),
      tasks: buildUnifiedTasks(selectedCaseProfile, activeClinicalReview),
    };
  }, [activeClinicalReview, selectedCaseProfile]);

  function openMissionControl() {
    window.history.replaceState({}, "", "/");
    setView({ name: "dashboard" });
  }

  function openLogin() {
    window.history.replaceState({}, "", "/login");
    setView({ name: "login" });
  }

  async function handleSignOut() {
    await signOut();
    openLogin();
  }

  if (view.name === "login") {
    return <LoginPage onSignedIn={openMissionControl} />;
  }

  if (view.name === "reset-password") {
    return <ResetPasswordPage onComplete={openLogin} />;
  }

  if (authRequired && authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            AfraMedico OS Platform
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-emerald-950">Checking access</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Verifying your Supabase session before opening the internal workspace.
          </p>
        </div>
      </div>
    );
  }

  if (authRequired && !isAuthenticated) {
    return <LoginPage onSignedIn={openMissionControl} />;
  }

  function navigateFromShell(nextView: AppView) {
    if (nextView.name === "platform-organizations") {
      window.history.pushState({}, "", "/organizations");
    } else if (nextView.name === "patients") {
      window.history.pushState({}, "", "/patients");
    } else if (nextView.name === "cases") {
      window.history.pushState({}, "", "/cases");
    } else if (nextView.name === "case-detail") {
      window.history.pushState({}, "", `/cases/${nextView.caseId}`);
    } else if (
      window.location.pathname === "/organizations" ||
      window.location.pathname === "/patients" ||
      window.location.pathname === "/cases" ||
      window.location.pathname.startsWith("/cases/")
    ) {
      window.history.pushState({}, "", "/");
    }

    setView(nextView);
  }

  return (
    <AppShell
      caseContext={usesCaseContextFrame(view.name) ? unifiedCaseContext : undefined}
      currentView={view.name}
      onNavigate={navigateFromShell}
      onSignOut={handleSignOut}
    >
      {view.name === "dashboard" ? (
        <MissionControl
          leads={leads}
          partners={referralPartners}
          protectionCases={protectionCases}
          caseProfiles={caseProfiles}
          onNavigate={setView}
        />
      ) : null}
      {view.name === "platform-organizations" ? <OrganizationsPage /> : null}
      {view.name === "patients" ? <PatientsPage /> : null}
      {view.name === "cases" ? <CasesPage onNavigate={navigateFromShell} /> : null}
      {view.name === "case-detail" ? (
        <CaseDetailPage caseId={view.caseId} onNavigate={navigateFromShell} />
      ) : null}
      {view.name === "organizations" ? (
        <OrganizationsList organizations={organizations} onNavigate={setView} />
      ) : null}
      {view.name === "enterprise-task-board" ? (
        <EnterpriseTaskBoard organizations={organizations} onNavigate={setView} />
      ) : null}
      {view.name === "opportunity-dashboard" ? (
        <OpportunityIntelligenceDashboard organizations={organizations} />
      ) : null}
      {view.name === "revenue-pipeline" ? (
        <RevenuePipeline organizations={organizations} />
      ) : null}
      {view.name === "backlink-campaigns" ? (
        <BacklinkCampaigns
          initialCampaignType={view.campaignType}
          initialOrganizationIds={view.organizationIds}
          initialOpenWizard={view.openWizard}
          organizations={organizations}
        />
      ) : null}
      {view.name === "authority-discovery" ? (
        <AuthorityDiscovery
          organizations={organizations}
          onImport={setOrganizations}
          onNavigate={setView}
        />
      ) : null}
      {view.name === "organization-details" ? (
        <OrganizationDetails
          organization={selectedOrganization}
          onNavigate={setView}
        />
      ) : null}
      {view.name === "outreach-workspace" ? (
        <OutreachWorkspace organization={selectedOrganization} onNavigate={setView} />
      ) : null}
      {view.name === "opportunity-intelligence" ? (
        <OpportunityIntelligence organization={selectedOrganization} onNavigate={setView} />
      ) : null}
      {view.name === "add-organization" ? (
        <AddOrganization onNavigate={setView} />
      ) : null}
      {view.name === "csv-import" ? (
        <CsvImport onNavigate={setView} />
      ) : null}
      {view.name === "referral-dashboard" ? (
        <ReferralDashboard partners={referralPartners} onNavigate={setView} />
      ) : null}
      {view.name === "partner-directory" ? (
        <PartnerDirectory partners={referralPartners} onNavigate={setView} />
      ) : null}
      {view.name === "referral-partner-profile" ? (
        <PartnerProfile partner={selectedReferralPartner} onNavigate={setView} />
      ) : null}
      {view.name === "add-referral-partner" ? (
        <AddPartner onNavigate={setView} />
      ) : null}
      {view.name === "referral-pipeline" ? (
        <ReferralPipeline partners={referralPartners} onNavigate={setView} />
      ) : null}
      {view.name === "lead-dashboard" ? (
        <LeadDashboard leads={leads} onNavigate={setView} />
      ) : null}
      {view.name === "lead-directory" ? (
        <LeadDirectory leads={leads} onNavigate={setView} />
      ) : null}
      {view.name === "lead-profile" ? (
        <LeadProfile lead={selectedLead} onNavigate={setView} />
      ) : null}
      {view.name === "add-lead" ? (
        <AddLead
          existingLeads={leads}
          onLeadCreated={(lead) => {
            setLeads(getLeads(seedLeads));
            setView({ name: "lead-profile", leadId: lead.id });
          }}
          onNavigate={setView}
        />
      ) : null}
      {view.name === "lead-pipeline" ? (
        <LeadPipeline leads={leads} onNavigate={setView} />
      ) : null}
      {view.name === "clinical-decision-dashboard" ? (
        <ClinicalDecisionDashboard reviews={clinicalReviews} onNavigate={setView} />
      ) : null}
      {view.name === "clinical-review-queue" ? (
        <ClinicalReviewQueue reviews={clinicalReviews} onNavigate={setView} />
      ) : null}
      {view.name === "clinical-review-workspace" ? (
        <ClinicalReviewWorkspace
          reviews={clinicalReviews}
          review={selectedClinicalReview}
          onNavigate={setView}
        />
      ) : null}
      {view.name === "clinical-document-review" ? (
        <DocumentCompletenessReview
          reviews={clinicalReviews}
          review={selectedClinicalReview}
          onNavigate={setView}
        />
      ) : null}
      {view.name === "preliminary-medical-opinion" ? (
        <PreliminaryMedicalOpinion
          reviews={clinicalReviews}
          review={selectedClinicalReview}
          onNavigate={setView}
        />
      ) : null}
      {view.name === "hospital-case-package" ? (
        <HospitalCasePackage
          reviews={clinicalReviews}
          review={selectedClinicalReview}
          onNavigate={setView}
        />
      ) : null}
      {view.name === "hospital-mso-tracker" ? (
        <HospitalMsoTracker
          reviews={clinicalReviews}
          review={selectedClinicalReview}
          onNavigate={setView}
        />
      ) : null}
      {view.name === "medical-review-dashboard" ? (
        <MedicalReviewDashboard reviews={medicalReviews} onNavigate={setView} />
      ) : null}
      {view.name === "medical-review-queue" ? (
        <MedicalReviewQueue reviews={medicalReviews} onNavigate={setView} />
      ) : null}
      {view.name === "medical-review-workspace" ? (
        <MedicalReviewWorkspace review={selectedMedicalReview} onNavigate={setView} />
      ) : null}
      {view.name === "protection-dashboard" ? (
        <ProtectionDashboard cases={protectionCases} onNavigate={setView} />
      ) : null}
      {view.name === "hospital-referrals" ? (
        <HospitalReferrals cases={protectionCases} onNavigate={setView} />
      ) : null}
      {view.name === "referral-details" ? (
        <ReferralDetails protectionCase={selectedProtectionCase} onNavigate={setView} />
      ) : null}
      {view.name === "duplicate-review" ? (
        <DuplicateReviewCenter cases={protectionCases} onNavigate={setView} />
      ) : null}
      {view.name === "commission-ownership" ? (
        <CommissionOwnership cases={protectionCases} />
      ) : null}
      {view.name === "protection-audit-trail" ? (
        <ProtectionAuditTrail cases={protectionCases} />
      ) : null}
      {view.name === "case-profile" ? (
        <CaseProfile
          caseProfile={selectedCaseProfile}
          caseProfiles={caseProfiles}
          onNavigate={setView}
        />
      ) : null}
      {view.name === "operations-dashboard" ? (
        <OperationsCenter data={operations} page="dashboard" onNavigate={setView} />
      ) : null}
      {view.name === "operations-workboard" ? (
        <OperationsCenter data={operations} page="workboard" onNavigate={setView} />
      ) : null}
      {view.name === "operations-ownership" ? (
        <OperationsCenter data={operations} page="ownership" onNavigate={setView} />
      ) : null}
      {view.name === "operations-role-matrix" ? (
        <OperationsCenter data={operations} page="role-matrix" onNavigate={setView} />
      ) : null}
      {view.name === "operations-work-items" ? (
        <OperationsCenter data={operations} page="work-items" onNavigate={setView} />
      ) : null}
      {view.name === "operations-handoffs" ? (
        <OperationsCenter data={operations} page="handoffs" onNavigate={setView} />
      ) : null}
      {view.name === "operations-department-dashboard" ? (
        <OperationsCenter data={operations} page="department-dashboard" onNavigate={setView} />
      ) : null}
      {view.name === "hpn-dashboard" ? (
        <HealthcareProviderNetwork data={hpn} page="dashboard" onNavigate={setView} />
      ) : null}
      {view.name === "hpn-directory" ? (
        <HealthcareProviderNetwork data={hpn} page="directory" onNavigate={setView} />
      ) : null}
      {view.name === "hpn-provider-profile" ? (
        <HealthcareProviderNetwork data={hpn} page="profile" providerId={view.providerId} onNavigate={setView} />
      ) : null}
      {view.name === "hpn-case-intelligence" ? (
        <HealthcareProviderNetwork data={hpn} page="case-intelligence" onNavigate={setView} />
      ) : null}
      {view.name === "hpn-regional-contacts" ? (
        <HealthcareProviderNetwork data={hpn} page="regional-contacts" onNavigate={setView} />
      ) : null}
      {view.name === "hpn-performance" ? (
        <HealthcareProviderNetwork data={hpn} page="performance" onNavigate={setView} />
      ) : null}
      {view.name === "hpn-relationship-management" ? (
        <HealthcareProviderNetwork data={hpn} page="relationship-management" onNavigate={setView} />
      ) : null}
      {view.name === "hpn-add-provider" ? (
        <HealthcareProviderNetwork data={hpn} page="add-provider" onNavigate={setView} />
      ) : null}
      {view.name === "finance-dashboard" ? (
        <FinanceCommissionCenter data={finance} page="dashboard" onNavigate={setView} />
      ) : null}
      {view.name === "finance-case-queue" ? (
        <FinanceCommissionCenter data={finance} page="queue" onNavigate={setView} />
      ) : null}
      {view.name === "finance-case-workspace" ? (
        <FinanceCommissionCenter data={finance} page="workspace" caseId={view.caseId} onNavigate={setView} />
      ) : null}
      {view.name === "finance-invoice-tracker" ? (
        <FinanceCommissionCenter data={finance} page="invoice-tracker" onNavigate={setView} />
      ) : null}
      {view.name === "finance-commission-engine" ? (
        <FinanceCommissionCenter data={finance} page="commission-engine" onNavigate={setView} />
      ) : null}
      {view.name === "finance-partner-settlement" ? (
        <FinanceCommissionCenter data={finance} page="partner-settlement" onNavigate={setView} />
      ) : null}
      {view.name === "finance-revenue-protection" ? (
        <FinanceCommissionCenter data={finance} page="revenue-protection" onNavigate={setView} />
      ) : null}
      {view.name === "finance-audit-trail" ? (
        <FinanceCommissionCenter data={finance} page="audit-trail" onNavigate={setView} />
      ) : null}
    </AppShell>
  );
}

function getInitialView(): AppView {
  if (hasPasswordRecoveryRoute()) {
    return { name: "reset-password" };
  }

  if (window.location.pathname === "/login") {
    return { name: "login" };
  }

  if (window.location.pathname === "/organizations") {
    return { name: "platform-organizations" };
  }

  if (window.location.pathname === "/patients") {
    return { name: "patients" };
  }

  if (window.location.pathname === "/cases") {
    return { name: "cases" };
  }

  if (window.location.pathname.startsWith("/cases/")) {
    const caseId = window.location.pathname.replace("/cases/", "").trim();
    if (caseId) {
      return { name: "case-detail", caseId };
    }
  }

  return { name: "dashboard" };
}

function hasPasswordRecoveryRoute() {
  const pathname = window.location.pathname;

  return (
    pathname === "/reset-password" ||
    pathname === "/auth/callback" ||
    Boolean(getPasswordRecoveryTokensFromLocation())
  );
}

function isPublicView(viewName: AppView["name"]) {
  return viewName === "login" || viewName === "reset-password";
}

function usesCaseContextFrame(viewName: AppView["name"]) {
  return (
    viewName === "case-profile" ||
    viewName === "lead-profile" ||
    viewName === "referral-details" ||
    viewName === "clinical-review-workspace" ||
    viewName === "clinical-document-review" ||
    viewName === "preliminary-medical-opinion" ||
    viewName === "hospital-case-package" ||
    viewName === "hospital-mso-tracker" ||
    viewName === "medical-review-workspace"
  );
}

function normalizeJourneyStage(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("lead")) return "Lead";
  if (normalized.includes("protection") || normalized.includes("registered")) return "Referral Protection";
  if (normalized.includes("clinical") || normalized.includes("medical") || normalized.includes("document")) return "Clinical Decision";
  if (normalized.includes("package") || normalized.includes("submission")) return "Hospital Package";
  if (normalized.includes("mso") || normalized.includes("hospital review")) return "Hospital MSO";
  if (normalized.includes("quote")) return "Quotation";
  if (normalized.includes("decision")) return "Patient Decision";
  if (normalized.includes("visa") || normalized.includes("preparation")) return "Travel Preparation";
  if (normalized.includes("travel")) return "Travel";
  if (normalized.includes("treatment")) return "Treatment";
  if (normalized.includes("discharge")) return "Discharge";
  if (normalized.includes("follow")) return "Follow-up";
  return "Clinical Decision";
}

function calculateReadiness(review: ClinicalReviewRecord) {
  const documentScore = review.status === "Waiting for Documents" ? 35 : review.documentStatus.toLowerCase().includes("complete") ? 90 : 65;
  const aiScore = review.aiDraftStatus === "Approved" ? 100 : review.aiDraftStatus === "Corrected" ? 80 : review.aiDraftStatus === "Generated" ? 60 : 20;
  const humanScore = review.internalReviewStatus === "Approved" || review.communication.clinicalLeadApproved ? 100 : review.internalReviewStatus === "In Review" ? 60 : 30;
  const opinionScore = review.status === "Preliminary Opinion Sent" ? 100 : review.preliminaryOpinion.approvalStatus === "Approved" ? 80 : 30;
  const packageScore = review.status === "Ready for Hospital Submission" || review.status === "Hospital Review Requested" ? 90 : review.hospitalPackage.documentsIncluded.length > 0 ? 50 : 20;
  return Math.round((documentScore + aiScore + humanScore + opinionScore + packageScore) / 5);
}

function buildUnifiedTimeline(caseProfile: CaseProfileRecord, clinicalReview: ClinicalReviewRecord) {
  const caseEvents = caseProfile.caseTimeline.map((event) => ({
    timestamp: `${event.date} ${event.time ?? ""}`.trim(),
    user: event.user ?? "Coordinator",
    department: "Case Coordination",
    status: event.title,
  }));
  const clinicalEvents = clinicalReview.timeline.map((event) => ({
    timestamp: event.timestamp,
    user: event.user,
    department: "Clinical Decision",
    status: event.action,
  }));

  return [
    ...caseEvents,
    ...clinicalEvents,
    { timestamp: caseProfile.firstReferralDate, user: caseProfile.primaryPartner, department: "Referral Protection", status: "Partner Assigned" },
    { timestamp: caseProfile.createdDate, user: caseProfile.coordinator, department: "Lead Coordination", status: "Lead Created" },
  ].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function buildUnifiedTasks(caseProfile: CaseProfileRecord, clinicalReview: ClinicalReviewRecord) {
  const caseTasks = caseProfile.tasks.map((task) => ({
    title: task.title,
    owner: task.owner,
    priority: caseProfile.priority,
    deadline: task.dueDate,
    status: task.status,
    module: "Case Workspace",
    relatedCase: caseProfile.caseId,
  }));

  const clinicalTasks = [
    {
      title: clinicalReview.status === "Waiting for Documents" ? "Request missing clinical documents" : "Review clinical readiness",
      owner: clinicalReview.assignedReviewer,
      priority: clinicalReview.priority,
      deadline: clinicalReview.slaDeadline,
      status: clinicalReview.internalReviewStatus,
      module: "Clinical Decision",
      relatedCase: caseProfile.caseId,
    },
    {
      title: "Follow up hospital package status",
      owner: caseProfile.coordinator,
      priority: caseProfile.priority,
      deadline: caseProfile.hospitalReferrals[0]?.nextFollowUp ?? caseProfile.lastUpdated,
      status: caseProfile.hospitalReferrals[0]?.quoteStatus ?? "Pending",
      module: "Hospital Referrals",
      relatedCase: caseProfile.caseId,
    },
  ];

  return [...clinicalTasks, ...caseTasks];
}
