import type { TraceEvent } from "./types";

export type WorkflowDomainId = "membership-retention" | "community-moderation" | "event-growth";
export type CandidateStatus = "clear" | "flagged" | "blocked" | "pending_review" | "sending" | "completed" | "rejected";
export type PolicyOutcome = "bulk_eligible" | "individual_review" | "blocked" | "no_action";

export interface MessageDraft {
  recipient: string;
  subject: string;
  body: string;
  channel: "Email" | "Community" | "Campaign";
}

type DraftContent = Pick<MessageDraft, "subject" | "body">;

export interface WorkflowCandidate {
  id: string;
  workflowId: WorkflowDomainId;
  title: string;
  subtitle: string;
  score: number;
  scoreLabel: string;
  riskBand: "High" | "Moderate" | "Monitor" | "Healthy";
  status: CandidateStatus;
  attributes: Array<{ label: string; value: string }>;
  evidence: string[];
  finding: string;
  recommendation: string;
  confidence: number;
  policy: { outcome: PolicyOutcome; reason: string; consequential: boolean };
  draft?: MessageDraft;
  trace: TraceEvent[];
}

export interface WorkflowRun {
  workflowId: WorkflowDomainId;
  source: "claude" | "fixture";
  model: string;
  ranAt: string;
  screened: number;
  candidates: WorkflowCandidate[];
}

export interface ActionRecord {
  id: string;
  workflowId: WorkflowDomainId;
  candidateId: string;
  title: string;
  subtitle: string;
  action: string;
  message?: MessageDraft;
  reviewer: string;
  status: "Sent (simulated)" | "Applied (simulated)" | "Active (simulated)";
  timestamp: string;
}

export interface GovernanceConfig {
  blockBelowConfidence: number;
  bulkApprovalConfidence: number;
  bulkApprovalEnabled: boolean;
  financialActionsRequireIndividualReview: true;
  consentRequired: true;
}

export const defaultGovernanceConfig:GovernanceConfig={
  blockBelowConfidence:70,
  bulkApprovalConfidence:95,
  bulkApprovalEnabled:true,
  financialActionsRequireIndividualReview:true,
  consentRequired:true,
};

const internalMessageLanguage = [
  /\b(?:lapse risk|risk score|engagement (?:changed|declined|shifted)|confidence score|policy (?:gate|result)|human review|agent recommendation|target audience|revenue gap)\b/i,
  /\b(?:we noticed|our system noticed|we detected) your (?:activity|engagement|participation)\b/i,
  /\bselected (?:this|you) based on (?:your )?(?:activity|behavior|engagement|participation)\b/i,
  /(?:^|\n)\s*(?:invite|offer|send|hide|hold|restrict|escalate|notify|issue|continue monitoring)\b/i,
];

export function isRecipientFacingMessage(candidate:WorkflowCandidate,draft:MessageDraft):boolean{
  const copy=`${draft.subject}\n${draft.body}`.trim();
  if(!draft.subject.trim()||!draft.body.trim())return false;
  if(copy.toLocaleLowerCase().includes(candidate.recommendation.trim().toLocaleLowerCase()))return false;
  return !internalMessageLanguage.some(pattern=>pattern.test(copy));
}

export function applyGovernance(candidate:WorkflowCandidate,config:GovernanceConfig):WorkflowCandidate{
  if(candidate.status==="completed"||candidate.status==="sending"||candidate.status==="rejected"||candidate.policy.outcome==="no_action")return candidate;
  const permanentlyBlocked=!candidate.draft&&candidate.status!=="clear";
  if(permanentlyBlocked)return {...candidate,status:"blocked",policy:{...candidate.policy,outcome:"blocked",reason:"Critical evidence or communication consent is missing. Policy blocks the action."}};
  if(candidate.confidence<config.blockBelowConfidence/100)return {...candidate,status:"blocked",policy:{...candidate.policy,outcome:"blocked",reason:`Evaluated confidence is below the ${config.blockBelowConfidence}% action floor.`}};
  if(candidate.policy.consequential)return {...candidate,status:"pending_review",policy:{...candidate.policy,outcome:"individual_review",reason:candidate.workflowId==="community-moderation"?"Consequential moderation requires an individual decision.":"A member-facing financial action requires individual approval."}};
  if(config.bulkApprovalEnabled&&candidate.confidence>=config.bulkApprovalConfidence/100)return {...candidate,status:"pending_review",policy:{...candidate.policy,outcome:"bulk_eligible",reason:`Reversible, non-financial action meets the ${config.bulkApprovalConfidence}% bulk-approval threshold.`}};
  return {...candidate,status:"pending_review",policy:{...candidate.policy,outcome:"individual_review",reason:`Confidence below ${config.bulkApprovalConfidence}% requires individual review.`}};
}

