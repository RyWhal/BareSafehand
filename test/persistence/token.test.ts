import { describe, expect, it } from "vitest";
import { generateEditToken, hashToken, tokenToObjectKey } from "../../src/persistence/token";

describe("token utilities", () => {
  it("generates URL-safe edit tokens", () => {
    const token = generateEditToken();

    expect(token.length).toBeGreaterThan(20);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("hashes a token deterministically", async () => {
    const first = await hashToken("abc123");
    const second = await hashToken("abc123");

    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });

  it("maps a token to a hashed character object key", async () => {
    const key = await tokenToObjectKey("abc123");

    expect(key).toMatch(/^characters\/[a-f0-9]{64}\.json$/);
  });
});
