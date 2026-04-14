# Stormlight Character Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Cloudflare Worker backend that loads verified Stormlight content from JSON, validates level 1 character creation, and saves anonymous bearer-secret character JSON to R2.

**Architecture:** Use a single TypeScript Cloudflare Worker with a small internal router, pure domain logic, and an R2-backed persistence adapter. Keep game data in repo JSON files, validate content and character shapes with Zod, and make all unsupported rules surface as explicit warnings or errors instead of guessed values.

**Tech Stack:** TypeScript, Cloudflare Workers, Wrangler, Zod, Vitest, `@cloudflare/vitest-pool-workers`

---

## File Map

### Runtime and Tooling

- `package.json`
  Purpose: npm scripts and dependency manifest.
- `tsconfig.json`
  Purpose: TypeScript compiler settings for Worker code and tests.
- `wrangler.jsonc`
  Purpose: Worker config, compatibility date, and R2 binding declarations.
- `vitest.config.mts`
  Purpose: Workers Vitest pool configuration using Wrangler config.
- `.gitignore`
  Purpose: ignore generated files and local env files.
- `worker-configuration.d.ts`
  Purpose: generated env typings from `wrangler types`; never hand-edit.

### Content and Validation

- `content/ancestries.json`
- `content/heroic_paths.json`
- `content/skills.json`
- `content/expertises.json`
- `content/talents.json`
- `content/starting_kits.json`
- `content/advancement_rules.json`
  Purpose: verified and partial content only, with source metadata.

- `src/content/schemas.ts`
  Purpose: Zod schemas for content entities and content collections.
- `src/content/loadContent.ts`
  Purpose: parse static JSON modules into a typed content registry.
- `src/content/registry.ts`
  Purpose: expose helper functions like `getAvailableHeroicPaths()`.

### Domain Model and Rules

- `src/domain/models/character.ts`
  Purpose: canonical character schema and types.
- `src/domain/models/issues.ts`
  Purpose: shared issue, warning, and validation shapes.
- `src/domain/rules/derived.ts`
  Purpose: supported derived-stat calculators and unsupported placeholders.
- `src/domain/rules/validation.ts`
  Purpose: creation validators for attributes, skills, talents, and expertises.
- `src/domain/rules/choices.ts`
  Purpose: legal-choice providers driven from verified content.
- `src/domain/rules/preview.ts`
  Purpose: normalize draft input into preview output.

### Persistence and HTTP

- `src/persistence/token.ts`
  Purpose: token generation, token hashing, and R2 object-key mapping.
- `src/persistence/characterStore.ts`
  Purpose: save, load, and update character envelopes in R2.
- `src/api/http.ts`
  Purpose: JSON responses, errors, route params, and no-index headers.
- `src/api/routes.ts`
  Purpose: request dispatch by method and pathname.
- `src/api/handlers/health.ts`
- `src/api/handlers/bootstrap.ts`
- `src/api/handlers/preview.ts`
- `src/api/handlers/characters.ts`
- `src/api/handlers/robots.ts`
  Purpose: isolated HTTP handlers with thin orchestration only.
- `src/index.ts`
  Purpose: Worker `fetch()` entrypoint.

### Tests

- `test/content/loadContent.test.ts`
- `test/domain/derived.test.ts`
- `test/domain/validation.test.ts`
- `test/domain/choices.test.ts`
- `test/domain/preview.test.ts`
- `test/persistence/token.test.ts`
- `test/persistence/characterStore.test.ts`
- `test/api/health.test.ts`
- `test/api/bootstrap.test.ts`
- `test/api/preview.test.ts`
- `test/api/characters.test.ts`
- `test/api/robots.test.ts`
  Purpose: focused unit and integration coverage for each layer.

## Task 1: Bootstrap the Worker Toolchain With a Health Check

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `wrangler.jsonc`
- Create: `vitest.config.mts`
- Create: `.gitignore`
- Create: `src/index.ts`
- Create: `src/api/routes.ts`
- Create: `src/api/handlers/health.ts`
- Create: `src/api/http.ts`
- Test: `test/api/health.test.ts`

- [ ] **Step 1: Write the failing health-route test**

```ts
import { env, SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("GET /api/health", () => {
  it("returns ok JSON", async () => {
    const response = await SELF.fetch("https://example.com/api/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- test/api/health.test.ts`
Expected: FAIL because the Worker project and route do not exist yet.