export function applyGovernanceToRun(run:WorkflowRun,config:GovernanceConfig):WorkflowRun{
  return {...run,candidates:run.candidates.map(candidate=>applyGovernance(candidate,config))};
}

type MemberRecord = {
  id: string; name: string; type: string; email: string; renewalDays: number; value: number; risk: number;
  engagement: number; events: string; learning: string; community: string; career: string;
  confidence: number; consent: boolean; financial: boolean; finding: string; recommendation: string; message?: DraftContent;
};

const memberRecords: MemberRecord[] = [
  { id:"mem-sarah", name:"Sarah Chen", type:"Professional Member", email:"sarah.chen@example.org", renewalDays:37, value:425, risk:78, engagement:-61, events:"5 → 1", learning:"Inactive 110 days", community:"Moderate", career:"+42%", confidence:.87, consent:true, financial:true, finding:"Engagement shifted away from events and learning toward career development.", recommendation:"Invite Sarah to the leadership program with a 25% renewal incentive.", message:{subject:"Leadership development and a renewal option for you",body:"Hi Sarah,\n\nWe thought the upcoming Leadership Development Program could be a useful fit for your professional goals. It brings together practical sessions, peer discussion, and experienced association leaders.\n\nWe can also offer you 25% off your next membership renewal. If you’re interested, reply to this email and our Member Success team will help with the program and renewal details.\n\nThere’s no obligation—we’re happy to help you choose what is most useful to you.\n\nBest,\nMember Success Team"} },
  { id:"mem-elena", name:"Elena Torres", type:"Student Member", email:"elena.torres@example.org", renewalDays:18, value:95, risk:69, engagement:-38, events:"2 → 0", learning:"Inactive 45 days", community:"Low", career:"+64%", confidence:.96, consent:true, financial:false, finding:"Career interest is rising despite lower event and community participation.", recommendation:"Invite Elena to the career fair and student mentoring program before renewal.", message:{subject:"Career fair and mentoring opportunities for you",body:"Hi Elena,\n\nRegistration is open for our Early Career Fair and Student Mentoring Program. Both are designed to help members meet employers, practice career conversations, and connect with experienced professionals.\n\nIf either opportunity sounds useful, reply to this email and we’ll help you find the right next step.\n\nBest,\nMember Success Team"} },
  { id:"mem-priya", name:"Priya Nair", type:"Executive Member", email:"priya.nair@example.org", renewalDays:24, value:780, risk:82, engagement:-54, events:"4 → 1", learning:"Inactive 73 days", community:"Low", career:"+12%", confidence:.91, consent:true, financial:true, finding:"A broad decline and near-term renewal indicate a relationship risk.", recommendation:"Offer a personal success call and a 20% executive-program renewal credit.", message:{subject:"A personal membership check-in and renewal option",body:"Hi Priya,\n\nWe’d value the chance to learn what would make your membership more useful in the year ahead. A member of our success team can schedule a brief call at a time that works for you.\n\nWe can also provide a 20% renewal credit for the Executive Program. Reply to this email if you’d like to talk through either option.\n\nBest,\nMember Success Team"} },
  { id:"mem-jordan", name:"Jordan Lee", type:"Professional Member", email:"jordan.lee@example.org", renewalDays:41, value:425, risk:73, engagement:-43, events:"3 → 1", learning:"Active 19 days ago", community:"Moderate", career:"+31%", confidence:.92, consent:true, financial:false, finding:"Learning remains current while events declined, suggesting a format mismatch.", recommendation:"Invite Jordan to the virtual leadership series with a personal note.", message:{subject:"A flexible leadership program you may enjoy",body:"Hi Jordan,\n\nOur Virtual Leadership Series is opening a new cohort, with short online sessions designed for members who want practical development without additional travel.\n\nIf you’d like the schedule or program details, reply to this email and we’ll send them over.\n\nBest,\nMember Success Team"} },
  { id:"mem-owen", name:"Owen Brooks", type:"Professional Member", email:"owen.brooks@example.org", renewalDays:29, value:425, risk:64, engagement:-35, events:"2 → 0", learning:"Unknown", community:"Low", career:"Unknown", confidence:.68, consent:false, financial:false, finding:"Risk signals exist, but evidence and communication permission are incomplete.", recommendation:"Do not contact Owen until consent and missing learning data are resolved." },
  { id:"mem-marcus", name:"Marcus Reed", type:"Executive Member", email:"marcus.reed@example.org", renewalDays:92, value:780, risk:34, engagement:8, events:"3 → 4", learning:"Active 12 days ago", community:"High", career:"+5%", confidence:.97, consent:true, financial:false, finding:"Engagement is healthy across channels.", recommendation:"No retention outreach needed." },
  { id:"mem-amara", name:"Amara Okafor", type:"Professional Member", email:"amara.okafor@example.org", renewalDays:76, value:425, risk:48, engagement:-12, events:"2 → 2", learning:"Active 31 days ago", community:"Moderate", career:"+9%", confidence:.9, consent:true, financial:false, finding:"Minor variation does not indicate immediate lapse risk.", recommendation:"Continue monitoring." },
  { id:"mem-luis", name:"Luis Martinez", type:"Student Member", email:"luis.martinez@example.org", renewalDays:112, value:95, risk:22, engagement:18, events:"1 → 3", learning:"Active 5 days ago", community:"High", career:"+27%", confidence:.98, consent:true, financial:false, finding:"Engagement is growing.", recommendation:"No retention outreach needed." },
  { id:"mem-mei", name:"Mei Wong", type:"Professional Member", email:"mei.wong@example.org", renewalDays:58, value:425, risk:55, engagement:-20, events:"4 → 2", learning:"Active 23 days ago", community:"High", career:"+2%", confidence:.88, consent:true, financial:false, finding:"Mixed signals warrant monitoring, not intervention.", recommendation:"Continue monitoring." },
  { id:"mem-noah", name:"Noah Williams", type:"Professional Member", email:"noah.williams@example.org", renewalDays:130, value:425, risk:19, engagement:25, events:"2 → 5", learning:"Active 8 days ago", community:"High", career:"+11%", confidence:.98, consent:true, financial:false, finding:"Participation is increasing across channels.", recommendation:"No retention outreach needed." },
  { id:"mem-fatima", name:"Fatima Zahra", type:"Executive Member", email:"fatima.zahra@example.org", renewalDays:67, value:780, risk:42, engagement:-4, events:"5 → 4", learning:"Active 14 days ago", community:"Moderate", career:"+16%", confidence:.94, consent:true, financial:false, finding:"Engagement is stable with a modest shift toward career content.", recommendation:"Continue monitoring." },
  { id:"mem-ben", name:"Ben Carter", type:"Student Member", email:"ben.carter@example.org", renewalDays:84, value:95, risk:29, engagement:14, events:"1 → 2", learning:"Active 16 days ago", community:"Moderate", career:"+33%", confidence:.96, consent:true, financial:false, finding:"Healthy career and event engagement indicate low risk.", recommendation:"No retention outreach needed." },
];

