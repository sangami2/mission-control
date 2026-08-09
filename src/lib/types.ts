export type ModelStrategy = "fast" | "balanced" | "deep";

export interface Member {
  id: string;
  name: string;
  membership: string;
  renewalDays: number;
  annualValue: number;
  risk: number;
  engagementTrend: number;
  eventsLastYear: number;
  eventsThisYear: number;
  lmsInactiveDays: number;
  communityActivity: string;
  careerActivity: number;
}

export interface AgentNode {
  id: string;
  label: string;
  kind: "data" | "deterministic" | "agent" | "policy" | "human" | "action";
  summary: string;
  status: "ready" | "running" | "complete" | "review";
}

export interface Workflow {
  id: string;
  name: string;
  status: "Active" | "Draft";
  objective: string;
  runs: number;
  nodes: AgentNode[];
}

export interface Evidence {
  id: string;
  source: string;
  signal: string;
  observedAt: string;
}

export interface TraceEvent {
  id: string;
  title: string;
  summary: string;
  tool: string;
  input: string;
  output: string;
  confidence: number;
  latencyMs: number;
  cost: number;
  evidence: string[];
}

export interface Recommendation {
  riskSummary: string;
  engagementShift: string;
  recommendedAction: string;
  supportingEvidence: string[];
  confidence: number;
  requiresHumanReview: boolean;
  reviewReason: string;
}

export interface Policy {
  id: string;
  outcome: "Auto execute" | "Human review" | "Block";
  label: string;
  detail: string;
}

export interface HumanReview {
  id: string;
  memberId: string;
  action: string;
  confidence: number;
  evidenceCount: number;
  trigger: string;
  status: "Pending" | "Approved" | "Modified" | "Rejected";
}

export interface AIResponse extends Recommendation {
  trace: TraceEvent[];
  source: "claude" | "fixture";
}
