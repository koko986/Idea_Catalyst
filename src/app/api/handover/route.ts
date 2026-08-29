import { randomUUID } from "node:crypto";
import { z } from "zod";
import { signHandoverToken } from "@/lib/domain";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  orderId: z.uuid(),
  actor: z.enum(["buyer", "seller"]),
});

export async function POST(request: Request) {
  const secret = process.env.HANDOVER_TOKEN_SECRET;
  if (!secret) return Response.json({ error: "Handover signing is not configured" }, { status: 503 });
  const input = schema.safeParse(await request.json());
  if (!input.success) return Response.json({ error: "Invalid handover request" }, { status: 400 });
  const supabase = await createClient();
  if (!supabase) return Response.json({ error: "Handover persistence is not configured" }, { status: 503 });
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const { data: order } = await supabase.from("orders").select("buyer_id,seller_id").eq("id", input.data.orderId).single();
  const expected = input.data.actor === "buyer" ? order?.buyer_id : order?.seller_id;
  if (expected !== authData.user.id) return Response.json({ error: "Not authorized for this handover" }, { status: 403 });

  const expiresAt = Date.now() + 10 * 60_000;
  const nonce = randomUUID();
  const token = signHandoverToken({ ...input.data, expiresAt, nonce }, secret);
  const tokenHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  const hash = Buffer.from(tokenHash).toString("hex");
  const { error } = await supabase.from("handover_tokens").insert({
    order_id: input.data.orderId,
    actor: input.data.actor,
    token_hash: hash,
    expires_at: new Date(expiresAt).toISOString(),
  });
  if (error) return Response.json({ error: "Unable to create handover token" }, { status: 409 });
  return Response.json({ token, expiresAt });
}