const traceFor = (id:string, domain:WorkflowDomainId, evidence:string[], finding:string, recommendation:string, confidence:number): TraceEvent[] => {
  const tools = domain === "membership-retention"
    ? ["Membership connector (simulated)","Engagement scoring","Context service (simulated)","Claude recommendation","Policy engine"]
    : domain === "community-moderation"
      ? ["Community stream (simulated)","Content classifier","Policy library (simulated)","Claude evidence review","Policy engine"]
      : ["Events connector (simulated)","Opportunity scoring","Audience service (simulated)","Claude campaign planner","Policy engine"];
  const summaries = ["Retrieved the approved workflow record.","Calculated a reproducible priority score.",`Grounded the case in ${evidence.length} evidence signals.`,finding,recommendation];
  return tools.map((tool,index)=>({id:`${id}-trace-${index}`,title:summaries[index],summary:summaries[index],tool,input:index===3?"Approved context + available actions":"Workflow-scoped synthetic inputs",output:index===3?recommendation:index===4?"Policy decision recorded":"Structured result",confidence:index===3?confidence:1,latencyMs:[86,18,112,904,16][index],cost:index===3?.014:0,evidence:index>=2?evidence.slice(0,3):["Synthetic source record"]}));
};

const riskBand = (score:number): WorkflowCandidate["riskBand"] => score>=75?"High":score>=60?"Moderate":score>=40?"Monitor":"Healthy";

