import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("POST /api/creation/preview", () => {
  it("returns structured errors for malformed JSON", async () => {
    const response = await SELF.fetch("https://example.com/api/creation/preview", {
      method: "POST",
      body: "{"
    });

    const payload = (await response.json()) as {
      errors: Array<{ code: string }>;
    };

    expect(response.status).toBe(400);
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow, noarchive");
    expect(payload).toEqual(
      expect.objectContaining({
        errors: [
          expect.objectContaining({
            code: "BAD_REQUEST"
          })
        ]
      })
    );
  });

  it("returns normalized preview JSON for structurally valid requests with validation errors", async () => {
    const response = await SELF.fetch("https://example.com/api/creation/preview", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        identity: {
          ancestryId: "human",
          startingPathId: "spy"
        }
      })
    });

    const payload = (await response.json()) as {
      character: {
        identity: {
          ancestryId: string | null;
          startingPathId: string | null;
        };
      };
      errors: unknown[];
      warnings: unknown[];
      derived: object;
      selectableMetadata: object;
    };

    expect(response.status).toBe(200);
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow, noarchive");
    expect(payload).toEqual(
      expect.objectContaining({
        character: expect.objectContaining({
          identity: expect.objectContaining({
            ancestryId: "human",
            startingPathId: "spy"
          })
        }),
        errors: expect.any(Array),
        warnings: expect.any(Array),
        derived: expect.any(Object),
        selectableMetadata: expect.any(Object)
      })
    );
    expect(payload.errors.length).toBeGreaterThan(0);
  });
});
