import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { jsonResponse } from "../../src/api/http";

describe("GET /api/health", () => {
  it("returns ok JSON", async () => {
    const response = await SELF.fetch("https://example.com/api/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});

describe("jsonResponse", () => {
  it("preserves caller headers and tuple arrays", async () => {
    const headers = new Headers([
      ["x-test", "one"],
      ["content-type", "text/plain"]
    ]);

    const response = jsonResponse(
      { ok: true },
      {
        headers: [
          ["x-other", "two"]
        ]
      }
    );

    const overrideResponse = jsonResponse({ ok: true }, { headers });

    expect(response.headers.get("x-other")).toBe("two");
    expect(response.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(overrideResponse.headers.get("x-test")).toBe("one");
    expect(overrideResponse.headers.get("content-type")).toBe("text/plain");
  });
});
