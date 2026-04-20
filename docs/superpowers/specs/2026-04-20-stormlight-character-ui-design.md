# Stormlight Character UI Design

Date: 2026-04-20

## Goal

Design the first frontend experience for BareSafehand, a Stormlight RPG character builder backed by the existing Worker API, content registry, rules preview engine, and R2 character persistence.

The UI should support two creation modes:

- Journey Mode: a narrative-first, guided character discovery flow that can pre-fill a mechanical character draft for review.
- Sheet Mode: a direct, rules-first character builder for users who already know what they want.

Both modes must feed the same canonical draft shape, use the same preview API, and save through the same character persistence endpoint.

## Product Principles

- The UI must never invent game content.
- Every selectable option must come from structured content.
- Journey Mode can recommend and pre-fill, but the user must review before save.
- Sheet Mode and Journey Mode must converge before final validation.
- Strict verified rules remain the default.
- Partial or unavailable content should be visible only when intentionally exposed as blocked, unavailable, or GM-confirmation-required.
- Anonymous bearer-secret URLs remain the v1 access model.
- The design should leave seams for accounts, libraries, revisions, and richer content extraction later.

## Chosen Direction

Use a two-door creation experience:

1. Journey Mode for players who want to discover the character through guided prompts, regional context, and scenario questions.
2. Sheet Mode for players who want direct control over ancestry, path, attributes, skills, expertises, talents, kit, and story fields.

Journey Mode should use pre-fill with review. It can translate narrative answers into a draft sheet, but it must route users through a mechanical review screen before saving.

This gives the experience some magic without letting the system make hidden or unsupported rules decisions.

## Alternatives Considered

### Recommendation Only

Journey Mode would answer with suggestions such as "Envoy or Leader may fit this character" but would not populate any sheet fields.

Tradeoff: safest and simplest, but less satisfying because the user still has to manually reconstruct the character.

### Pre-Fill With Review

Journey Mode maps source-backed narrative answers to a draft character and sends the user to a review step before saving.

Tradeoff: requires careful content modeling and transparent explanations, but creates the strongest user experience while preserving control.

### Story Only

Journey Mode would only help with purpose, obstacle, goals, personality, appearance, and connections. Mechanical choices would stay entirely in Sheet Mode.

Tradeoff: very safe, but it underuses the character-discovery idea and makes the two modes feel disconnected.

## High-Level Screens

### Creation Mode Gate

Purpose: let the user choose how they want to build.

Primary actions:

- Start Journey Mode
- Start Sheet Mode
- Load Existing Character by Secret Link

Important UI details:

- Show that Strict Verified Rules are enabled.
- Explain that the saved URL is a bearer secret.
- Avoid public account language until ownership exists.
- If a secret-link token is present, treat the flow as editing an existing character rather than creating a new anonymous record.

### Journey Mode

Purpose: guide the user through character identity and values, then pre-fill a draft character sheet.

Core sections:

- Homeland and heritage
- Life before adventure
- Pressure-test scenarios
- Personal purpose and obstacle
- First goals
- Path inclination
- Mechanical draft review

Journey Mode should feel like an interactive character interview, not a rules quiz. It should still be deterministic and content-driven.

### Sheet Mode

Purpose: provide direct selection for players who know the rules or want exact control.

Core sections should follow the existing creation flow:

1. Origins
2. Starting path
3. Attributes
4. Skills and expertises
5. Talents
6. Equipment
7. Story
8. Final statistics

Sheet Mode should show validation as the user goes, but it should not block exploration until final save.

### Review and Finalize

Purpose: converge both modes into the same validation and save flow.

This screen should show:

- canonical draft summary
- source-backed choices
- derived-stat preview
- errors that must be fixed
- warnings for unsupported or incomplete rules
- unavailable content notes where relevant
- final save action

The review screen is mandatory for Journey Mode and optional but available in Sheet Mode.

Save behavior:

- New characters save through `POST /api/characters`.
- Existing secret-link characters save through `PUT /api/characters/:token`.
- The UI should not expose a public character library or list endpoint in v1.
- If the token is missing or invalid while editing, the user should be prompted to start a new character or re-open the correct secret URL.

### Character Sheet View

