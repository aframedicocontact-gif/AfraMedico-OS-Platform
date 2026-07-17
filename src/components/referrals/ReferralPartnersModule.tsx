import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import type { AppView } from "../../app/App";
import type { ReferralPartner } from "../../types/referralPartner";
import { AddPartner } from "../pages/AddPartner";
import { PartnerDirectory } from "../pages/PartnerDirectory";
import { PartnerProfile } from "../pages/PartnerProfile";
import { ReferralDashboard } from "../pages/ReferralDashboard";
import { ReferralPipeline } from "../pages/ReferralPipeline";

type ReferralPartnersModuleProps = {
  partners: ReferralPartner[];
  initialView: AppView;
};

function referralViewToPath(view: AppView): string {
  switch (view.name) {
    case "referral-pipeline":
      return "/referrals/pipeline";
    case "partner-directory":
      return "/referrals/directory";
    case "add-referral-partner":
      return "/referrals/add";
    case "referral-partner-profile":
      return `/referrals/partners/${encodeURIComponent(view.partnerId)}`;
    default:
      return "/referrals";
  }
}

export function ReferralPartnersModule({ partners, initialView }: ReferralPartnersModuleProps) {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/referrals" element={<ReferralDashboard partners={partners} />} />
        <Route path="/referrals/pipeline" element={<ReferralPipeline partners={partners} />} />
        <Route path="/referrals/directory" element={<PartnerDirectory partners={partners} />} />
        <Route path="/referrals/add" element={<AddPartner />} />
        <Route path="/referrals/partners/:partnerId" element={<PartnerProfile partners={partners} />} />
        <Route path="*" element={<Navigate to={referralViewToPath(initialView)} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
