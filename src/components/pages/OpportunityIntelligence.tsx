import { ArrowLeft, BrainCircuit, RefreshCw, Sparkles, Target, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import type { AppView } from "../../app/App";
import {
  getOpportunityProfile,
  opportunityProviderAdapters,
  refreshOpportunityProfile,
} from "../../services/opportunityService";
import type { Organization } from "../../types/organization";
import type { OpportunityAnalysis, OpportunityIndicator } from "../../types/opportunity";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

type OpportunityIntelligenceProps = {
  organization: Organization;
  onNavigate: (view: AppView) => void;
};

export function OpportunityIntelligence({ organization, onNavigate }: OpportunityIntelligenceProps) {
  const [profile, setProfile] = useState(() => getOpportunityProfile(organization));
  const topOpportunity = profile.topOpportunities[0]?.opportunity;
  const sortedOpportunities = useMemo(
    () => [...profile.opportunities].sort((a, b) => b.opportunityScore - a.opportunityScore),
    [profile.opportunities],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Button
            variant="ghost"
            className="-ml-3 mb-2"
            type="button"
            onClick={() => onNavigate({ name: "organization-details", organizationId: organization.id })}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to organization
          </Button>
          <p className="text-sm font-medium text-primary">Opportunity Intelligence</p>
          <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">{organization.name}</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            AI-assisted business opportunity profile for authority, referrals, SEO, partnerships, revenue, and expansion.
          </p>
        </div>
        <Button type="button" onClick={() => setProfile(refreshOpportunityProfile(organization))}>
          <RefreshCw className="h-4 w-4" />
          Refresh Analysis
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-700" />
              Top Opportunity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topOpportunity ? (
              <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
                <div>
                  <h3 className="text-xl font-semibold text-emerald-950">{topOpportunity.kind}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{topOpportunity.explanation}</p>
                  <p className="mt-4 text-sm font-medium text-emerald-950">
                    Recommended action: {topOpportunity.recommendedAction}
                  </p>
                </div>
                <ScoreRing value={topOpportunity.opportunityScore} label="Opportunity Score" />
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Opportunity Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.indicators.length === 0 ? (
                <Badge tone="muted">Needs qualification</Badge>
              ) : (
                profile.indicators.map((indicator) => <IndicatorBadge key={indicator} indicator={indicator} />)
              )}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Generated {new Date(profile.generatedAt).toLocaleString()} using local deterministic scoring.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {profile.topOpportunities.map((item) => (
          <Card key={item.rank}>
            <CardHeader>
              <CardTitle>
                {item.rank === 1 ? "Top Opportunity" : item.rank === 2 ? "Second Best" : "Third Best"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-emerald-950">{item.opportunity.kind}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.explanation}</p>
                </div>
                <Badge tone={item.opportunity.opportunityScore >= 80 ? "success" : "gold"}>
                  {item.opportunity.opportunityScore}
                </Badge>
              </div>
              <p className="mt-4 text-sm font-medium">Next: {item.opportunity.recommendedAction}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-emerald-700" />
            Opportunity Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table className="min-w-[1500px]">
              <TableHeader>
                <TableRow className="bg-emerald-50/70">
                  <TableHead>Opportunity</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Strategic Value</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Brand Authority</TableHead>
                  <TableHead>SEO Value</TableHead>
                  <TableHead>Referral</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Estimated Time</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Recommended Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedOpportunities.map((opportunity) => (
                  <OpportunityRow key={opportunity.kind} opportunity={opportunity} />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-5">
        <SummaryCard title="Strengths" items={profile.executiveSummary.strengths} />
        <SummaryCard title="Weaknesses" items={profile.executiveSummary.weaknesses} />
        <SummaryCard title="Quick Wins" items={profile.executiveSummary.quickWins} />
        <SummaryCard title="Long-term Opportunities" items={profile.executiveSummary.longTermOpportunities} />
        <SummaryCard title="Potential Risks" items={profile.executiveSummary.potentialRisks} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-600" />
            Future Intelligence Providers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {opportunityProviderAdapters.map((adapter) => (
              <Badge key={adapter.provider} tone="muted">
                {adapter.provider} future
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OpportunityRow({ opportunity }: { opportunity: OpportunityAnalysis }) {
  return (
    <TableRow>
      <TableCell className="font-medium text-emerald-950">{opportunity.kind}</TableCell>
      <TableCell><ScoreBadge value={opportunity.opportunityScore} /></TableCell>
      <TableCell>{opportunity.strategicValue}</TableCell>
      <TableCell>{opportunity.revenuePotential}</TableCell>
      <TableCell>{opportunity.brandAuthority}</TableCell>
      <TableCell>{opportunity.seoValue}</TableCell>
      <TableCell>{opportunity.referralPotential}</TableCell>
      <TableCell><Badge tone={opportunity.difficulty === "Low" ? "success" : opportunity.difficulty === "Medium" ? "warning" : "danger"}>{opportunity.difficulty}</Badge></TableCell>
      <TableCell>{opportunity.estimatedTime}</TableCell>
      <TableCell><Badge tone={opportunity.confidence === "High" ? "success" : opportunity.confidence === "Medium" ? "gold" : "muted"}>{opportunity.confidence}</Badge></TableCell>
      <TableCell>{opportunity.recommendedAction}</TableCell>
    </TableRow>
  );
}

function ScoreBadge({ value }: { value: number }) {
  return <Badge tone={value >= 80 ? "success" : value >= 60 ? "gold" : "muted"}>{value}</Badge>;
}

function IndicatorBadge({ indicator }: { indicator: OpportunityIndicator }) {
  const tone = indicator === "Quick Win" ? "gold" : indicator === "High Revenue" || indicator === "High Referral" ? "success" : "info";
  return <Badge tone={tone}>{indicator}</Badge>;
}

function ScoreRing({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg border bg-white p-4 text-center">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 text-5xl font-semibold text-emerald-950">{value}</p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-600" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function SummaryCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-700" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {items.map((item) => (
            <li key={item} className="rounded-md border bg-white p-2">
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
