import { checkoutInputSchema, walletDatabaseError } from "@/lib/wallet";
import { createClient } from "@/lib/supabase/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const input = checkoutInputSchema.safeParse(await request.json());
  if (!input.success) return Response.json({ error: "Invalid checkout request" }, { status: 400 });

  const supabase = await createClient();
  if (!supabase) return Response.json({ error: "Checkout persistence is not configured" }, { status: 503 });
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return Response.json({ error: "Authentication required" }, { status: 401 });

  const listingQuery = supabase.from("listings").select("id");
  const { data: listing, error: listingError } = uuidPattern.test(input.data.listingId)
    ? await listingQuery.eq("id", input.data.listingId).maybeSingle()
    : await listingQuery.eq("slug", input.data.listingId).maybeSingle();
  if (listingError || !listing) return Response.json({ error: "Listing not found" }, { status: 404 });

  const { data: orderId, error } = await supabase.rpc("checkout_and_hold", {
    p_listing_id: listing.id,
    p_trial_mode: input.data.trialMode,
    p_offer_id: input.data.offerId ?? null,
  });
  if (error) {
    const mapped = walletDatabaseError(error.message);
    return Response.json({ error: mapped.message }, { status: mapped.status });
  }
  return Response.json({ orderId }, { status: 201 });
}
