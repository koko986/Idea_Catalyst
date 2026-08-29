import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import { perceptualHash } from "@/lib/image-similarity";

export const runtime = "nodejs";

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (char) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", "\"": "&quot;",
  })[char] ?? char);
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Expected a multipart image upload" }, { status: 400 });
  }
  const file = form.get("image");
  if (!(file instanceof File)) return Response.json({ error: "An image is required" }, { status: 400 });
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 20 * 1024 * 1024) {
    return Response.json({ error: "Use a JPG, PNG, or WebP image under 20 MB" }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = supabase ? await supabase.auth.getUser() : null;
  const user = auth?.data.user;
  if (supabase && !user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const requestedName = String(form.get("sellerName") ?? "Verified seller").slice(0, 60);
  let sellerName = requestedName;
  if (supabase && user) {
    const { data } = await supabase.from("profiles").select("display_name").eq("id", user.id).single();
    sellerName = data?.display_name ?? requestedName;
  }
  const date = new Date().toISOString().slice(0, 10);
  const input = Buffer.from(await file.arrayBuffer());
  const imageHash = await perceptualHash(input);
  const normalized = await sharp(input).rotate().resize({ width: 1600, withoutEnlargement: true }).toBuffer({ resolveWithObject: true });
  const label = `PyanThit · @${sellerName} · ${date}`;
  const overlay = Buffer.from(`
    <svg width="${normalized.info.width}" height="${normalized.info.height}" xmlns="http://www.w3.org/2000/svg">
      <style>.wm{font-family:Arial,sans-serif;font-weight:700;letter-spacing:1px;fill:white;stroke:rgba(0,0,0,.58);stroke-width:3px;paint-order:stroke}</style>
      <text class="wm" x="50%" y="50%" text-anchor="middle" font-size="${Math.max(24, Math.round(normalized.info.width / 26))}" opacity=".38" transform="rotate(-18 ${normalized.info.width / 2} ${normalized.info.height / 2})">${escapeXml(label)}</text>
      <rect x="0" y="${normalized.info.height - 76}" width="${normalized.info.width}" height="76" fill="rgba(15,35,26,.72)"/>
      <text class="wm" x="28" y="${normalized.info.height - 27}" font-size="${Math.max(18, Math.round(normalized.info.width / 42))}">${escapeXml(label)}</text>
    </svg>`);
  const watermarked = await sharp(normalized.data).composite([{ input: overlay }]).webp({ quality: 88 }).toBuffer();

  if (supabase && user) {
    const id = randomUUID();
    await Promise.all([
      supabase.storage.from("listing-originals").upload(`${user.id}/${id}`, input, { contentType: file.type }),
      supabase.storage.from("listing-watermarked").upload(`${user.id}/${id}.webp`, watermarked, { contentType: "image/webp" }),
    ]);
  }

  return new Response(new Uint8Array(watermarked), {
    headers: {
      "Content-Type": "image/webp",
      "Content-Disposition": `inline; filename="pyanthit-${date}.webp"`,
      "X-PyanThit-Seller": sellerName,
      "X-PyanThit-Date": date,
      "X-PyanThit-Perceptual-Hash": imageHash,
      "Cache-Control": "private, no-store",
    },
  });
}