- [ ] **Step 3: Add the minimal Worker scaffold to make the test pass**

Create `package.json` with scripts:

```json
{
  "name": "baresafehand",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "cf-typegen": "wrangler types",
    "cf-check": "wrangler check"
  }
}
```

Create a minimal `fetch()` pipeline where `GET /api/health` returns `{ ok: true }`.

- [ ] **Step 4: Install dependencies and generate Worker typings**

Run: `npm install zod`
Run: `npm install -D typescript wrangler vitest@~3.2.0 @cloudflare/vitest-pool-workers @cloudflare/workers-types`
Run: `npm run cf-typegen`
Expected: installs succeed and `worker-configuration.d.ts` is generated.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm run test -- test/api/health.test.ts`
Expected: PASS.

- [ ] **Step 6: Run basic project verification**

Run: `npm run typecheck`
Run: `npm run cf-check`
Expected: both commands succeed.

- [ ] **Step 7: Commit**

```bash
git add package.json tsconfig.json wrangler.jsonc vitest.config.mts .gitignore worker-configuration.d.ts src/index.ts src/api/routes.ts src/api/handlers/health.ts src/api/http.ts test/api/health.test.ts
git commit -m "feat: scaffold cloudflare worker backend"
```

## Task 2: Add Verified Content Files and the Content Loader

**Files:**
- Create: `content/ancestries.json`
- Create: `content/heroic_paths.json`
- Create: `content/skills.json`
- Create: `content/expertises.json`
- Create: `content/talents.json`
- Create: `content/starting_kits.json`
- Create: `content/advancement_rules.json`
- Create: `src/content/schemas.ts`
- Create: `src/content/loadContent.ts`
- Create: `src/content/registry.ts`
- Test: `test/content/loadContent.test.ts`

- [ ] **Step 1: Write the failing loader tests**

Cover these behaviors:

- verified ancestries include only Human and Singer
- heroic paths expose the six verified paths
- partial expertises can load from content but are not auto-selectable by default
- incomplete kit fields remain `null` instead of fabricated values

Example:

```ts
it("loads the verified ancestry list", () => {
  const content = loadContent();
  expect(content.ancestries.map((item) => item.id)).toEqual(["human", "singer"]);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- test/content/loadContent.test.ts`
Expected: FAIL because the content files and loader do not exist.

- [ ] **Step 3: Create content JSON files with only the verified data from the spec**

Required inclusions:

- Human and Singer ancestries
- six verified heroic paths with starting skill and key talent
- eighteen verified base skills
- cultural and example expertises from the spec with correct `verification_status`
- verified starting kits with nullable unknown contents
- verified talents only, including path key talents and confirmed Singer/Human ancestry benefits
- `advancement_rules.json` stub marked partial and explicitly incomplete

- [ ] **Step 4: Implement Zod content schemas and `loadContent()`**

`loadContent()` should:

- parse static JSON modules
- validate structure eagerly
- throw clearly if content is malformed
- return a typed registry object

- [ ] **Step 5: Add registry helpers for verified filtering**

Examples:

- `getAvailableAncestries(registry)`
- `getAvailableHeroicPaths(registry)`
- `getSelectableExpertises(registry, { includePartial: false })`

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm run test -- test/content/loadContent.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add content src/content test/content/loadContent.test.ts
git commit -m "feat: add verified stormlight content registry"
```

## Task 3: Define the Canonical Character Schema and Issue Model

**Files:**
- Create: `src/domain/models/character.ts`
- Create: `src/domain/models/issues.ts`
- Test: `test/domain/preview.test.ts`

- [ ] **Step 1: Write the failing schema-normalization tests**

Cover these behaviors:

- a normalized level 1 character draft defaults to `verificationMode: "strict"`
- `radiant.enabled` defaults to `false`
- unsupported derived fields are `null` rather than guessed strings or zeroes
- `ownerAccountId` does not live inside the canonical character payload

Example:

```ts
it("keeps unsupported derived values unset", () => {
  const character = createEmptyCharacter();
  expect(character.derived.movement).toBeNull();
  expect(character.resources.investiture.max).toBe(0);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- test/domain/preview.test.ts`
Expected: FAIL because the model layer does not exist.

- [ ] **Step 3: Implement the canonical character Zod schema and helper creators**

Required helpers:

- `createEmptyCharacter()`
- `normalizeCharacterInput(input)`
- `CharacterSchema`

Model decisions:

- keep the user-provided schema shape as close to the approved spec as possible
- use `null` for unsupported derived values
- reserve `revisionHistory` in the schema as an empty array for forward compatibility, even if v1 does not populate it

- [ ] **Step 4: Implement the shared issue and warning types**

Needed issue codes:

- `BAD_REQUEST`
- `VALIDATION_FAILED`
- `NOT_FOUND`
- `UNSUPPORTED_RULE`
- `GM_CONFIRMATION_REQUIRED`

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run test -- test/domain/preview.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/models test/domain/preview.test.ts
git commit -m "feat: add canonical character schema"
```

## Task 4: Implement Supported Derived Stat Calculators

**Files:**
- Create: `src/domain/rules/derived.ts`
- Test: `test/domain/derived.test.ts`

- [ ] **Step 1: Write the failing derived-stat tests**

Cover these behaviors:

- physical defense = `10 + strength + speed`
- cognitive defense = `10 + intellect + willpower`
- spiritual defense = `10 + awareness + presence`
- focus max = `2 + willpower`
- investiture starts at `0` for non-Radiants
- unsupported formulas return `null` plus an issue

Example:

```ts
it("calculates physical defense from strength and speed", () => {
  const value = calcPhysicalDefense({
    attributes: { strength: 3, speed: 2, intellect: 0, willpower: 0, awareness: 0, presence: 0 }
  });
  expect(value).toBe(15);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- test/domain/derived.test.ts`
Expected: FAIL because the calculators do not exist.

- [ ] **Step 3: Implement the supported calculators and unsupported placeholders**

Required exports:

- `calcPhysicalDefense`
- `calcCognitiveDefense`
- `calcSpiritualDefense`
- `calcFocusMax`
- `calcInvestitureMax`
- `calcSupportedDerived`

`calcSupportedDerived()` should compute supported values and attach warnings for:

- movement
- recovery die
- lifting capacity
- senses range
- deflect
- max health

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test -- test/domain/derived.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/rules/derived.ts test/domain/derived.test.ts
git commit -m "feat: add supported derived stat calculators"
```

## Task 5: Implement Creation Validation and Legal-Choice Providers

**Files:**
- Create: `src/domain/rules/validation.ts`
- Create: `src/domain/rules/choices.ts`
- Test: `test/domain/validation.test.ts`
- Test: `test/domain/choices.test.ts`

- [ ] **Step 1: Write the failing validation and choice tests**

Cover these behaviors:

- attribute total must equal 12
- each attribute must be between 0 and 3 at creation
- path starting skill gets one free rank
- four discretionary skill ranks cannot push any skill above 2
- additional expertise count equals Intellect
- Human queues an extra heroic-path talent choice
- Singer queues `change_form` plus one verified singer forms package
- only verified heroic paths are selectable

Example:

```ts
it("rejects attribute arrays that do not total 12", () => {
  const result = validateCreationAttributes({
    strength: 3,
    speed: 3,
    intellect: 3,
    willpower: 3,
    awareness: 3,
    presence: 0
  });
  expect(result.ok).toBe(false);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- test/domain/validation.test.ts test/domain/choices.test.ts`
Expected: FAIL because validators and choice providers do not exist.

- [ ] **Step 3: Implement the creation validators**

Required exports:

- `validateCreationAttributes`
- `validateCreationSkillRanks`
- `validateCreationExpertiseCount`
- `validateTalentSelection`
- `validateStartingKitSelection`

Validation rules should always return structured field errors and never throw for user mistakes.

- [ ] **Step 4: Implement legal-choice providers**

Required exports:

- `getAvailableAncestries`
- `getAvailableHeroicPaths`
- `getAvailableExpertises`
- `getAvailableTalents`
- `getAvailableAncestryTalents`
- `getAvailableStartingKits`

Rules:

- hide unavailable entities by default
- include partial entities only when the route explicitly asks for them
- surface `GM confirmation required` when prerequisites cannot be proven

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run test -- test/domain/validation.test.ts test/domain/choices.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/rules/validation.ts src/domain/rules/choices.ts test/domain/validation.test.ts test/domain/choices.test.ts
git commit -m "feat: add character creation validation rules"
```

## Task 6: Build the Draft Preview Engine

**Files:**
- Create: `src/domain/rules/preview.ts`
- Test: `test/domain/preview.test.ts`

- [ ] **Step 1: Expand the preview tests with failing end-to-end draft cases**

Cover these behaviors:

- normalized preview auto-applies the starting path skill rank
- normalized preview auto-applies the key talent when verified
- preview includes supported derived values
- preview includes warnings for unsupported formulas
- preview includes validation errors instead of mutating illegal input into legal output

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- test/domain/preview.test.ts`
Expected: FAIL because preview orchestration does not exist.

- [ ] **Step 3: Implement `buildCreationPreview()`**

Required output shape:

```ts
{
  character,
  errors,
  warnings,
  derived,
  selectableMetadata
}
```

Behavior:

- normalize input
- apply free path skill rank
- calculate supported derived values
- collect validation errors
- attach legal-choice metadata for the frontend

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test -- test/domain/preview.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/rules/preview.ts test/domain/preview.test.ts
git commit -m "feat: add creation preview engine"
```

## Task 7: Add the Content Bootstrap and Preview API Routes

**Files:**
- Create: `src/api/handlers/bootstrap.ts`
- Create: `src/api/handlers/preview.ts`
- Modify: `src/api/routes.ts`
- Modify: `src/api/http.ts`
- Test: `test/api/bootstrap.test.ts`
- Test: `test/api/preview.test.ts`

- [ ] **Step 1: Write the failing bootstrap and preview route tests**

Cover these behaviors:

- `GET /api/content/bootstrap` returns verified content only
- bootstrap payload includes verification metadata for partial content
- `POST /api/creation/preview` returns normalized preview JSON
- preview response uses `400` for malformed JSON and `200` for structurally valid requests with validation errors in-body
- both routes include `X-Robots-Tag: noindex, nofollow, noarchive`

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- test/api/bootstrap.test.ts test/api/preview.test.ts`
Expected: FAIL because the routes do not exist.

- [ ] **Step 3: Implement the bootstrap handler**

The payload should expose:

- available ancestries
- heroic paths
- skills
- selectable expertises
- starting kits
- visible talents
- rules version metadata

- [ ] **Step 4: Implement the preview handler**

The handler should:

- parse JSON safely
- call `buildCreationPreview()`
- return structured errors for malformed input
- never persist anything

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run test -- test/api/bootstrap.test.ts test/api/preview.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/api/handlers/bootstrap.ts src/api/handlers/preview.ts src/api/routes.ts src/api/http.ts test/api/bootstrap.test.ts test/api/preview.test.ts
git commit -m "feat: add content bootstrap and preview api"
```

## Task 8: Add Token Utilities and the R2 Character Store

**Files:**
- Create: `src/persistence/token.ts`
- Create: `src/persistence/characterStore.ts`
- Test: `test/persistence/token.test.ts`
- Test: `test/persistence/characterStore.test.ts`

- [ ] **Step 1: Write the failing token and store tests**

Cover these behaviors:

- token generation uses URL-safe random output
- token hashing is deterministic
- object keys are `characters/<hash>.json`
- saving a character writes the envelope to R2
- loading a missing token returns `null`
- updates replace the stored character and advance `updatedAt`

Example:

```ts
it("maps a token to a hashed object key", async () => {
  const key = await tokenToObjectKey("abc123");
  expect(key).toMatch(/^characters\/[a-f0-9]+\.json$/);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- test/persistence/token.test.ts test/persistence/characterStore.test.ts`
Expected: FAIL because the persistence layer does not exist.

- [ ] **Step 3: Implement token generation and hashing**

Required exports:

- `generateEditToken()`
- `hashToken(token)`
- `tokenToObjectKey(token)`

Rules:

- use Web Crypto only
- do not log raw tokens
- keep token generation inside the Worker runtime surface

- [ ] **Step 4: Implement the R2-backed character store**

Required methods:

- `createCharacter(env, character)`
- `getCharacterByToken(env, token)`
- `updateCharacterByToken(env, token, character)`

Envelope shape:

```ts
{
  id,
  tokenHash,
  ownerAccountId: null,
  createdAt,
  updatedAt,
  sourceRulesVersion,
  verificationMode,
  character
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run test -- test/persistence/token.test.ts test/persistence/characterStore.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/persistence/token.ts src/persistence/characterStore.ts test/persistence/token.test.ts test/persistence/characterStore.test.ts
git commit -m "feat: add r2-backed character storage"
```

## Task 9: Implement Character Create, Read, and Update Endpoints

**Files:**
- Create: `src/api/handlers/characters.ts`
- Modify: `src/api/routes.ts`
- Test: `test/api/characters.test.ts`

- [ ] **Step 1: Write the failing character-route integration tests**

Cover these behaviors:

- `POST /api/characters` validates input and persists a character
- create returns the saved envelope, edit token, and edit URL
- `GET /api/characters/:token` returns the saved object
- `PUT /api/characters/:token` overwrites the object after validation
- unknown tokens return `404`
- invalid payloads return `VALIDATION_FAILED`

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- test/api/characters.test.ts`
Expected: FAIL because the character handlers do not exist.

- [ ] **Step 3: Implement `POST /api/characters`**

Behavior:

- parse request JSON
- call `buildCreationPreview()`
- reject if preview contains validation errors
- persist the normalized canonical character
- return `201` with envelope, token, and URL

- [ ] **Step 4: Implement `GET` and `PUT` token routes**

Behavior:

- derive the token from the path
- use the character store for load/update
- preserve `createdAt`
- refresh `updatedAt`
- return no-index headers on every character response

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run test -- test/api/characters.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/api/handlers/characters.ts src/api/routes.ts test/api/characters.test.ts
git commit -m "feat: add character persistence endpoints"
```

## Task 10: Add `robots.txt`, Privacy Headers, and Final Verification

**Files:**
- Create: `src/api/handlers/robots.ts`
- Modify: `src/api/routes.ts`
- Modify: `README.md`
- Test: `test/api/robots.test.ts`

- [ ] **Step 1: Write the failing robots and privacy tests**

Cover these behaviors:

- `GET /robots.txt` disallows `/api/characters` and the broader API surface
- character and API responses carry `X-Robots-Tag: noindex, nofollow, noarchive`
- unknown routes return structured JSON `404` responses where appropriate

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- test/api/robots.test.ts`
Expected: FAIL because the robots handler does not exist.

- [ ] **Step 3: Implement the robots handler and shared no-index behavior**

`robots.txt` content should include:

```txt
User-agent: *
Disallow: /api/
Disallow: /characters/
```

Also ensure route handlers set:

```ts
"X-Robots-Tag": "noindex, nofollow, noarchive"
```

- [ ] **Step 4: Update `README.md` with backend setup and local test commands**

Document:

- install
- generate Worker typings
- run tests
- run local dev server
- expected R2 binding name

- [ ] **Step 5: Run the focused test and then the full suite**

Run: `npm run test -- test/api/robots.test.ts`
Run: `npm run test`
Expected: PASS.

- [ ] **Step 6: Run final static verification**

Run: `npm run typecheck`
Run: `npm run cf-check`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/api/handlers/robots.ts src/api/routes.ts README.md test/api/robots.test.ts
git commit -m "feat: finalize backend privacy and verification flow"
```

## Task 11: Prepare Cloudflare Deployment Inputs

**Files:**
- Modify: `wrangler.jsonc`
- Modify: `README.md`

- [ ] **Step 1: Add placeholder environment config for the R2 bucket**

Set the Worker name and declare one R2 binding using a stable binding name like `CHARACTER_BUCKET`.

- [ ] **Step 2: Document the manual Cloudflare provisioning commands**

Document commands to run during deployment:

```bash
wrangler login
wrangler r2 bucket create stormlight-characters-prod
wrangler deploy
```

Also document that local tests use Miniflare storage and do not require a real bucket.

- [ ] **Step 3: Run config validation**

Run: `npm run cf-check`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add wrangler.jsonc README.md
git commit -m "docs: prepare cloudflare deployment config"
```

## Final Verification Checklist

- [ ] `npm run test`
- [ ] `npm run typecheck`
- [ ] `npm run cf-check`
- [ ] `npm run cf-typegen`
- [ ] `git status --short` shows only intentional changes
- [ ] save one local test character through the API
- [ ] fetch that character by token and confirm the returned JSON matches the saved canonical envelope
- [ ] update that character by token and confirm `updatedAt` changes while `createdAt` stays stable

## Notes for the Implementer

- Do not add Hono, D1, or auth unless the task explicitly requires it.
- Do not invent missing Stormlight formulas or content.
- Treat partial data as partial data in both content and responses.
- Prefer small modules with pure logic over a single large Worker file.
- Keep endpoint behavior boring and deterministic; all interesting rules behavior belongs in the domain layer.
- Use Workers Vitest integration for both unit and integration tests, per current Cloudflare guidance.
