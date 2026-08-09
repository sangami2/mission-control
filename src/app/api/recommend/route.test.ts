import { afterEach, describe, expect, it } from "vitest";
import { POST } from "./route";

const request = (body: unknown) => new Request("http://localhost/api/recommend", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify(body) });

describe("recommendation API fallback", () => {
  const original = process.env.ANTHROPIC_API_KEY;
  afterEach(() => { process.env.ANTHROPIC_API_KEY = original; });

  it("returns a labeled, validated fixture without an API key", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const response = await POST(request({ memberId:"mem-sarah-chen", modelStrategy:"balanced", architecture:"hybrid" }));
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get("x-mission-control-mode")).toBe("demo");
    expect(data.source).toBe("fixture");
    expect(data.trace.length).toBeGreaterThan(5);
  });

  it("rejects malformed and oversized inputs", async () => {
    const malformed = await POST(request({ memberId:"mem-sarah-chen", modelStrategy:"unknown", architecture:"hybrid" }));
    expect(malformed.status).toBe(400);
    const oversized = new Request("http://localhost/api/recommend", { method:"POST", headers:{"content-length":"5000"}, body:"{}" });
    expect((await POST(oversized)).status).toBe(413);
  });

  it("uses the selected synthetic member and rejects unknown IDs", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const marcus = await POST(request({ memberId:"mem-marcus-reed", modelStrategy:"fast", architecture:"hybrid" }));
    const data = await marcus.json();
    expect(data.trace[0].summary).toContain("92 days");
    expect(data.recommendedAction).toContain("Marcus");
    const unknown = await POST(request({ memberId:"mem-unknown", modelStrategy:"fast", architecture:"hybrid" }));
    expect(unknown.status).toBe(404);
  });
});
