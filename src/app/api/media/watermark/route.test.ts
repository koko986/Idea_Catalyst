import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("dynamic listing watermark", () => {
  it("returns a dated seller-bound WebP derivative", async () => {
    const source = await sharp({ create: { width: 400, height: 300, channels: 3, background: "#4d7c5c" } }).png().toBuffer();
    const form = new FormData();
    form.set("sellerName", "May Thiri");
    form.set("image", new File([source], "listing.png", { type: "image/png" }));
    const response = await POST(new Request("http://localhost/api/media/watermark", { method: "POST", body: form }));
    const output = Buffer.from(await response.arrayBuffer());
    const metadata = await sharp(output).metadata();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/webp");
    expect(response.headers.get("x-retrust-seller")).toBe("May Thiri");
    expect(response.headers.get("x-retrust-date")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(response.headers.get("x-retrust-perceptual-hash")).toMatch(/^[0-9a-f]{16}$/);
    expect(metadata.format).toBe("webp");
  });
});