function retentionCandidates(): WorkflowCandidate[] {
  return memberRecords.map((member)=>{
    const actionable=member.risk>=60;
    const blocked=actionable&&(!member.consent||member.confidence<.7);
    const outcome:PolicyOutcome=!actionable?"no_action":blocked?"blocked":member.financial||member.confidence<.95?"individual_review":"bulk_eligible";
    const evidence=[`Renewal in ${member.renewalDays} days`,`Engagement ${member.engagement}%`,`Events ${member.events}`,member.learning,`Career activity ${member.career}`];
    const draft=actionable&&!blocked&&member.message?{recipient:member.email,...member.message,channel:"Email" as const}:undefined;
    const policyReason=!actionable?"Risk is below the intervention threshold.":blocked?"Outreach is blocked because consent or critical evidence is missing.":outcome==="bulk_eligible"?"Reversible, non-financial outreach with at least 95% confidence.":member.financial?"A member-facing financial offer requires individual approval.":"Confidence below 95% requires individual review.";
    return {id:member.id,workflowId:"membership-retention",title:member.name,subtitle:`${member.type} · Renewal in ${member.renewalDays} days`,score:member.risk,scoreLabel:"Lapse risk",riskBand:riskBand(member.risk),status:!actionable?"clear":blocked?"blocked":"pending_review",attributes:[{label:"Annual value",value:`$${member.value}`},{label:"Engagement",value:`${member.engagement}%`},{label:"Events",value:member.events},{label:"Learning",value:member.learning},{label:"Community",value:member.community},{label:"Career activity",value:member.career}],evidence,finding:member.finding,recommendation:member.recommendation,confidence:member.confidence,policy:{outcome,reason:policyReason,consequential:member.financial},draft,trace:traceFor(member.id,"membership-retention",evidence,member.finding,member.recommendation,member.confidence)};
  });
}

type ModerationSeed={id:string;author:string;channel:string;excerpt:string;score:number;category:string;confidence:number;action:string;finding:string;bulk:boolean;flagged:boolean;message?:DraftContent};
const moderationSeeds:ModerationSeed[]=[
  {id:"post-104",author:"VendorBoost",channel:"Member Exchange",excerpt:"Limited offer—buy followers and guaranteed leads today.",score:98,category:"Commercial spam",confidence:.99,action:"Hide the post and notify the author.",finding:"The post is unsolicited commercial promotion with a deceptive engagement claim.",bulk:true,flagged:true,message:{subject:"Your Member Exchange post was removed",body:"We removed your recent Member Exchange post because unsolicited commercial promotions and guaranteed-outcome claims are not permitted under our community guidelines.\n\nIf you believe we misunderstood the post, you can request a moderator review from your community account."}},
  {id:"post-118",author:"Riley P.",channel:"Leadership Forum",excerpt:"You clearly have no idea what you are doing. Stop embarrassing yourself.",score:84,category:"Targeted harassment",confidence:.92,action:"Hide the reply and issue a conduct warning.",finding:"The reply targets another member with a personal attack rather than challenging an idea.",bulk:false,flagged:true,message:{subject:"A conduct notice about your Leadership Forum reply",body:"We temporarily hid your recent Leadership Forum reply because it includes a personal attack directed at another member. Our guidelines welcome disagreement about ideas, but not insults aimed at individuals.\n\nPlease keep future replies focused on the topic. You can request a moderator review if you believe this decision was made in error."}},
  {id:"post-127",author:"HealthNow22",channel:"General",excerpt:"This treatment is proven to cure every case—doctors are hiding it.",score:76,category:"Potential misinformation",confidence:.78,action:"Hold the post and escalate to a subject-matter moderator.",finding:"A high-impact health claim lacks a source and requires expert review.",bulk:false,flagged:true,message:{subject:"Your General channel post is awaiting review",body:"We placed your recent General channel post on hold while a subject-matter moderator reviews its health claim and supporting sources. The post will remain unavailable during that review.\n\nYou may add a credible source or request an update through your community account."}},
  {id:"post-131",author:"Anonymous member",channel:"Local Chapter",excerpt:"Someone should make the organizer regret showing up tomorrow.",score:96,category:"Possible threat",confidence:.96,action:"Restrict visibility and escalate immediately to a senior moderator.",finding:"The language implies a targeted threat and has high potential impact.",bulk:false,flagged:true,message:{subject:"Urgent notice about your Local Chapter post",body:"We restricted visibility of your recent Local Chapter post because its wording may be interpreted as a threat toward another person. A senior moderator is reviewing it now.\n\nDo not repost the message or contact the named individual through the community while that review is in progress."}},
  {id:"post-139",author:"Dana K.",channel:"Career Network",excerpt:"Here are three interview notes that helped me prepare this week.",score:8,category:"Allowed",confidence:.98,action:"No action.",finding:"Constructive professional advice with no policy match.",bulk:false,flagged:false},
  {id:"post-142",author:"Samir H.",channel:"Events",excerpt:"Does anyone want to meet before the opening keynote?",score:5,category:"Allowed",confidence:.99,action:"No action.",finding:"Normal event coordination.",bulk:false,flagged:false},
  {id:"post-144",author:"Leah M.",channel:"General",excerpt:"I disagree with this proposal because the budget assumptions are incomplete.",score:12,category:"Allowed disagreement",confidence:.97,action:"No action.",finding:"Direct but policy-compliant disagreement focused on the proposal.",bulk:false,flagged:false},
  {id:"post-147",author:"Chapter North",channel:"Announcements",excerpt:"Registration closes Friday for our volunteer orientation.",score:4,category:"Allowed",confidence:.99,action:"No action.",finding:"Routine chapter announcement.",bulk:false,flagged:false},
  {id:"post-151",author:"Maya R.",channel:"Learning",excerpt:"Can someone recommend an introductory finance course?",score:3,category:"Allowed",confidence:.99,action:"No action.",finding:"Relevant learning request.",bulk:false,flagged:false},
  {id:"post-155",author:"Theo B.",channel:"Member Exchange",excerpt:"Selling two unused conference tickets at face value.",score:22,category:"Monitor",confidence:.9,action:"No action; continue monitoring.",finding:"Marketplace content appears permitted but should remain observable.",bulk:false,flagged:false},
];

