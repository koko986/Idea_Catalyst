import { describe, expect, it } from "vitest";
import {
  getInitials,
  hashPassword,
  normalizeEmail,
  verifyPassword,
} from "@/lib/auth/password";

describe("password hashing", () => {
  it("accepts the correct password and rejects a wrong one", async () => {
    const stored = await hashPassword("Correct-Horse-1");

    await expect(verifyPassword("Correct-Horse-1", stored)).resolves.toBe(true);
    await expect(verifyPassword("correct-horse-1", stored)).resolves.toBe(
      false,
    );
    await expect(verifyPassword("", stored)).resolves.toBe(false);
  });

  it("never stores the password in readable form", async () => {
    const stored = await hashPassword("Correct-Horse-1");

    expect(stored).not.toContain("Correct-Horse-1");
    expect(stored.startsWith("scrypt:")).toBe(true);
  });

  it("salts each hash so identical passwords differ", async () => {
    const first = await hashPassword("Correct-Horse-1");
    const second = await hashPassword("Correct-Horse-1");

    expect(first).not.toBe(second);
    await expect(verifyPassword("Correct-Horse-1", second)).resolves.toBe(true);
  });

  it("rejects malformed or unknown hash formats", async () => {
    await expect(verifyPassword("whatever", "")).resolves.toBe(false);
    await expect(verifyPassword("whatever", "plain:salt:hash")).resolves.toBe(
      false,
    );
    await expect(verifyPassword("whatever", "scrypt:salt")).resolves.toBe(false);
  });
});

describe("account display helpers", () => {
  it("normalises email casing and spacing", () => {
    expect(normalizeEmail("  Person@Example.TEST ")).toBe("person@example.test");
  });

  it("derives initials from names and email addresses", () => {
    expect(getInitials("Demo administrator")).toBe("DA");
    expect(getInitials("may.thiri@example.test")).toBe("MT");
    expect(getInitials("solo@example.test")).toBe("SO");
  });
});
