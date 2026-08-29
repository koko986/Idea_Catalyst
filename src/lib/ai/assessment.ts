import { generateText, Output } from "ai";
import { z } from "zod";

const assessmentSchema = z.object({
  summary: z.string(),
  confidence: z.number().min(0).max(1),
  observations: z.array(z.string()).max(8),
  riskFlags: z.array(z.string()).max(8),
  recommendation: z.enum(["pass", "human_review", "resubmit"]),
});

export type Assessment = z.infer<typeof assessmentSchema> & {
  source: "ai" | "fallback";
  model: string;
};

const model = "google/gemini-3.7-flash";

export async function assessEvidence(input: {
  purpose: "nrc_quality" | "item_condition" | "shipment_match" | "dispute";
  imageUrl?: string;
  notes?: string;
}): Promise<Assessment> {
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
    return {
      summary: "Queued for human review; AI Gateway credentials are not configured.",
      confidence: 0,
      observations: input.notes ? [input.notes] : [],
      riskFlags: ["AI assessment unavailable"],
      recommendation: "human_review",
      source: "fallback",
      model,
    };
  }
  const content: Array<
    | { type: "text"; text: string }
    | { type: "file"; data: URL; mediaType: "image" }
  > = [{
    type: "text",
    text: `Assess this evidence for ${input.purpose}. Be conservative. Report visible facts only; do not make a final identity, counterfeit, or refund decision. Notes: ${input.notes ?? "none"}`,
  }];
  if (input.imageUrl) content.push({ type: "file", data: new URL(input.imageUrl), mediaType: "image" });

  const { output } = await generateText({
    model,
    output: Output.object({ schema: assessmentSchema }),
    messages: [{ role: "user", content }],
  });
  return { ...output, source: "ai", model };
}
