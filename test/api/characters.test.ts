import { describe, expect, it } from "vitest";
import { handleRequest, type Env } from "../../src/api/routes";

class InMemoryR2Bucket {
  private readonly objects = new Map<string, string>();

  async put(key: string, value: string): Promise<void> {
    this.objects.set(key, value);
  }

  async get(key: string): Promise<{ json<T>(): Promise<T>; text(): Promise<string> } | null> {
    const value = this.objects.get(key);

    if (value === undefined) {
      return null;
    }

    return {
      async json<T>() {
        return JSON.parse(value) as T;
      },
      async text() {
        return value;
      }
    };
  }
}

function createEnv(): Env {
  return {
    CHARACTERS_BUCKET: new InMemoryR2Bucket()
  };
}

function createExecutionContext(): ExecutionContext {
  return {
    waitUntil() {},
    passThroughOnException() {},
    props: {}
  } as unknown as ExecutionContext;
}

function buildValidCreationDraft() {
  return {
    identity: {
      ancestryId: "human",
      startingPathId: "agent"
    },
    attributes: {
      strength: 3,
      speed: 3,
      intellect: 0,
      willpower: 3,
      awareness: 3,
      presence: 0
    },
    skills: {
      insight: { ranks: 0, modifier: 0 },
      athletics: { ranks: 2, modifier: 0 },
      leadership: { ranks: 2, modifier: 0 }
    },
    expertises: [],
    talents: ["rousing_presence"],
    inventory: {
      startingKitId: "academic_kit"
    }
  };
}

describe("character persistence routes", () => {
  it("POST /api/characters validates input, persists a character, and returns the edit token + URL", async () => {
    const env = createEnv();
    const response = await handleRequest(
      new Request("https://example.com/api/characters", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildValidCreationDraft())
      }),
      env,
      createExecutionContext()
    );
    const payload = (await response.json()) as {
      envelope: { id: string; character: { talents: string[] } };
      editToken: string;
      editUrl: string;
    };

    expect(response.status).toBe(201);
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow, noarchive");
    expect(payload.editToken).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(payload.editUrl).toBe(`https://example.com/api/characters/${payload.editToken}`);
    expect(payload.envelope.character.talents).toEqual(expect.arrayContaining(["opportunist", "rousing_presence"]));
  });

  it("GET /api/characters/:token returns the saved object and PUT overwrites it after validation", async () => {
    const env = createEnv();
    const createResponse = await handleRequest(
      new Request("https://example.com/api/characters", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildValidCreationDraft())
      }),
      env,
      createExecutionContext()
    );
    const created = (await createResponse.json()) as {
      envelope: {
        character: { story: { notes: string }; meta: { createdAt: string; updatedAt: string } };
      };
      editToken: string;
    };

    const getResponse = await handleRequest(
      new Request(`https://example.com/api/characters/${created.editToken}`),
      env,
      createExecutionContext()
    );
    const loaded = (await getResponse.json()) as {
      envelope: { character: { id: string } };
    };

    expect(getResponse.status).toBe(200);
    expect(getResponse.headers.get("x-robots-tag")).toBe("noindex, nofollow, noarchive");
    expect(loaded.envelope.character.id).toBeTruthy();

    const nextCharacter = {
      ...created.envelope.character,
      meta: {
        ...created.envelope.character.meta,
        updatedAt: "2026-04-14T15:00:00.000Z"
      },
      story: {
        ...created.envelope.character.story,
        notes: "Updated over PUT"
      }
    };

    const putResponse = await handleRequest(
      new Request(`https://example.com/api/characters/${created.editToken}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(nextCharacter)
      }),
      env,
      createExecutionContext()
    );
    const updated = (await putResponse.json()) as {
      envelope: { createdAt: string; updatedAt: string; character: { story: { notes: string } } };
    };

    expect(putResponse.status).toBe(200);
    expect(putResponse.headers.get("x-robots-tag")).toBe("noindex, nofollow, noarchive");
    expect(updated.envelope.createdAt).toBe(created.envelope.character.meta.createdAt);
    expect(updated.envelope.updatedAt).not.toBe(created.envelope.character.meta.updatedAt);
    expect(updated.envelope.character.story.notes).toBe("Updated over PUT");
  });

  it("returns 404 for unknown tokens", async () => {
    const response = await handleRequest(
      new Request("https://example.com/api/characters/missing-token"),
      createEnv(),
      createExecutionContext()
    );
    const payload = (await response.json()) as {
      errors: Array<{ code: string }>;
    };

    expect(response.status).toBe(404);
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow, noarchive");
    expect(payload.errors[0]?.code).toBe("NOT_FOUND");
  });

  it("returns VALIDATION_FAILED for invalid create payloads", async () => {
    const response = await handleRequest(
      new Request("https://example.com/api/characters", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          identity: {
            ancestryId: "human",
            startingPathId: "spy"
          }
        })
      }),
      createEnv(),
      createExecutionContext()
    );
    const payload = (await response.json()) as {
      errors: Array<{ code: string }>;
    };

    expect(response.status).toBe(400);
    expect(payload.errors.some((error) => error.code === "VALIDATION_FAILED")).toBe(true);
  });

  it("returns 404 for PUT requests against unknown tokens", async () => {
    const response = await handleRequest(
      new Request("https://example.com/api/characters/missing-token", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({})
      }),
      createEnv(),
      createExecutionContext()
    );
    const payload = (await response.json()) as {
      errors: Array<{ code: string }>;
    };

    expect(response.status).toBe(404);
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow, noarchive");
    expect(payload.errors[0]?.code).toBe("NOT_FOUND");
  });

  it("returns VALIDATION_FAILED for invalid PUT payloads", async () => {
    const env = createEnv();
    const createResponse = await handleRequest(
      new Request("https://example.com/api/characters", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildValidCreationDraft())
      }),
      env,
      createExecutionContext()
    );
    const created = (await createResponse.json()) as {
      editToken: string;
    };

    const response = await handleRequest(
      new Request(`https://example.com/api/characters/${created.editToken}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({})
      }),
      env,
      createExecutionContext()
    );
    const payload = (await response.json()) as {
      errors: Array<{ code: string }>;
    };

    expect(response.status).toBe(400);
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow, noarchive");
    expect(payload.errors.some((error) => error.code === "VALIDATION_FAILED")).toBe(true);
  });
});
