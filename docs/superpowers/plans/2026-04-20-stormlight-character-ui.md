# Stormlight Character UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build the first working BareSafehand frontend on the existing Cloudflare Worker, proving character creation from UI draft to preview to R2 save.

**Architecture:** Serve a small static app shell, stylesheet, and browser script from the Worker before adding a separate frontend framework. The browser app fetches existing API endpoints, keeps an incomplete draft locally, supports a functional Sheet Mode baseline, exposes a Journey Mode placeholder aligned to the design, and saves through the canonical character endpoint.

**Tech Stack:** TypeScript Cloudflare Worker, plain browser JavaScript, CSS, Vitest with Cloudflare Workers test pool.

---

## File Map

- `src/api/handlers/app.ts`
  Purpose: serve the HTML shell, CSS, and browser JavaScript with privacy headers where needed.
- `src/api/routes.ts`
  Purpose: route `/`, `/characters/:token`, `/app.css`, `/app.js`, and `/robots.txt` alongside the existing JSON API.
- `test/api/app.test.ts`
  Purpose: verify the UI shell/assets/routes are served, character URLs are noindexed, and the app contains the two creation modes.
- `README.md`
  Purpose: document local UI usage once the frontend exists.

## Task 1: Serve The App Shell And Static Assets

**Files:**
- Create: `src/api/handlers/app.ts`
- Modify: `src/api/routes.ts`
- Test: `test/api/app.test.ts`

- [x] **Step 1: Write failing route tests**

Cover:

- `GET /` returns HTML containing `BareSafehand`, `Journey Mode`, and `Sheet Mode`.
- `GET /characters/test-token` returns HTML with `X-Robots-Tag: noindex, nofollow, noarchive`.
- `GET /app.css` returns CSS.
- `GET /app.js` returns browser JavaScript.
- `GET /robots.txt` disallows `/api/` and `/characters/`.

- [x] **Step 2: Run failing tests**

Run: `npm run test -- test/api/app.test.ts`

Expected: FAIL because these routes do not exist yet.

- [x] **Step 3: Implement minimal handlers**

Add an app handler that serves:

- HTML shell with root node and mode-gate copy
- CSS asset with the field-journal visual direction
- JS asset placeholder
- robots.txt

Add routes before the API fallback.

- [x] **Step 4: Run route tests**

Run: `npm run test -- test/api/app.test.ts`

Expected: PASS.

## Task 2: Implement Functional Sheet Mode

**Files:**
- Modify: `src/api/handlers/app.ts`
- Test: `test/api/app.test.ts`

- [x] **Step 1: Write failing asset tests**

Cover that `/app.js` contains the behaviors needed for the first functional UI:

- fetches `/api/content/bootstrap`
- posts to `/api/creation/preview`
- posts to `/api/characters`
- puts to `/api/characters/:token`
- renders Sheet Mode controls from fetched content

- [x] **Step 2: Run failing tests**

Run: `npm run test -- test/api/app.test.ts`

Expected: FAIL because the JS placeholder lacks these behaviors.

- [x] **Step 3: Implement browser app**

Build a small browser script that:

- loads bootstrap content
- renders mode gate
- renders Sheet Mode form for origins, path, attributes, skills, kit, and story
- maintains a draft character object
- calls preview and shows errors/warnings/derived values
- saves valid drafts with `POST /api/characters`
- loads existing characters from `/api/characters/:token` when routed through `/characters/:token`
- saves existing characters with `PUT /api/characters/:token`

- [x] **Step 4: Run tests**

Run: `npm run test -- test/api/app.test.ts`

Expected: PASS.

## Task 3: Verify Full Backend Compatibility

**Files:**
- Modify: `README.md`

- [x] **Step 1: Update README**

Document:

- `npm run dev`
- local app URL
- API URL shape
- bearer-secret character URL warning

- [x] **Step 2: Run full verification**

Run:

```bash
npm run test
npm run typecheck
npm run cf-check
```

Expected: all pass.

- [x] **Step 3: Commit**

```bash
git add docs/superpowers/plans/2026-04-20-stormlight-character-ui.md src/api/handlers/app.ts src/api/routes.ts test/api/app.test.ts README.md
git commit -m "feat: add first character creation ui"
```
