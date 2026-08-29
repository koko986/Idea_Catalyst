import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { walletDatabaseError } from "@/lib/wallet";

const reviewSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve") }),
  z.object({ action: z.literal("reject"), reason: z.string().trim().min(3).max(500) }),
]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) {
    return Response.json({ error: "Invalid top-up request" }, { status: 400 });
  }

  const input = reviewSchema.safeParse(await request.json());
  if (!input.success) return Response.json({ error: "A valid review decision is required" }, { status: 400 });

  const supabase = await createClient();
  if (!supabase) return Response.json({ error: "Admin persistence is not configured" }, { status: 503 });
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return Response.json({ error: "Authentication required" }, { status: 401 });

  const { data: role } = await supabase.from("user_roles").select("role")
    .eq("user_id", authData.user.id).in("role", ["moderator", "admin"]).maybeSingle();
  if (!role) return Response.json({ error: "Administrator access is required" }, { status: 403 });

  const result = input.data.action === "approve"
    ? await supabase.rpc("approve_top_up", { p_request_id: id })
    : await supabase.rpc("reject_top_up", { p_request_id: id, p_reason: input.data.reason });
  if (result.error) {
    const mapped = walletDatabaseError(result.error.message);
    return Response.json({ error: mapped.message }, { status: mapped.status });
  }
  return Response.json({ request: result.data });
}
