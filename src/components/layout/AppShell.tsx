import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CheckSquare,
  Contact,
  DollarSign,
  FileBarChart,
  FileSearch,
  FileStack,
  Flag,
  FolderOpen,
  Hospital,
  Layers3,
  ListChecks,
  LogOut,
  Network,
  ShieldCheck,
  SendToBack,
  Search,
  Settings,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import type { AppView } from "../../app/App";
import {
  UnifiedPatientFrame,
  type UnifiedCaseContext,
} from "../context/UnifiedPatientContext";

type AppShellProps = {
  children: ReactNode;
  caseContext?: UnifiedCaseContext;
  currentView: AppView["name"];
  onNavigate: (view: AppView) => void;
  onSignOut?: () => void;
};

export function AppShell({ children, caseContext, currentView, onNavigate, onSignOut }: AppShellProps) {
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
  const framedChildren = caseContext ? (
    <UnifiedPatientFrame
      collapsed={rightSidebarCollapsed}
      context={caseContext}
      currentView={currentView}
      onNavigate={onNavigate}
      onToggleSidebar={() => setRightSidebarCollapsed((value) => !value)}
    >
      {children}
    </UnifiedPatientFrame>
  ) : children;

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-emerald-950/20 bg-emerald-950 text-white lg:flex">
        <div className="flex h-20 items-center border-b border-white/10 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-white">
              AM
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">
                AfraMedico
              </p>
              <h1 className="text-lg font-semibold">Business Growth OS</h1>
            </div>
          </div>
        </div>
        <div className="border-b border-white/10 px-6 py-4">
          <div className="flex items-start gap-3 rounded-lg bg-white/8 p-3">
            <Sparkles className="mt-0.5 h-4 w-4 text-yellow-300" />
            <p className="text-sm leading-5 text-emerald-50">
              Business CRM for authority, referrals, leads, and growth operations.
            </p>
          </div>
        </div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-4">
          <NavButton
            active={currentView === "dashboard"}
            icon={<BarChart3 className="h-4 w-4" />}
            label="Mission Control"
            onClick={() => onNavigate({ name: "dashboard" })}
          />
          <NavButton
            active={
              currentView === "organizations" ||
              currentView === "authority-discovery" ||
              currentView === "organization-details" ||
              currentView === "outreach-workspace" ||
              currentView === "opportunity-intelligence" ||
              currentView === "add-organization" ||
              currentView === "csv-import"
            }
            icon={<Layers3 className="h-4 w-4" />}
            label="Authority CRM"
            onClick={() => onNavigate({ name: "organizations" })}
          />
          <NavButton
            active={
              currentView === "referral-dashboard" ||
              currentView === "partner-directory" ||
              currentView === "referral-partner-profile" ||
              currentView === "add-referral-partner" ||
              currentView === "referral-pipeline"
            }
            icon={<Network className="h-4 w-4" />}
            label="Referral Partners"
            onClick={() => onNavigate({ name: "referral-dashboard" })}
          />
          <NavButton
            active={
              currentView === "lead-dashboard" ||
              currentView === "lead-directory" ||
              currentView === "lead-profile" ||
              currentView === "add-lead" ||
              currentView === "lead-pipeline"
            }
            icon={<SendToBack className="h-4 w-4" />}
            label="Lead Management"
            onClick={() => onNavigate({ name: "lead-dashboard" })}
          />
          <NavButton
            active={currentView === "case-profile"}
            icon={<FileStack className="h-4 w-4" />}
            label="Case Workspace"
            onClick={() => onNavigate({ name: "case-profile", caseId: "CASE-1001-CARDIAC" })}
          />
          <NavButton
            active={
              currentView === "operations-dashboard" ||
              currentView === "operations-workboard" ||
              currentView === "operations-ownership" ||
              currentView === "operations-role-matrix" ||
              currentView === "operations-work-items" ||
              currentView === "operations-handoffs" ||
              currentView === "operations-department-dashboard"
            }
            icon={<BriefcaseBusiness className="h-4 w-4" />}
            label="Operations Center"
            onClick={() => onNavigate({ name: "operations-dashboard" })}
          />
          <NavButton
            active={
              currentView === "hpn-dashboard" ||
              currentView === "hpn-directory" ||
              currentView === "hpn-provider-profile" ||
              currentView === "hpn-case-intelligence" ||
              currentView === "hpn-regional-contacts" ||
              currentView === "hpn-performance" ||
              currentView === "hpn-relationship-management" ||
              currentView === "hpn-add-provider"
            }
            icon={<Hospital className="h-4 w-4" />}
            label="Healthcare Provider Network"
            onClick={() => onNavigate({ name: "hpn-dashboard" })}
          />
          <NavButton
            active={
              currentView === "finance-dashboard" ||
              currentView === "finance-case-queue" ||
              currentView === "finance-case-workspace" ||
              currentView === "finance-invoice-tracker" ||
              currentView === "finance-commission-engine" ||
              currentView === "finance-partner-settlement" ||
              currentView === "finance-revenue-protection" ||
              currentView === "finance-audit-trail"
            }
            icon={<DollarSign className="h-4 w-4" />}
            label="Finance & Commission"
            onClick={() => onNavigate({ name: "finance-dashboard" })}
          />
          <NavButton
            active={
              currentView === "clinical-decision-dashboard" ||
              currentView === "clinical-review-queue" ||
              currentView === "clinical-review-workspace" ||
              currentView === "clinical-document-review" ||
              currentView === "preliminary-medical-opinion" ||
              currentView === "hospital-case-package" ||
              currentView === "hospital-mso-tracker"
            }
            icon={<FileSearch className="h-4 w-4" />}
            label="Clinical Decision Center"
            onClick={() => onNavigate({ name: "clinical-decision-dashboard" })}
          />
          <NavButton
            active={
              currentView === "protection-dashboard" ||
              currentView === "hospital-referrals" ||
              currentView === "referral-details" ||
              currentView === "duplicate-review" ||
              currentView === "commission-ownership" ||
              currentView === "protection-audit-trail"
            }
            icon={<ShieldCheck className="h-4 w-4" />}
            label="Referral Protection"
            onClick={() => onNavigate({ name: "protection-dashboard" })}
          />
          <NavButton
            disabled
            icon={<Flag className="h-4 w-4" />}
            label="Countries"
          />
          <NavButton
            active={currentView === "platform-organizations"}
            icon={<Building2 className="h-4 w-4" />}
            label="Organizations"
            onClick={() => onNavigate({ name: "platform-organizations" })}
          />
          <NavButton
            active={currentView === "patients"}
            icon={<UsersRound className="h-4 w-4" />}
            label="Patients"
            onClick={() => onNavigate({ name: "patients" })}
          />
          <NavButton
            active={currentView === "cases" || currentView === "case-detail"}
            icon={<FolderOpen className="h-4 w-4" />}
            label="Cases"
            onClick={() => onNavigate({ name: "cases" })}
          />
          <NavButton
            disabled
            icon={<Contact className="h-4 w-4" />}
            label="Contacts"
          />
          <NavButton
            disabled
            icon={<ListChecks className="h-4 w-4" />}
            label="Activities"
          />
          <NavButton
            disabled
            icon={<CheckSquare className="h-4 w-4" />}
            label="Tasks"
          />
          <NavButton
            disabled
            icon={<FileBarChart className="h-4 w-4" />}
            label="Reports"
          />
          <NavButton
            disabled
            icon={<Settings className="h-4 w-4" />}
            label="Settings"
          />
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="rounded-lg border border-white/10 bg-white/8 p-3 text-sm text-emerald-50">
            <p className="font-medium text-white">Sprint 1 prototype</p>
            <p className="mt-1 text-emerald-100">Frontend only. Local JSON data.</p>
          </div>
          {onSignOut ? (
            <button
              className="mt-3 flex w-full items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm text-emerald-50 hover:bg-white/10"
              type="button"
              onClick={onSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          ) : null}
        </div>
      </aside>
      <main className="relative z-0 min-w-0 overflow-x-hidden lg:pl-72">
        <header className="sticky top-0 z-20 border-b bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1600px] min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="lg:hidden">
              <p className="text-sm font-semibold text-primary">AfraMedico</p>
              <h1 className="text-lg font-semibold">Business Growth OS</h1>
            </div>
            <label className="relative w-full lg:max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                className="h-10 w-full rounded-md border bg-white pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Search leads, partners, targets, countries, treatments"
                type="search"
              />
            </label>
            <div className="hidden text-right text-sm text-muted-foreground lg:block">
              <p className="font-medium text-foreground">Business Growth OS</p>
              <p>Internal growth workspace</p>
            </div>
            {onSignOut ? (
              <button
                className="rounded-md border px-3 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-50 lg:hidden"
                type="button"
                onClick={onSignOut}
              >
                Sign out
              </button>
            ) : null}
          </div>
        </header>
        <div className="mx-auto max-w-[1600px] min-w-0 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
          {framedChildren}
        </div>
      </main>
    </div>
  );
}

function NavButton({
  active,
  disabled,
  icon,
  label,
  onClick,
}: {
  active?: boolean;
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      className={
        disabled
          ? "flex w-full cursor-not-allowed items-center justify-between rounded-md px-3 py-2.5 text-left text-sm text-emerald-200/55"
          : active
          ? "flex w-full items-center gap-3 rounded-md bg-white px-3 py-2.5 text-left text-sm font-medium text-emerald-950 shadow-sm"
          : "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-emerald-100 hover:bg-white/10 hover:text-white"
      }
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      <span className="flex items-center gap-3">
        {icon}
        {label}
      </span>
      {disabled ? <span className="text-[10px] uppercase tracking-wide">Soon</span> : null}
    </button>
  );
}