function moderationCandidates():WorkflowCandidate[]{return moderationSeeds.map(seed=>{const outcome:PolicyOutcome=!seed.flagged?"no_action":seed.bulk?"bulk_eligible":"individual_review";const evidence=[`Policy category: ${seed.category}`,`Channel: ${seed.channel}`,`Confidence ${Math.round(seed.confidence*100)}%`];const draft=seed.flagged&&seed.message?{recipient:seed.author,...seed.message,channel:"Community" as const}:undefined;return {id:seed.id,workflowId:"community-moderation",title:seed.author,subtitle:`${seed.channel} · “${seed.excerpt}”`,score:seed.score,scoreLabel:"Policy risk",riskBand:riskBand(seed.score),status:seed.flagged?"pending_review":"clear",attributes:[{label:"Classification",value:seed.category},{label:"Channel",value:seed.channel},{label:"Confidence",value:`${Math.round(seed.confidence*100)}%`},{label:"Proposed action",value:seed.action}],evidence,finding:seed.finding,recommendation:seed.action,confidence:seed.confidence,policy:{outcome,reason:seed.bulk?"High-confidence, reversible spam removal is eligible for bulk review.":seed.flagged?"Ambiguous or consequential moderation requires an individual decision.":"No policy violation requires action.",consequential:seed.flagged&&!seed.bulk},draft,trace:traceFor(seed.id,"community-moderation",evidence,seed.finding,seed.action,seed.confidence)};});}

