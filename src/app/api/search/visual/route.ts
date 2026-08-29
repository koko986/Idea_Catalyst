import { generateText, Output } from "ai";
import { z } from "zod";
import { listings } from "@/lib/data";
import { listingMatches } from "@/lib/search";

export const runtime = "nodejs";

const resultSchema = z.object({
  category: z.string(),
  keywords: z.array(z.string()).max(8),
  explanation: z.string(),
});

const emptyFilters = { condition: "All", transactionType: "All", credibility: "All", pricingTier: "All" };

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("image");
  if (!(file instanceof File)) return Response.json({ error: "An image is required" }, { status: 400 });
  if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
    return Response.json({ error: "Use a JPG, PNG, or WebP image under 10 MB" }, { status: 400 });
  }

  let query = file.name;
  let explanation = "Matched from image filename and marketplace similarity signals.";
  if (process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { output } = await generateText({
      model: "google/gemini-3.7-flash",
      output: Output.object({ schema: resultSchema }),
      messages: [{
        role: "user",
        content: [
          { type: "text", text: "Identify this second-hand item for visual search. Return broad category and concrete searchable attributes. Do not identify a person." },
          { type: "file", data: bytes, mediaType: file.type },
        ],
      }],
    });
    query = `${output.category} ${output.keywords.join(" ")}`;
    explanation = output.explanation;
  }

  const matched = listings.filter((listing) => listingMatches(listing, query, emptyFilters));
  const results = (matched.length ? matched : listings.filter((listing) => listing.trial)).slice(0, 4);
  return Response.json({ ids: results.map((item) => item.id), explanation });
}
