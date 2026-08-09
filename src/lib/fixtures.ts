import type { AgentNode, AIResponse, HumanReview, Member, Policy, TraceEvent, Workflow } from "./types";

const node = (id: string, label: string, kind: AgentNode["kind"], summary: string): AgentNode => ({ id, label, kind, summary, status: "ready" });

export const members: Member[] = [
  { id:"mem-sarah-chen", name:"Sarah Chen", membership:"Professional Member", renewalDays:37, annualValue:425, risk:78, engagementTrend:-61, eventsLastYear:5, eventsThisYear:1, lmsInactiveDays:110, communityActivity:"Moderate", careerActivity:42 },
  { id:"mem-marcus-reed", name:"Marcus Reed", membership:"Executive Member", renewalDays:92, annualValue:780, risk:34, engagementTrend:8, eventsLastYear:3, eventsThisYear:4, lmsInactiveDays:12, communityActivity:"High", careerActivity:5 },
  { id:"mem-elena-torres", name:"Elena Torres", membership:"Student Member", renewalDays:18, annualValue:95, risk:69, engagementTrend:-38, eventsLastYear:2, eventsThisYear:0, lmsInactiveDays:45, communityActivity:"Low", careerActivity:64 },
];

export const member = members[0];

export const workflows: Workflow[] = [
  {
    id: "membership-retention",
    name: "Membership Retention",
    status: "Active",
    objective: "Identify members at risk of lapsing and recommend the best intervention.",
    runs: 824,
    nodes: [
      node("member-data", "Membership base", "data", "Screens the permissioned membership population instead of starting from one selected person."),
      node("risk-score", "Risk scoring", "deterministic", "Ranks every member with a reproducible lapse-risk score."),
      node("context", "Context enrichment", "data", "Adds event, learning, community, career, consent, and renewal evidence for flagged members."),
      node("recommendation", "Intervention agent", "agent", "Explains each risk pattern and prepares a relevant intervention and email draft."),
      node("policy", "Policy gate", "policy", "Blocks unsafe cases and separates bulk-eligible outreach from individual review."),
      node("review", "Human review", "human", "Escalates consequential or ambiguous recommendations to staff."),
      node("outreach", "Outreach", "action", "Releases approved messages and records exactly what each member received."),
    ],
  },
  {
    id: "community-moderation",
    name: "Community Moderation",
    status: "Active",
    objective: "Detect policy violations while keeping ambiguous decisions under human review.",
    runs: 287,
    nodes: [
      node("classification", "Content intake", "data", "Screens the permissioned stream of community posts."),
      node("retrieval", "Classification", "agent", "Classifies content and detects possible violations."),
      node("evidence", "Policy evidence", "agent", "Retrieves and compares the applicable policy evidence."),
      node("decision", "Risk decision", "policy", "Applies risk and confidence thresholds."),
      node("mod-review", "Human review", "human", "Routes ambiguous or consequential actions to a moderator."),
      node("action", "Moderation action", "action", "Applies a reversible approved action."),
    ],
  },
  {
    id: "event-growth",
    name: "Event Growth",
    status: "Draft",
    objective: "Identify attendance and revenue opportunities from behavioral signals.",
    runs: 136,
    nodes: [
      node("signals", "Event portfolio", "data", "Screens registration, capacity, audience, and revenue signals across events."),
      node("audience", "Opportunity scoring", "deterministic", "Ranks growth opportunities with reproducible rules."),
      node("opportunity", "Audience context", "data", "Builds relevant target audiences from approved behavioral signals."),
      node("offer", "Campaign agent", "agent", "Suggests a suitable campaign message or offer."),
      node("event-policy", "Policy gate", "policy", "Separates eligible campaigns from financial offers needing individual review."),
      node("approval", "Human approval", "human", "Reviews member-facing financial offers."),
      node("activation", "Activation", "action", "Activates the approved campaign."),
    ],
  },
];

const recommendationFixtureByMember: Record<string, Omit<AIResponse, "trace" | "source">> = {
  "mem-sarah-chen": {
    riskSummary:"Sarah is at elevated lapse risk, but the pattern is not broad disengagement.", engagementShift:"Activity has shifted away from events and learning toward career development.", recommendedAction:"Invite Sarah to the upcoming leadership program and pair it with a targeted 25% renewal incentive.", supportingEvidence:["Renewal in 37 days","Event attendance down 80%","No LMS activity in 110 days","Career-center activity up 42%","Community activity remains moderate"], confidence:.87, requiresHumanReview:true, reviewReason:"The discount exceeds the $50 autonomous-action threshold.",
  },
  "mem-marcus-reed": {
    riskSummary:"Marcus shows low renewal risk and broad, current engagement.", engagementShift:"Event participation increased while learning and community activity remain healthy.", recommendedAction:"Take no retention action now; add Marcus to the annual-summit early-access audience.", supportingEvidence:["Renewal in 92 days","Event attendance increased","LMS activity 12 days ago","Community activity is high"], confidence:.96, requiresHumanReview:false, reviewReason:"No review required; this is a reversible, non-financial audience update.",
  },
  "mem-elena-torres": {
    riskSummary:"Elena has moderate lapse risk with a near-term renewal and declining general engagement.", engagementShift:"Career-center activity increased sharply despite lower event and community participation.", recommendedAction:"Invite Elena to the career fair and student mentoring program before sending a renewal reminder.", supportingEvidence:["Renewal in 18 days","No events this year","Career-center activity up 64%","Student membership","Low community activity"], confidence:.95, requiresHumanReview:false, reviewReason:"No review required; the invitation is reversible and has no financial impact.",
  },
};

