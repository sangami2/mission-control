import { describe, expect, it } from "vitest";
import { applyGovernanceToRun, defaultGovernanceConfig, getWorkflowFixture, isRecipientFacingMessage } from "./workflow-domain";

describe("cohort workflow fixtures",()=>{
  it("screens a complete membership population and highlights every at-risk member",()=>{
    const run=getWorkflowFixture("membership-retention");
    expect(run.screened).toBe(12);
    const atRisk=run.candidates.filter(candidate=>candidate.score>=60);
    expect(atRisk).toHaveLength(5);
    expect(atRisk.every(candidate=>candidate.status!=="clear")).toBe(true);
    expect(run.candidates.find(candidate=>candidate.title==="Sarah Chen")?.policy.outcome).toBe("individual_review");
    expect(run.candidates.find(candidate=>candidate.title==="Elena Torres")?.policy.outcome).toBe("bulk_eligible");
    expect(run.candidates.find(candidate=>candidate.title==="Owen Brooks")?.policy.outcome).toBe("blocked");
  });

  it("uses domain-specific populations and actions",()=>{
    const moderation=getWorkflowFixture("community-moderation");
    const events=getWorkflowFixture("event-growth");
    expect(moderation.screened).toBe(10);
    expect(moderation.candidates.filter(candidate=>candidate.status==="pending_review")).toHaveLength(4);
    expect(events.screened).toBe(6);
    expect(events.candidates.filter(candidate=>candidate.status==="pending_review")).toHaveLength(3);
    expect(events.candidates.find(candidate=>candidate.title==="Leadership Summit")?.policy.consequential).toBe(true);
  });

  it("provides editable drafts and simulated connector traces without claiming live integrations",()=>{
    const run=getWorkflowFixture("membership-retention");
    const sarah=run.candidates.find(candidate=>candidate.title==="Sarah Chen")!;
    expect(sarah.draft?.body).toContain("Hi Sarah");
    expect(sarah.trace.every(trace=>trace.tool.includes("simulated")||["Engagement scoring","Claude recommendation","Policy engine"].includes(trace.tool))).toBe(true);
  });

  it("keeps internal recommendations out of every recipient-facing draft",()=>{
    for(const workflowId of ["membership-retention","community-moderation","event-growth"] as const){
      const drafted=getWorkflowFixture(workflowId).candidates.filter(candidate=>candidate.draft);
      expect(drafted.length).toBeGreaterThan(0);
      expect(drafted.every(candidate=>isRecipientFacingMessage(candidate,candidate.draft!))).toBe(true);
      expect(drafted.every(candidate=>!candidate.draft!.body.includes(candidate.recommendation))).toBe(true);
    }
    const sarah=getWorkflowFixture("membership-retention").candidates.find(candidate=>candidate.title==="Sarah Chen")!;
    expect(sarah.draft?.body).toContain("We can also offer you 25% off");
    expect(sarah.draft?.body).not.toContain("Invite Sarah");
    expect(sarah.draft?.body).not.toMatch(/participation has changed|lapse risk/i);
  });

  it("rejects model copy that exposes an internal instruction",()=>{
    const sarah=getWorkflowFixture("membership-retention").candidates.find(candidate=>candidate.title==="Sarah Chen")!;
    expect(isRecipientFacingMessage(sarah,{...sarah.draft!,body:"Invite Sarah to the leadership program with a 25% renewal incentive."})).toBe(false);
  });

  it("recalculates actionable queues when a policy version changes",()=>{
    const run=getWorkflowFixture("membership-retention");
    const stricter=applyGovernanceToRun(run,{...defaultGovernanceConfig,bulkApprovalConfidence:99});
    expect(stricter.candidates.find(candidate=>candidate.title==="Elena Torres")?.policy.outcome).toBe("individual_review");
    const blocked=applyGovernanceToRun(run,{...defaultGovernanceConfig,blockBelowConfidence:85});
    expect(blocked.candidates.find(candidate=>candidate.title==="Sarah Chen")?.policy.outcome).toBe("individual_review");
    expect(blocked.candidates.find(candidate=>candidate.title==="Owen Brooks")?.policy.outcome).toBe("blocked");
  });
});
