import { describe, expect, it } from "vitest";
import { demoRecommendation, members, workflows } from "./fixtures";
import { RecommendationSchema } from "@/app/api/recommend/route";

describe("demo domain model", () => {
  it("keeps all three required workflows complete", () => {
    expect(workflows.map((w) => w.id)).toEqual(["membership-retention", "community-moderation", "event-growth"]);
    expect(workflows.every((w) => w.nodes.length >= 6)).toBe(true);
    expect(members).toHaveLength(3);
  });

  it("validates the deterministic recommendation fixture", () => {
    const recommendation = {
      riskSummary: demoRecommendation.riskSummary,
      engagementShift: demoRecommendation.engagementShift,
      recommendedAction: demoRecommendation.recommendedAction,
      supportingEvidence: demoRecommendation.supportingEvidence,
      confidence: demoRecommendation.confidence,
      requiresHumanReview: demoRecommendation.requiresHumanReview,
      reviewReason: demoRecommendation.reviewReason,
    };
    expect(RecommendationSchema.safeParse(recommendation).success).toBe(true);
    expect(demoRecommendation.source).toBe("fixture");
    expect(demoRecommendation.requiresHumanReview).toBe(true);
  });
});
