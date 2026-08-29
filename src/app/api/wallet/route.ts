import { topUpInputSchema, type WalletSnapshot } from "@/lib/wallet";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type LedgerRow = {
  id: string;
  kind: string;
  reference: string;
  created_at: string;
  postings: Array<{
    amount_mmk: number;
    ledger_accounts: { owner_id: string | null; kind: string } | null;
  }>;
};

async function authenticatedClient() {
  const supabase = await createClient();
  if (!supabase) return { error: Response.json({ error: "Wallet persistence is not configured" }, { status: 503 }) };
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: Response.json({ error: "Authentication required" }, { status: 401 }) };
  return { supabase, user: data.user };
}

export async function GET() {
  const auth = await authenticatedClient();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;

  const [balanceResult, requestsResult, journalsResult] = await Promise.all([
    supabase.from("wallet_balances").select("available_mmk,held_mmk").eq("user_id", user.id).maybeSingle(),
    supabase.from("top_up_requests")
      .select("id,request_number,amount_mmk,transfer_method,transfer_reference,status,rejection_reason,created_at")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    supabase.from("journal_entries")
      .select("id,kind,reference,created_at,postings(amount_mmk,ledger_accounts(owner_id,kind))")
      .order("created_at", { ascending: false }).limit(30),
  ]);

  const firstError = balanceResult.error ?? requestsResult.error ?? journalsResult.error;
  if (firstError) return Response.json({ error: "Unable to load wallet" }, { status: 500 });

  const ledgerRows = (journalsResult.data ?? []) as unknown as LedgerRow[];
  const snapshot: WalletSnapshot = {
    availableMmk: Number(balanceResult.data?.available_mmk ?? 0),
    heldMmk: Number(balanceResult.data?.held_mmk ?? 0),
    requests: (requestsResult.data ?? []).map((request) => ({
      id: request.id,
      requestNumber: request.request_number,
      amountMmk: Number(request.amount_mmk),
      transferMethod: request.transfer_method,
      transferReference: request.transfer_reference,
      status: request.status,
      rejectionReason: request.rejection_reason,
      createdAt: request.created_at,
    })),
    activity: ledgerRows.map((entry) => {
      const walletPosting = entry.postings.find((posting) =>
        posting.ledger_accounts?.owner_id === user.id && posting.ledger_accounts.kind === "user_available");
      return {
        id: entry.id,
        label: `${entry.kind.replaceAll("_", " ")} · ${entry.reference}`,
        amountMmk: Number(walletPosting?.amount_mmk ?? 0),
        note: new Date(entry.created_at).toLocaleDateString("en-US", { dateStyle: "medium" }),
      };
    }),
  };
  return Response.json(snapshot);
}

export async function POST(request: Request) {
  const auth = await authenticatedClient();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Expected a multipart top-up request" }, { status: 400 });
  }

  const input = topUpInputSchema.safeParse({
    amountMmk: form.get("amountMmk"),
    transferMethod: form.get("transferMethod"),
    transferReference: form.get("transferReference"),
  });
  const evidence = form.get("evidence");
  if (!input.success || !(evidence instanceof File)) {
    return Response.json({ error: "Amount, transfer details, and receipt are required" }, { status: 400 });
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(evidence.type) || evidence.size > 10 * 1024 * 1024) {
    return Response.json({ error: "Use a JPG, PNG, or WebP receipt under 10 MB" }, { status: 400 });
  }

  const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[evidence.type];
  const evidencePath = `${user.id}/top-ups/${crypto.randomUUID()}.${extension}`;
  const upload = await supabase.storage.from("transaction-evidence").upload(
    evidencePath,
    Buffer.from(await evidence.arrayBuffer()),
    { contentType: evidence.type, upsert: false },
  );
  if (upload.error) return Response.json({ error: "Unable to upload payment receipt" }, { status: 500 });

  const { data, error } = await supabase.from("top_up_requests").insert({
    user_id: user.id,
    amount_mmk: input.data.amountMmk,
    transfer_method: input.data.transferMethod,
    transfer_reference: input.data.transferReference,
    evidence_path: evidencePath,
  }).select("id,request_number,status").single();

  if (error) {
    const duplicate = error.code === "23505";
    return Response.json(
      { error: duplicate ? "This transfer reference was already submitted" : "Unable to create top-up request" },
      { status: duplicate ? 409 : 500 },
    );
  }
  return Response.json({
    id: data.id,
    requestNumber: data.request_number,
    status: data.status,
  }, { status: 201 });
}