export function getTraceForMember(memberId: string): TraceEvent[] {
  const selected = members.find((candidate) => candidate.id === memberId) ?? member;
  const recommendation = recommendationFixtureByMember[selected.id] ?? recommendationFixtureByMember[member.id];
  const direction = selected.careerActivity > 30 ? "Shift toward career development" : selected.engagementTrend >= 0 ? "Engagement remains healthy" : "Broad engagement decline";
  return [
    { id:"t1", title:"Fetched membership record", summary:`Renewal is ${selected.renewalDays} days away; annual member value is $${selected.annualValue}.`, tool:"Membership API", input:"Member ID + active consent scope", output:`Active ${selected.membership.toLowerCase()}`, confidence:1, latencyMs:82, cost:0, evidence:["Membership profile"] },
    { id:"t2", title:"Fetched event participation", summary:`Event attendance moved from ${selected.eventsLastYear} last year to ${selected.eventsThisYear} this year.`, tool:"Events API", input:"Member ID + 24-month window", output:`${selected.eventsLastYear + selected.eventsThisYear} attendance records`, confidence:1, latencyMs:116, cost:0, evidence:["Event history"] },
    { id:"t3", title:"Fetched learning history", summary:`The most recent learning session was ${selected.lmsInactiveDays} days ago.`, tool:"Learning API", input:"Member ID + activity scope", output:`Last session: ${selected.lmsInactiveDays} days ago`, confidence:1, latencyMs:94, cost:0, evidence:["LMS activity"] },
    { id:"t4", title:"Fetched community engagement", summary:`Community participation is ${selected.communityActivity.toLowerCase()}.`, tool:"Community API", input:"Member ID + aggregate activity", output:`${selected.communityActivity} activity band`, confidence:.96, latencyMs:103, cost:0, evidence:["Community activity"] },
    { id:"t5", title:"Detected the engagement pattern", summary:recommendation.engagementShift, tool:"Recommendation agent", input:"Six normalized engagement signals", output:direction, confidence:recommendation.confidence, latencyMs:1254, cost:.017, evidence:["Career activity","Event history","LMS activity"] },
    { id:"t6", title:"Generated intervention candidates", summary:`The selected intervention best matches ${selected.name}'s current signals.`, tool:"Recommendation agent", input:"Member context + available programs", output:recommendation.recommendedAction, confidence:recommendation.confidence, latencyMs:906, cost:.014, evidence:["Engagement pattern","Program catalog"] },
    { id:"t7", title:"Evaluated action policy", summary:recommendation.reviewReason, tool:"Policy engine", input:"Action impact + policy set v3.2", output:recommendation.requiresHumanReview ? "Human review required" : "Low-risk action allowed", confidence:1, latencyMs:18, cost:0, evidence:["Action policy"] },
    { id:"t8", title:"Prepared the next step", summary:recommendation.requiresHumanReview ? "The recommendation is held until an authorized decision." : "A reversible outreach draft can now be prepared.", tool:"Outreach service", input:"Policy result + contact preferences", output:recommendation.requiresHumanReview ? "Held for review" : "Ready to draft", confidence:.91, latencyMs:231, cost:.004, evidence:["Communication preferences"] },
  ];
}

export function getDemoRecommendation(memberId: string): AIResponse {
  const selected = members.find((candidate) => candidate.id === memberId) ?? member;
  const recommendation = recommendationFixtureByMember[selected.id] ?? recommendationFixtureByMember[member.id];
  return { ...recommendation, trace:getTraceForMember(selected.id), source:"fixture" };
}

export const trace = getTraceForMember(member.id);

export const initialReview: HumanReview = {
  id: "review-1042", memberId: member.id,
  action: "25% renewal incentive + leadership program invitation",
  confidence: 83, evidenceCount: 6,
  trigger: "Discount exceeds the $50 autonomous-action threshold",
  status: "Pending",
};

export const policies: Policy[] = [
  { id:"a1", outcome:"Auto execute", label:"Confidence ≥ 95%", detail:"Only when the action is reversible and financial impact is under $50." },
  { id:"a2", outcome:"Auto execute", label:"No sensitive fields affected", detail:"The action must use the member's existing permission scope." },
  { id:"h1", outcome:"Human review", label:"Confidence 70%–94%", detail:"A staff member reviews the recommendation and supporting evidence." },
  { id:"h2", outcome:"Human review", label:"Member-facing financial offer", detail:"Financial impact at or above the configured threshold always escalates." },
  { id:"b1", outcome:"Block", label:"Confidence below 70%", detail:"The workflow stops without creating an action." },
  { id:"b2", outcome:"Block", label:"Missing evidence or permission violation", detail:"Critical source failure and irreversible actions also block execution." },
];

export const demoRecommendation = getDemoRecommendation(member.id);
