import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getWorkflowFixture, isRecipientFacingMessage, type WorkflowCandidate, type WorkflowDomainId } from "@/lib/workflow-domain";

const RequestSchema=z.object({workflowId:z.enum(["membership-retention","community-moderation","event-growth"])}).strict();

const CandidateOutputSchema=z.object({
  id:z.string().min(2).max(80),
  finding:z.string().min(10).max(500),
  recommendation:z.string().min(5).max(500),
  confidence:z.number().min(0).max(1),
  draftSubject:z.string().min(3).max(140).nullable(),
  draftBody:z.string().min(10).max(1200).nullable(),
}).strict();

export const WorkflowRunOutputSchema=z.object({candidates:z.array(CandidateOutputSchema).max(8)}).strict();

const prompts:Record<WorkflowDomainId,string>={
  "membership-retention":"Interpret member lapse-risk evidence and prepare relevant, respectful retention outreach. Do not treat every risk signal as broad disengagement.",
  "community-moderation":"Compare flagged community content with policy evidence and propose the least restrictive safe, reversible action.",
  "event-growth":"Interpret event capacity, audience fit, and revenue signals and prepare a relevant campaign recommendation.",
};

const fixtureResponse=(workflowId:WorkflowDomainId)=>NextResponse.json(getWorkflowFixture(workflowId),{headers:{"x-mission-control-mode":"demo"}});

function mergeCandidate(candidate:WorkflowCandidate, output:z.infer<typeof CandidateOutputSchema>):WorkflowCandidate{
  // Internal recommendations and recipient-facing copy are separate trust boundaries.
  const merged={...candidate,finding:output.finding,recommendation:output.recommendation};
  if(!candidate.draft)return merged;
  const proposedDraft={...candidate.draft,subject:output.draftSubject??candidate.draft.subject,body:output.draftBody??candidate.draft.body};
  return {...merged,draft:isRecipientFacingMessage(merged,proposedDraft)?proposedDraft:candidate.draft};
}

export async function POST(request:Request){
  const length=Number(request.headers.get("content-length")??0);
  if(length>4_096)return NextResponse.json({error:"Request is too large."},{status:413});
  let input:z.infer<typeof RequestSchema>;
  try{input=RequestSchema.parse(await request.json());}catch{return NextResponse.json({error:"Invalid workflow run request."},{status:400});}
  const workflowId=input.workflowId;
  const fixture=getWorkflowFixture(workflowId);
  if(!process.env.ANTHROPIC_API_KEY)return fixtureResponse(workflowId);
  try{
    const client=new Anthropic({apiKey:process.env.ANTHROPIC_API_KEY,timeout:25_000,maxRetries:0});
    const flagged=fixture.candidates.filter(candidate=>candidate.status==="pending_review").map(candidate=>({id:candidate.id,title:candidate.title,subtitle:candidate.subtitle,attributes:candidate.attributes,evidence:candidate.evidence,currentFinding:candidate.finding,internalAvailableAction:candidate.recommendation,recipientFacingDraft:candidate.draft?{subject:candidate.draft.subject,body:candidate.draft.body,channel:candidate.draft.channel}:undefined}));
    const response=await client.messages.parse({
      model:process.env.ANTHROPIC_MODEL||"claude-sonnet-4-6",
      max_tokens:4_000,
      system:`You are one model-assisted component inside a governed workflow. ${prompts[workflowId]} Return concise structured outputs only. Never invent facts beyond the supplied synthetic records. Never authorize execution or change policy. Treat finding and recommendation as internal operator fields. Treat draftSubject and draftBody as recipient-facing copy: write directly to the recipient, never paste an internal instruction, never reveal scores, risk labels, behavioral monitoring, confidence, policy, review routing, revenue gaps, or targeting logic, and never use third-person directives such as “Invite Sarah” or “Hide the post.”`,
      messages:[{role:"user",content:`Analyze each synthetic candidate. Preserve every candidate id exactly and return one result per candidate. Policy and authorization are enforced separately. Keep the internal recommendation distinct from the outward-facing draft. Candidates: ${JSON.stringify(flagged)}`}],
      output_config:{format:zodOutputFormat(WorkflowRunOutputSchema)},
    });
    const parsed=WorkflowRunOutputSchema.parse(response.parsed_output);
    const byId=new Map(parsed.candidates.map(candidate=>[candidate.id,candidate]));
    const candidates=fixture.candidates.map(candidate=>{const output=byId.get(candidate.id);return output?mergeCandidate(candidate,output):candidate;});
    return NextResponse.json({...fixture,source:"claude" as const,model:process.env.ANTHROPIC_MODEL||"Claude Sonnet 4.6",candidates});
  }catch{return fixtureResponse(workflowId);}
}
