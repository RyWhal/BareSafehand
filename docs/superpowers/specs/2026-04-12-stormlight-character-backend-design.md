# Stormlight Character Backend Design

Date: 2026-04-12

## Goal

Build the first backend slice for a data-driven Stormlight RPG character builder using Cloudflare Workers and Cloudflare R2.

This phase focuses on:

- verified-content-only character creation
- canonical JSON character persistence
- strict rules validation without invented content
- anonymous bearer-secret access via unique URLs

This phase does not include the frontend UI, revision history, or account ownership, but it should leave clean seams for those later additions.

## Product Decisions

- Hosting: Cloudflare Worker API first, with a future Pages frontend consuming the same API
- Storage: Cloudflare R2 for saved character JSON objects
- Access model: unique bearer-secret URL allows viewing and editing
- Privacy model: anonymous v1, with future ownership fields reserved in the data model
- Save model: single mutable character object for v1, no revision snapshots yet
- Content model: JSON files in-repo are the source of truth for selectable options
- Rules model: verified content only by default; partial or unavailable content must be surfaced explicitly rather than guessed

## Why This Shape

Starting with a Worker API keeps the project aligned with "form follows function." The backend can stabilize the canonical schema, content loading, validation, and persistence before any UI is built.

R2 is a good fit for v1 because each character is a single JSON document, there is no authenticated user library yet, and the product does not currently require relational queries. We can add D1 later for ownership, indexing, analytics, or sharing without changing the core character JSON shape.

## Phase 1 Scope

This backend phase should support:

- loading verified content from structured JSON files
- generating legal choices for level 1 creation where rules are verified
- validating a proposed level 1 character payload
- calculating only supported derived values
- saving and loading character JSON in R2
- editing an existing saved character through the same bearer-secret URL
- blocking or flagging unsupported rules data instead of inventing it

This phase should not support:

- revision history
- account login or ownership claims
- public character listing or search
- printable sheet rendering
- full level-up rules beyond placeholders for future design
- unverified talent trees, culture catalogs, or health formulas

## High-Level Architecture

The backend will be split into four main areas:

1. Content Registry
2. Rules Engine
3. Persistence Layer
4. HTTP API

### Content Registry

Responsibilities:

- load canonical content JSON files from the repo
- validate file shape at startup
- filter content by `verification_status`
- expose lookup helpers for rules and API handlers

Recommended initial content files:

- `content/ancestries.json`
- `content/heroic_paths.json`
- `content/skills.json`
- `content/expertises.json`
- `content/starting_kits.json`
- `content/talents.json`
- `content/advancement_rules.json`

Each content entity must include:

- `id`
- `name`
- `source_book`
- `source_page`
- `verification_status`
- `notes`

If a field is unextracted, it should remain absent or `null`, never fabricated.

### Rules Engine

Responsibilities:

- normalize incoming draft selections
- compute legal options based on verified content
- validate creation choices
- calculate supported derived values
- report unsupported or partially supported areas as structured issues

The rules engine must be pure and deterministic. It should not know about HTTP or R2.

Key rule decisions for v1:

- only level 1 creation is in scope
- only verified ancestries are available: Human and Singer
- only verified heroic paths are available
- only verified skills are available
- only verified and partially verified expertises can exist in content, but only verified options are selectable by default unless an explicit override mode is introduced later
- Human and Singer ancestry benefits are encoded only as far as the provided spec confirms
- any talent prerequisite that cannot be proven from extracted data must produce a `gm_confirmation_required` or `unavailable` result, not an optimistic pass
- formulas that are not fully verified, especially max health, remain unset and return structured warnings

### Persistence Layer

Responsibilities:

- map bearer token to stable object key
- save canonical character documents to R2
- load existing character documents from R2
- overwrite the single mutable object on save

Recommended storage key strategy:

- raw bearer token is generated once at character creation
- object key is `characters/<sha256(token)>.json`

Why hash the token before storage:

- avoids storing the raw secret as the R2 key
- lets the URL remain the credential while reducing accidental log leakage
- keeps lookup deterministic without adding a database

There is intentionally no list endpoint in v1. Anonymous bearer-secret characters should only be reachable by possession of the token.

### HTTP API

Responsibilities:

- accept JSON requests
- invoke content registry and rules engine
- return normalized responses, validation errors, and saved objects
- send privacy-oriented crawler headers

Recommended initial endpoints:

- `GET /robots.txt`
- `GET /api/health`
- `GET /api/content/bootstrap`
- `POST /api/creation/preview`
- `POST /api/characters`
- `GET /api/characters/:token`
- `PUT /api/characters/:token`

## Canonical Data Model

The canonical character JSON should closely follow the schema in the user specification. The saved object in R2 should wrap that canonical character with minimal persistence metadata.

Recommended saved document shape:

```json
{
  "id": "uuid",
  "tokenHash": "sha256-hex",
  "ownerAccountId": null,
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601",
  "sourceRulesVersion": "stormlight-v1",
  "verificationMode": "strict",
  "character": {}
}
```

Notes:

- `ownerAccountId` stays `null` in v1 but reserves the seam for future ownership
- `character` contains the canonical schema object
- mutable saves update `updatedAt` and replace `character`
- revision history is omitted in phase 1

## Content Modeling Details

### Origins

The spec confirms ancestry and cultural expertises, but does not confirm a complete culture catalog yet. To avoid inventing a fake culture system, v1 should model origins as:

- `ancestryId`
- `cultureExpertiseIds[]`

