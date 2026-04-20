# BareSafehand

Stormlight RPG character builder backend and first-pass frontend for anonymous, secret-link character sheets.

## Local Development

Install dependencies:

```bash
npm install
```

Run the Worker locally:

```bash
npm run dev
```

Open the app at:

```text
http://localhost:8787/
```

The first UI includes:

- `Journey Mode` scaffold for the future story-first builder
- `Sheet Mode` for direct verified-option character creation
- review/preview using `POST /api/creation/preview`
- anonymous saves using `POST /api/characters`
- secret-link edits using `/characters/:token`, backed by `PUT /api/characters/:token`

## Privacy Note

Character URLs are bearer secrets. Anyone with a saved `/characters/:token` link can view and edit that character. The Worker serves `robots.txt` disallowing `/api/` and `/characters/`, and secret character pages include `X-Robots-Tag: noindex, nofollow, noarchive`.

## Cloudflare

The Worker expects an R2 binding named:

```text
CHARACTERS_BUCKET
```

Current production bucket name:

```text
baresafehand-characters-prod
```

Generate Worker typings after binding changes:

```bash
npm run cf-typegen
```

Check Worker startup locally:

```bash
npm run cf-check
```

## Verification

Run tests:

```bash
npm run test
```

Run TypeScript:

```bash
npm run typecheck
```