Purpose: render a saved character from canonical JSON.

Initial rendering should prioritize correctness over polish:

- identity
- attributes and defenses
- skills
- expertises
- talents
- resources
- equipment
- story and goals
- Radiant shell when enabled later

## Journey Mode Design

### Regional Selector

Journey Mode should start with a stylized, source-backed regional selector rather than a precise official map.

Reason:

- We can create an evocative cartographic UI without shipping unauthorized map art.
- We can avoid pretending the full culture/location catalog is extracted.
- We can mark unavailable regions and culture mappings honestly.

Initial behavior:

- Display a stylized Roshar-inspired regional panel with abstract regions and selectable markers.
- Only markers backed by structured content should be selectable.
- Markers without enough data should be shown as unavailable or omitted.
- Selecting a marker opens a lore/context panel sourced from JSON.
- The region selection may recommend culture expertises only when the mapping is source-backed.

Important boundary:

The map is a discovery surface, not the source of truth. The source of truth is still structured content.

### Scenario Questions

Journey Mode should include short narrative prompts that reveal values and playstyle.

Examples of prompt categories:

- loyalty versus independence
- mercy versus justice
- curiosity versus caution
- command versus collaboration
- survival versus honor

Each answer may contribute tags such as:

- duty
- freedom
- scholarship
- protection
- cunning
- leadership
- compassion
- discipline

These tags can drive recommendations and pre-fill choices only when there is a verified mapping.

### Recommendation Model

Journey Mode should produce a transparent recommendation result:

```json
{
  "recommendedSelections": {
    "ancestryId": "human",
    "startingPathId": "scholar",
    "story": {
      "purpose": "Protect those others overlook",
      "obstacle": "A secret duty pulls you away from home"
    }
  },
  "recommendationReasons": [
    {
      "field": "startingPathId",
      "selectedId": "scholar",
      "reason": "Your answers favored curiosity, knowledge, and careful problem-solving.",
      "source": "journey_prompt_mapping"
    }
  ],
  "unresolvedChoices": [
    {
      "field": "cultureExpertiseIds",
      "reason": "The selected region does not yet have verified culture expertise mappings."
    }
  ]
}
```

The user should be able to accept, change, or clear every pre-filled mechanical choice before save.

## Sheet Mode Design

Sheet Mode should be a clean, functional wizard that follows the backend creation model directly.

Expected behavior:

- Pull all options from `GET /api/content/bootstrap`.
- Build a draft character object locally.
- Call `POST /api/creation/preview` after meaningful changes.
- Show validation results near the field they affect.
- Show global blocking issues before final save.
- Save new characters through `POST /api/characters`.
- Save edits to an existing secret-link character through `PUT /api/characters/:token`.

Sheet Mode should not contain hardcoded game option lists. Labels, source metadata, verification status, and unavailable state should come from content payloads.

## Shared Draft Model

Both modes should use a frontend draft state that is close to the canonical character schema but allows incomplete fields while the user is still building.

Recommended draft model:

```ts
type CharacterCreationDraft = {
  mode: "journey" | "sheet";
  selections: Partial<Character>;
  journey?: JourneyAnswers;
  preview?: CreationPreviewResponse;
};
```

The frontend may keep extra UI-only data such as current step, touched fields, or expanded panels, but it should not persist those as part of the saved character unless explicitly modeled.

## Content Additions Needed

The backend already has core rules content. Journey Mode will need additional structured content files before implementation:

- `content/regions.json`
- `content/journey_prompts.json`
- `content/journey_mappings.json`

### Region Entity

```json
{
  "id": "region_id",
  "name": "Region Name",
  "displayName": "Region Name",
  "mapPosition": { "x": 0.5, "y": 0.5 },
  "summary": "Short source-backed description.",
  "availableAncestryIds": [],
  "recommendedCultureExpertiseIds": [],
  "source_book": "Stormlight Handbook",
  "source_page": null,
  "verification_status": "partial",
  "notes": "Unavailable until culture mapping is extracted."
}
```

### Journey Prompt Entity

