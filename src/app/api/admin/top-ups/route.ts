import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return Response.json({ error: "Admin persistence is not configured" }, { status: 503 });
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return Response.json({ error: "Authentication required" }, { status: 401 });

  const { data: role } = await supabase.from("user_roles").select("role")
    .eq("user_id", authData.user.id).in("role", ["moderator", "admin"]).maybeSingle();
  if (!role) return Response.json({ error: "Administrator access is required" }, { status: 403 });

  const { data: requests, error } = await supabase.from("top_up_requests")
    .select("id,request_number,user_id,amount_mmk,transfer_method,transfer_reference,evidence_path,status,rejection_reason,reviewed_at,created_at")
    .order("created_at", { ascending: false }).limit(100);
  if (error) return Response.json({ error: "Unable to load top-up queue" }, { status: 500 });

  const userIds = [...new Set((requests ?? []).map((request) => request.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id,display_name").in("id", userIds)
    : { data: [] as Array<{ id: string; display_name: string }> };
  const names = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name]));

  const queue = await Promise.all((requests ?? []).map(async (request) => {
    const signed = await supabase.storage.from("transaction-evidence")
      .createSignedUrl(request.evidence_path, 5 * 60);
    return {
      id: request.id,
      requestNumber: request.request_number,
      userId: request.user_id,
      userName: names.get(request.user_id) ?? "Member",
      amountMmk: Number(request.amount_mmk),
      transferMethod: request.transfer_method,
      transferReference: request.transfer_reference,
      receiptUrl: signed.data?.signedUrl ?? null,
      status: request.status,
      rejectionReason: request.rejection_reason,
      reviewedAt: request.reviewed_at,
      createdAt: request.created_at,
    };
  }));
  return Response.json({ requests: queue });
}
