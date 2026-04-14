import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("GET /api/content/bootstrap", () => {
  it("returns verified content only with verification metadata for partial expertises", async () => {
    const response = await SELF.fetch("https://example.com/api/content/bootstrap");
    const bootstrap = (await response.json()) as {
      ancestries: Array<{ verificationStatus: string }>;
      heroicPaths: Array<{ verificationStatus: string }>;
      skills: Array<{ verificationStatus: string }>;
      expertises: Array<{ verificationStatus: string }>;
      startingKits: Array<{ verificationStatus: string }>;
      talents: Array<{ verificationStatus: string }>;
      rulesVersion: { id: string; verificationStatus: string };
    };

    expect(response.status).toBe(200);
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow, noarchive");
    expect(bootstrap).toEqual(
      expect.objectContaining({
        ancestries: expect.any(Array),
        heroicPaths: expect.any(Array),
        skills: expect.any(Array),
        expertises: expect.any(Array),
        startingKits: expect.any(Array),
        talents: expect.any(Array),
        rulesVersion: expect.objectContaining({
          id: "advancement_rules",
          verificationStatus: "partial"
        })
      })
    );

    expect(bootstrap.ancestries.length).toBeGreaterThan(0);
    expect(
      bootstrap.ancestries.every((item: { verificationStatus: string }) => item.verificationStatus === "verified")
    ).toBe(true);
    expect(
      bootstrap.heroicPaths.every((item: { verificationStatus: string }) => item.verificationStatus === "verified")
    ).toBe(true);
    expect(bootstrap.skills.every((item: { verificationStatus: string }) => item.verificationStatus === "verified")).toBe(true);
    expect(
      bootstrap.startingKits.every((item: { verificationStatus: string }) => item.verificationStatus === "verified")
    ).toBe(true);
    expect(bootstrap.talents.every((item: { verificationStatus: string }) => item.verificationStatus === "verified")).toBe(true);
    expect(
      bootstrap.expertises.every((item: { verificationStatus: string }) =>
        item.verificationStatus === "verified" || item.verificationStatus === "partial"
      )
    ).toBe(true);
    expect(bootstrap.expertises.some((item: { verificationStatus: string }) => item.verificationStatus === "partial")).toBe(true);
  });
});
