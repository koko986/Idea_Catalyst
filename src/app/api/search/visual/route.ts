import { generateText, Output } from "ai";
import { z } from "zod";
import { listings } from "@/lib/data";
import { listingMatches } from "@/lib/search";
import { hammingDistance, perceptualHash } from "@/lib/image-similarity";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const resultSchema = z.object({
  category: z.string(),
  keywords: z.array(z.string()).max(8),
  explanation: z.string(),
});

const emptyFilters = { condition: "All", transactionType: "All", credibility: "All", pricingTier: "All" };

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Expected a multipart image upload" }, { status: 400 });
  }
  const file = form.get("image");
  if (!(file instanceof File)) return Response.json({ error: "An image is required" }, { status: 400 });
  if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
    return Response.json({ error: "Use a JPG, PNG, or WebP image under 10 MB" }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  let hash: string;
  try {
    hash = await perceptualHash(bytes);
  } catch {
    return Response.json({ error: "The uploaded image could not be decoded" }, { status: 400 });
  }
  const supabase = await createClient();
  const { data: storedMedia } = supabase
    ? await supabase.from("listing_media").select("listing_id,perceptual_hash").limit(500)
    : { data: null };
  const hashMatches = (storedMedia ?? [])
    .map((item) => ({ id: item.listing_id as string, distance: hammingDistance(hash, item.perceptual_hash as string) }))
    .filter((item) => item.distance <= 12)
    .sort((left, right) => left.distance - right.distance);

  let query = file.name;
  let explanation = "Matched from image filename and marketplace similarity signals.";
  if (process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN) {
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
  const staticIds = new Set(listings.map((item) => item.id));
  const exactIds = hashMatches.map((item) => item.id).filter((id) => staticIds.has(id));
  if (exactIds.length) explanation = `Found ${exactIds.length} identical or near-identical image match${exactIds.length === 1 ? "" : "es"}.`;
  return Response.json({ ids: exactIds.length ? exactIds : results.map((item) => item.id), explanation, perceptualHash: hash });
}
