import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { hammingDistance, perceptualHash } from "./image-similarity";

describe("photo similarity", () => {
  it("creates stable hashes and measures visual distance", async () => {
    const source = await sharp({ create: { width: 120, height: 80, channels: 3, background: "#315f47" } }).png().toBuffer();
    const copy = await sharp(source).resize(600, 400).jpeg().toBuffer();
    const first = await perceptualHash(source);
    const second = await perceptualHash(copy);
    expect(first).toMatch(/^[0-9a-f]{16}$/);
    expect(hammingDistance(first, second)).toBeLessThanOrEqual(3);
    expect(hammingDistance(first, "invalid")).toBe(Number.POSITIVE_INFINITY);
  });
});
