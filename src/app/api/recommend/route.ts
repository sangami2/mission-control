import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDemoRecommendation, getTraceForMember, members } from "@/lib/fixtures";

const RequestSchema = z.object({
  memberId: z.string().max(80),
  modelStrategy: z.enum(["fast", "balanced", "deep"]),
  architecture: z.enum(["single", "multi", "hybrid"]),
}).strict();

export const RecommendationSchema = z.object({
  riskSummary: z.string().min(10).max(500),
  engagementShift: z.string().min(10).max(500),
  recommendedAction: z.string().min(10).max(500),
  supportingEvidence: z.array(z.string().min(3).max(180)).min(2).max(8),
  confidence: z.number().min(0).max(1),
  requiresHumanReview: z.boolean(),
  reviewReason: z.string().min(5).max(300),
}).strict();

const fixture = (memberId: string) => NextResponse.json(getDemoRecommendation(memberId), { headers: { "x-mission-control-mode": "demo" } });

export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 4_096) return NextResponse.json({ error: "Request is too large." }, { status: 413 });
  let input: z.infer<typeof RequestSchema>;
  try { input = RequestSchema.parse(await request.json()); }
  catch { return NextResponse.json({ error: "Invalid workflow request." }, { status: 400 }); }

  const selectedMember = members.find((member) => member.id === input.memberId);
  if (!selectedMember) return NextResponse.json({ error: "Unknown synthetic member." }, { status: 404 });
  if (!process.env.ANTHROPIC_API_KEY) return fixture(input.memberId);

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 25_000, maxRetries: 0 });
    const response = await client.messages.parse({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
      max_tokens: input.modelStrategy === "deep" ? 1_400 : input.modelStrategy === "fast" ? 700 : 1_000,
      system: "You are a membership-retention recommendation component. Return concise decision summaries and structured evidence. Do not reveal chain-of-thought. Never invent facts beyond the supplied synthetic record. A deterministic policy engine—not you—controls execution.",
      messages: [{ role: "user", content: `Analyze this synthetic member record and propose a precise intervention. Architecture: ${input.architecture}. Record: ${JSON.stringify(selectedMember)}. Policy: member-facing financial offers above $50 require human review; confidence below 70% blocks action; confidence from 70% through 94% requires review; confidence of at least 95% may proceed only when the action is reversible and non-financial.` }],
      output_config: { format: zodOutputFormat(RecommendationSchema) },
    });
    const validated = RecommendationSchema.parse(response.parsed_output);
    return NextResponse.json({ ...validated, trace:getTraceForMember(selectedMember.id), source: "claude" as const });
  } catch {
    // The demo must remain safe and usable during timeouts, quota errors, and malformed output.
    return fixture(input.memberId);
  }
}