```json
{
  "id": "mercy_or_justice",
  "prompt": "A defeated enemy asks for protection from your allies. What do you do?",
  "answers": [
    {
      "id": "protect_them",
      "label": "Protect them, even if it costs you trust.",
      "tags": ["mercy", "protection"]
    }
  ],
  "source_book": "App-authored UX prompt",
  "source_page": null,
  "verification_status": "verified",
  "notes": "Prompt is not game rules content; it only produces recommendation tags."
}
```

### Journey Mapping Entity

```json
{
  "id": "scholar_from_curiosity",
  "fromTags": ["curiosity", "scholarship"],
  "targetField": "startingPathId",
  "targetId": "scholar",
  "strength": 2,
  "source_book": "App recommendation logic",
  "source_page": null,
  "verification_status": "verified",
  "notes": "Recommendation only. Final legality is checked by the rules engine."
}
```

Recommendation mappings are not sourcebook rules. They are app-authored UX metadata that points only to verified mechanical options. They must never imply official guidance.

## API Needs

The current backend can support Sheet Mode directly.

Journey Mode needs structured UI content in addition to the core rules content. The recommended first implementation is to extend `GET /api/content/bootstrap` with a separate `journey` object:

```json
{
  "journey": {
    "regions": [],
    "prompts": [],
    "mappings": []
  }
}
```

This keeps the frontend to one content fetch while preserving a clear boundary between official rules content and app-authored recommendation content.

If the payload grows too large or if Journey Mode logic needs independent versioning, split this later into:

- `GET /api/content/journey`

A future server-side recommendation endpoint may also be useful:

- `POST /api/creation/journey-preview`

Purpose:

- accept Journey answers
- return recommended selections, reasons, unresolved choices, and a normal creation preview

For v1, prefer client-side recommendation from structured content unless the mapping algorithm becomes too large or we want server-side test coverage of the recommendation result.

## Validation And Error Handling

Both modes should treat backend validation as authoritative.

Expected behavior:

- Field-level errors appear near the affected field.
- Global errors appear at the top of the current step and review screen.
- Unsupported formulas appear as warnings, not silent blanks.
- Partial content should not be selectable in strict mode unless an explicit override feature exists.
- Journey Mode recommendations that cannot be validated should become unresolved choices, not saved fields.

## Privacy And Access

The UI should reinforce that saved character URLs are bearer secrets.

Required UI copy themes:

- Anyone with the link can view and edit this character.
- Do not post the link publicly.
- Future account ownership can be added later, but v1 is anonymous.

The frontend must not create listing, search, or public browsing behavior for anonymous characters.

## Visual Direction

The first UI should feel like an elegant field journal crossed with a precise rules tool.

Recommended direction:

- parchment and slate tones
- stormlight-like accents used sparingly
- cartographic linework and map pins for Journey Mode
- compact, legible form controls for Sheet Mode
- clear badges for verified, partial, unavailable, and GM-confirmation-required states
- restrained motion for mode selection, map marker selection, and review transitions

The UI should be atmospheric without obscuring rules clarity.

## Testing Strategy

When implementation begins, cover:

- mode gate renders both creation modes
- Sheet Mode loads options from bootstrap rather than hardcoded lists
- Journey Mode recommendations produce draft selections and reasons
- unavailable region/content mappings cannot be selected as mechanical choices
- review screen calls the creation preview API
- final save uses the canonical character endpoint
- bearer-secret warning appears before or after save

Prefer unit tests for recommendation mapping and component tests for wizard behavior.

## Open Questions

- Which region and culture data can be legally and accurately extracted first?
- Should scenario prompts be app-authored only, or should some quote/source-adjacent prompts be extracted later?
- Should Journey Mode store its answers in the final character JSON, or only the resulting story fields and mechanical choices?
- Should map coordinates be abstract UI positions only, or should we eventually support a proper licensed/reference map layer?

## Implementation Sequence

Recommended next plan:

1. Add frontend app shell and API client.
2. Add content bootstrap support for UI metadata and verification badges.
3. Build the creation mode gate.
4. Build Sheet Mode as the functional baseline.
5. Add Review and Finalize screen.
6. Add Journey Mode with app-authored prompts and source-backed mappings.
7. Add stylized regional selector once `regions.json` exists.

This keeps the backend contract honest while giving us a path toward the richer story-driven builder.