This preserves legality without pretending the full culture chapter has already been extracted.

### Talents

Talent content should be explicitly marked with verification status. For phase 1:

- include only talents proven by the supplied spec
- include path key talents where verified
- include Human bonus-talent handling only as confirmed
- include Singer `Change Form` and verified starting form packages only as confirmed

Any missing prerequisite tree data should block selection or mark the choice unavailable.

### Kits and Equipment

Starting kits should exist as structured data even when contents are incomplete.

Expected pattern:

- kit exists as a selectable entity
- confirmed contents are stored explicitly
- unknown contents are left `null` or omitted
- the rules engine surfaces incompleteness instead of pretending the kit is fully extracted

## API Design

### `GET /api/content/bootstrap`

Returns the verified content needed by a future builder frontend.

Initial payload should include:

- ancestries
- heroic paths
- skills
- selectable expertises
- starting kits
- visible talents
- rules metadata and verification notes

This endpoint allows the frontend to remain fully data-driven.

### `POST /api/creation/preview`

Purpose:

- validate a draft character payload before save
- return normalized character state
- return derived values that are currently supportable
- return legal-choice warnings and unsupported-rule issues

This route should not persist anything.

Response shape should include:

- normalized character draft
- `errors[]`
- `warnings[]`
- `derived`
- `selectableMetadata`

### `POST /api/characters`

Purpose:

- validate finalized creation payload
- persist canonical character JSON to R2
- generate bearer-secret edit URL

Response should include:

- saved character envelope
- edit token
- edit URL

The raw token should only be returned at creation time. Internally, the backend stores only the hash for key lookup.

### `GET /api/characters/:token`

Purpose:

- load an existing character via bearer token

Behavior:

- hash token
- load matching R2 object
- return canonical character envelope
- send no-index headers

### `PUT /api/characters/:token`

Purpose:

- overwrite an existing character via bearer token

Behavior:

- load existing object by token hash
- validate full updated payload
- overwrite saved object with updated timestamps
- return normalized saved object

## Validation and Derived Stats

The rules engine should expose pure functions for:

- attribute validation
- skill validation
- expertise count validation
- talent validation
- starting kit validation
- ancestry benefit resolution
- supported derived-stat calculation

For phase 1, only fully supported calculations should be emitted as final values. Unknown formulas should be returned as `null` plus structured warnings.

Example warning categories:

- `unsupported_formula`
- `partial_content`
- `gm_confirmation_required`
- `unknown_prerequisite`

This keeps the builder honest and prevents guessed rule output from leaking into saved data.

## Security and Privacy

### Bearer-Secret URLs

The token is effectively the credential. Therefore:

- tokens must be generated with cryptographically secure randomness
- tokens should be long enough to resist guessing
- tokens should never be logged intentionally
- object lookup should use a token hash rather than the raw token string

### Crawler Controls

The app should discourage indexing in two layers:

1. `GET /robots.txt` should disallow crawler access to character and API paths
2. character and API responses should include `X-Robots-Tag: noindex, nofollow, noarchive`

`robots.txt` is advisory only, so headers are still required.

### Future Ownership Seam

Even though v1 is anonymous, the design should make future account linkage straightforward by reserving:

- `ownerAccountId`
- optional access metadata fields later
- a separation between persistence envelope and canonical character payload

## Error Handling

The API should return structured JSON errors rather than plain text.

Recommended categories:

- `BAD_REQUEST`
- `VALIDATION_FAILED`
- `NOT_FOUND`
- `UNSUPPORTED_RULE`
- `INTERNAL_ERROR`

Validation failures should always return actionable field-level information where possible.

## Testing Strategy

Phase 1 should include:

- unit tests for content parsing and schema validation
- unit tests for pure rule calculators
- unit tests for legal-choice providers
- integration tests for Worker endpoints
- persistence tests for R2 save/load/update flows

Important cases:

- Human creation with extra heroic talent path handling
- Singer creation with required form package handling
- attribute total must equal 12
- creation skill ranks cannot exceed 2
- expertise count follows Intellect-derived rule
- unsupported health formula remains unset rather than guessed
- invalid or unknown bearer token returns not found

## Suggested Repo Layout

Recommended initial structure:

```text
/content
/src/content
/src/domain/models
/src/domain/rules
/src/persistence
/src/api
/test
```

This keeps content, domain logic, persistence, and transport concerns separate from the beginning.

## Future Expansion

This design intentionally leaves room for:

- revision history
- account ownership
- Pages frontend
- printable sheet exports
- full level-up workflows
- Radiant progression
- D1 indexing or ownership tables

Those can be layered on without changing the core “canonical character JSON in R2” model.

## Recommended Next Implementation Slice

Implement the smallest useful backend vertical slice:

1. Worker scaffold with Wrangler config and R2 binding
2. content JSON files for verified v1 options
3. Zod schemas for content and canonical character shape
4. pure rules/validation functions for level 1 creation
5. `POST /api/creation/preview`
6. `POST /api/characters`
7. `GET /api/characters/:token`
8. `PUT /api/characters/:token`
9. `GET /robots.txt`
10. unit and integration tests

## Open Constraints

The following should remain explicit backlog items rather than hidden assumptions:

- complete culture catalog
- full expertise catalog
- full talent trees and prerequisites
- exact health max formula
- complete advancement table
- full starting kit contents

The backend must continue surfacing these as explicit data gaps until the rule text is extracted and encoded.