type EventSeed={id:string;name:string;date:string;registrations:number;capacity:number;revenueGap:string;score:number;audience:string;confidence:number;offer:string;financial:boolean;finding:string;message?:DraftContent};
const eventSeeds:EventSeed[]=[
  {id:"event-leadership",name:"Leadership Summit",date:"Oct 18",registrations:312,capacity:500,revenueGap:"$28K",score:92,audience:"240 career-engaged professional members",confidence:.91,offer:"Offer a 15% registration incentive with a leadership-track message.",financial:true,finding:"High career interest and unused capacity create a strong, time-sensitive opportunity.",message:{subject:"Save 15% on the Leadership Summit",body:"Join us for the Leadership Summit on Oct 18 for practical leadership sessions, peer discussion, and new professional connections.\n\nUse code LEAD15 when you register to receive 15% off. Space is limited, and we’d be glad to welcome you.\n\nManage your event preferences at any time from your member profile."}},
  {id:"event-virtual",name:"Virtual Leadership Series",date:"Sep 06",registrations:184,capacity:300,revenueGap:"$9K",score:84,audience:"175 members whose event attendance declined",confidence:.96,offer:"Send a no-discount invitation emphasizing the flexible virtual format.",financial:false,finding:"The virtual format directly addresses the audience’s recent attendance decline.",message:{subject:"Leadership development—wherever you are",body:"The Virtual Leadership Series begins Sep 06 with focused online sessions you can join from anywhere. Explore practical topics, meet peers, and take part without adding travel to your schedule.\n\nView the session schedule and reserve your place when you’re ready.\n\nManage your event preferences at any time from your member profile."}},
  {id:"event-career",name:"Early Career Fair",date:"Nov 02",registrations:126,capacity:220,revenueGap:"$6K",score:76,audience:"130 student and early-career members",confidence:.97,offer:"Invite the matched audience with mentor-office-hours highlighted.",financial:false,finding:"Career activity is growing sharply among the matched student segment.",message:{subject:"Meet employers and mentors at the Early Career Fair",body:"The Early Career Fair is coming up on Nov 02. Meet participating employers, join mentor office hours, and get practical guidance for your next career step.\n\nRegistration is open now, and your member access is included.\n\nManage your event preferences at any time from your member profile."}},
  {id:"event-policy",name:"Public Policy Forum",date:"Dec 11",registrations:205,capacity:240,revenueGap:"$2K",score:45,audience:"90 policy-engaged members",confidence:.9,offer:"Continue organic promotion.",financial:false,finding:"Registration is near target, so additional campaign pressure is unnecessary."},
  {id:"event-gala",name:"Annual Awards Gala",date:"Dec 19",registrations:430,capacity:450,revenueGap:"$1K",score:28,audience:"Executive and sponsor community",confidence:.97,offer:"No new campaign.",financial:false,finding:"The event is nearly full."},
  {id:"event-workshop",name:"Chapter Operations Workshop",date:"Jan 14",registrations:74,capacity:100,revenueGap:"$1.5K",score:52,audience:"Chapter administrators",confidence:.89,offer:"Continue monitoring registrations.",financial:false,finding:"The opportunity is real but below the activation threshold."},
];

function eventCandidates():WorkflowCandidate[]{return eventSeeds.map(seed=>{const actionable=seed.score>=70;const outcome:PolicyOutcome=!actionable?"no_action":seed.financial||seed.confidence<.95?"individual_review":"bulk_eligible";const evidence=[`${seed.registrations} of ${seed.capacity} registrations`,`Revenue gap ${seed.revenueGap}`,seed.audience];const draft=actionable&&seed.message?{recipient:seed.audience,...seed.message,channel:"Campaign" as const}:undefined;return {id:seed.id,workflowId:"event-growth",title:seed.name,subtitle:`${seed.date} · ${seed.registrations}/${seed.capacity} registered`,score:seed.score,scoreLabel:"Growth opportunity",riskBand:riskBand(seed.score),status:actionable?"pending_review":"clear",attributes:[{label:"Registrations",value:`${seed.registrations} / ${seed.capacity}`},{label:"Revenue gap",value:seed.revenueGap},{label:"Audience",value:seed.audience},{label:"Confidence",value:`${Math.round(seed.confidence*100)}%`}],evidence,finding:seed.finding,recommendation:seed.offer,confidence:seed.confidence,policy:{outcome,reason:!actionable?"Opportunity is below the campaign threshold.":seed.financial?"A financial offer requires individual approval.":outcome==="bulk_eligible"?"High-confidence, non-financial campaign eligible for bulk review.":"Confidence below 95% requires individual review.",consequential:seed.financial},draft,trace:traceFor(seed.id,"event-growth",evidence,seed.finding,seed.offer,seed.confidence)};});}

export function getWorkflowFixture(workflowId:WorkflowDomainId):WorkflowRun{
  const candidates=workflowId==="membership-retention"?retentionCandidates():workflowId==="community-moderation"?moderationCandidates():eventCandidates();
  return {workflowId,source:"fixture",model:"Safe fixture",ranAt:new Date().toISOString(),screened:candidates.length,candidates};
}

export const workflowLabels:Record<WorkflowDomainId,{population:string;candidate:string;action:string}>={
  "membership-retention":{population:"members",candidate:"at-risk members",action:"Outreach"},
  "community-moderation":{population:"posts",candidate:"flagged posts",action:"Moderation actions"},
  "event-growth":{population:"events",candidate:"growth opportunities",action:"Activations"},
};
