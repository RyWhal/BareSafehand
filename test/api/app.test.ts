import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("frontend app routes", () => {
  it("serves the creation mode gate at the site root", async () => {
    const response = await SELF.fetch("https://example.com/");
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(html).toContain("BareSafehand");
    expect(html).toContain("Journey Mode");
    expect(html).toContain("Sheet Mode");
  });

  it("serves secret-link character pages with no-crawl headers", async () => {
    const response = await SELF.fetch("https://example.com/characters/test-token");
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow, noarchive");
    expect(html).toContain("data-character-token=\"test-token\"");
  });

  it("serves app css", async () => {
    const response = await SELF.fetch("https://example.com/app.css");
    const css = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/css");
    expect(css).toContain("--color-parchment");
  });

  it("serves app javascript with creation API hooks", async () => {
    const response = await SELF.fetch("https://example.com/app.js");
    const js = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/javascript");
    expect(js).toContain("/api/content/bootstrap");
    expect(js).toContain("/api/creation/preview");
    expect(js).toContain("/api/characters");
    expect(js).toContain("PUT");
    expect(js).toContain("renderSheetMode");
  });

  it("discourages crawling API and secret character URLs", async () => {
    const response = await SELF.fetch("https://example.com/robots.txt");
    const robots = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(robots).toContain("User-agent: *");
    expect(robots).toContain("Disallow: /api/");
    expect(robots).toContain("Disallow: /characters/");
  });
});
