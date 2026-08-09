import { afterEach, describe, expect, it } from "vitest";
import { POST } from "./route";

const request=(body:unknown)=>new Request("http://localhost/api/workflow-runs",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});

describe("batch workflow API",()=>{
  const original=process.env.ANTHROPIC_API_KEY;
  afterEach(()=>{process.env.ANTHROPIC_API_KEY=original});

  it("returns labeled fixtures for every workflow without an API key",async()=>{
    delete process.env.ANTHROPIC_API_KEY;
    for(const workflowId of ["membership-retention","community-moderation","event-growth"]){
      const response=await POST(request({workflowId}));
      const data=await response.json();
      expect(response.status).toBe(200);
      expect(response.headers.get("x-mission-control-mode")).toBe("demo");
      expect(data.workflowId).toBe(workflowId);
      expect(data.source).toBe("fixture");
      expect(data.candidates.length).toBeGreaterThan(5);
    }
  });

  it("rejects unknown, malformed, and oversized requests",async()=>{
    expect((await POST(request({workflowId:"unknown"}))).status).toBe(400);
    expect((await POST(request({workflowId:"membership-retention",extra:true}))).status).toBe(400);
    const oversized=new Request("http://localhost/api/workflow-runs",{method:"POST",headers:{"content-length":"5000"},body:"{}"});
    expect((await POST(oversized)).status).toBe(413);
  });
});
