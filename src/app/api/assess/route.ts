import { z } from "zod";
import { assessEvidence } from "@/lib/ai/assessment";
import { createClient } from "@/lib/supabase/server";

const inputSchema = z.object({
  purpose: z.enum(["nrc_quality", "item_condition", "shipment_match", "dispute"]),
  imageUrl: z.url().optional(),
  notes: z.string().max(1000).optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return Response.json({ error: "Authentication required" }, { status: 401 });
  }
  const parsed = inputSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid assessment request" }, { status: 400 });
  try {
    return Response.json(await assessEvidence(parsed.data));
  } catch {
    return Response.json({ error: "Assessment unavailable; evidence remains queued for human review" }, { status: 503 });
  }
}
