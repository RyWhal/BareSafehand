import { noIndexHeaders } from "../http";

const ROBOTS_TXT = `User-agent: *
Disallow: /api/
Disallow: /characters/
`;

const APP_CSS = `
:root {
  --color-ink: #17212a;
  --color-muted: #5e6a70;
  --color-parchment: #efe1c1;
  --color-parchment-deep: #d7bd86;
  --color-slate: #172936;
  --color-storm: #75d0c2;
  --color-warning: #b8752a;
  --color-danger: #9b342f;
  --shadow-soft: 0 24px 80px rgba(12, 23, 30, 0.22);
  color: var(--color-ink);
  font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
  background: var(--color-slate);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(117, 208, 194, 0.2), transparent 34rem),
    linear-gradient(135deg, #111d27 0%, #21394a 48%, #6c5c3f 100%);
}

button,
input,
select,
textarea {
  font: inherit;
}

button {
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  padding: 0.72rem 1.1rem;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.shell {
  min-height: 100vh;
  padding: 1.25rem;
}

.topbar {
  align-items: center;
  color: #f7eed8;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  margin: 0 auto 1.4rem;
  max-width: 1180px;
}

.brand {
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.badge {
  background: rgba(239, 225, 193, 0.13);
  border: 1px solid rgba(239, 225, 193, 0.22);
  border-radius: 999px;
  color: #f7eed8;
  font-size: 0.82rem;
  padding: 0.35rem 0.65rem;
}

.workspace {
  background:
    linear-gradient(135deg, rgba(255, 252, 240, 0.97), rgba(239, 225, 193, 0.94)),
    repeating-linear-gradient(0deg, rgba(74, 53, 31, 0.04), rgba(74, 53, 31, 0.04) 1px, transparent 1px, transparent 7px);
  border: 1px solid rgba(239, 225, 193, 0.55);
  border-radius: 28px;
  box-shadow: var(--shadow-soft);
  margin: 0 auto;
  max-width: 1180px;
  min-height: calc(100vh - 6rem);
  overflow: hidden;
}

.hero {
  display: grid;
  gap: 2rem;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.82fr);
  padding: clamp(1.5rem, 4vw, 4.5rem);
}

.kicker {
  color: #6b5332;
  font-family: Avenir, "Gill Sans", sans-serif;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

h1,
h2,
h3 {
  margin: 0;
}

h1 {
  color: var(--color-slate);
  font-size: clamp(3rem, 8vw, 6.6rem);
  line-height: 0.88;
  margin-top: 0.65rem;
}

h2 {
  color: var(--color-slate);
  font-size: clamp(2rem, 4vw, 3.5rem);
  line-height: 0.95;
}

p {
  line-height: 1.6;
}

.lede {
  color: #3d4b51;
  font-size: clamp(1.05rem, 2vw, 1.32rem);
  max-width: 42rem;
}

.mode-grid {
  display: grid;
  gap: 1rem;
  margin-top: 2rem;
}

.mode-card {
  background: rgba(255, 255, 255, 0.28);
  border: 1px solid rgba(41, 54, 61, 0.16);
  border-radius: 22px;
  color: var(--color-ink);
  padding: 1.15rem;
  text-align: left;
  transition: transform 170ms ease, border-color 170ms ease, background 170ms ease;
}

.mode-card:hover {
  background: rgba(255, 255, 255, 0.44);
  border-color: rgba(117, 208, 194, 0.75);
  transform: translateY(-2px);
}

.mode-card strong {
  display: block;
  font-size: 1.2rem;
  margin-bottom: 0.3rem;
}

.map-panel {
  background:
    radial-gradient(circle at 30% 20%, rgba(117, 208, 194, 0.38), transparent 8rem),
    radial-gradient(circle at 62% 63%, rgba(239, 225, 193, 0.5), transparent 11rem),
    linear-gradient(160deg, #203746, #0f1b23);
  border-radius: 28px;
  min-height: 450px;
  overflow: hidden;
  padding: 1.2rem;
  position: relative;
}

.map-panel::before {
  border: 1px solid rgba(239, 225, 193, 0.3);
  border-radius: 47% 53% 51% 49%;
  content: "";
  inset: 16% 11% 12% 18%;
  position: absolute;
  transform: rotate(-12deg);
}

.map-pin {
  background: var(--color-storm);
  border-radius: 999px;
  box-shadow: 0 0 32px rgba(117, 208, 194, 0.8);
  height: 0.8rem;
  position: absolute;
  width: 0.8rem;
}

.pin-a { left: 31%; top: 34%; }
.pin-b { left: 58%; top: 51%; opacity: 0.45; }
.pin-c { left: 45%; top: 69%; opacity: 0.25; }

.map-note {
  background: rgba(12, 23, 30, 0.76);
  border: 1px solid rgba(239, 225, 193, 0.18);
  border-radius: 18px;
  bottom: 1.2rem;
  color: #f7eed8;
  left: 1.2rem;
  padding: 1rem;
  position: absolute;
  right: 1.2rem;
}

.builder {
  display: grid;
  grid-template-columns: 17rem minmax(0, 1fr) 21rem;
  min-height: calc(100vh - 6rem);
}

.rail,
.review {
  background: rgba(23, 41, 54, 0.94);
  color: #f7eed8;
  padding: 1.25rem;
}

.rail button,
.primary,
.ghost {
  font-family: Avenir, "Gill Sans", sans-serif;
  font-weight: 700;
}

.rail button {
  background: transparent;
  color: #f7eed8;
  display: block;
  margin: 0.35rem 0;
  text-align: left;
  width: 100%;
}

.rail button.active {
  background: rgba(117, 208, 194, 0.16);
  color: var(--color-storm);
}

.form {
  padding: clamp(1.2rem, 3vw, 2rem);
}

.section {
  border-top: 1px solid rgba(23, 41, 54, 0.16);
  margin-top: 1.35rem;
  padding-top: 1.35rem;
}

.grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.skill-grid {
  display: grid;
  gap: 0.7rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

label {
  color: #3b464b;
  display: grid;
  gap: 0.35rem;
  font-family: Avenir, "Gill Sans", sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

input,
select,
textarea {
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(23, 41, 54, 0.24);
  border-radius: 14px;
  color: var(--color-ink);
  padding: 0.7rem 0.8rem;
  width: 100%;
}

textarea {
  min-height: 6rem;
  resize: vertical;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  margin-top: 1.2rem;
}

.primary {
  background: var(--color-slate);
  color: #f7eed8;
}

.ghost {
  background: rgba(23, 41, 54, 0.08);
  color: var(--color-slate);
}

.issue-list {
  display: grid;
  gap: 0.6rem;
  margin-top: 1rem;
}

.issue {
  background: rgba(155, 52, 47, 0.13);
  border-left: 3px solid var(--color-danger);
  border-radius: 12px;
  color: #f7eed8;
  padding: 0.75rem;
}

.warning {
  background: rgba(184, 117, 42, 0.15);
  border-left-color: var(--color-warning);
}

.summary {
  color: rgba(247, 238, 216, 0.83);
  font-family: Avenir, "Gill Sans", sans-serif;
  font-size: 0.92rem;
}

.saved-link {
  background: rgba(117, 208, 194, 0.14);
  border: 1px solid rgba(117, 208, 194, 0.34);
  border-radius: 16px;
  color: #f7eed8;
  margin-top: 1rem;
  overflow-wrap: anywhere;
  padding: 0.9rem;
}

@media (max-width: 980px) {
  .hero,
  .builder {
    grid-template-columns: 1fr;
  }

  .review,
  .rail {
    order: initial;
  }

  .skill-grid,
  .grid {
    grid-template-columns: 1fr;
  }
}
`;

const APP_JS = `
(function () {
  const ATTRIBUTE_KEYS = ["strength", "speed", "intellect", "willpower", "awareness", "presence"];
  const root = document.querySelector("[data-app-root]");

  const state = {
    mode: "gate",
    token: root ? root.dataset.characterToken || "" : "",
    content: null,
    draft: null,
    preview: null,
    loading: false,
    savedUrl: "",
    loadError: ""
  };

  function skillKey(id) {
    return id.replace(/_([a-z])/g, function (_, letter) {
      return letter.toUpperCase();
    });
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function makeEmptyDraft(content) {
    const skills = {};

    for (const skill of content.skills || []) {
      skills[skillKey(skill.id)] = { ranks: 0, modifier: 0 };
    }

    return {
      identity: {
        characterName: "",
        playerName: "",
        ancestryId: null,
        cultureExpertiseIds: [],
        pathIds: [],
        startingPathId: null
      },
      attributes: {
        strength: 0,
        speed: 0,
        intellect: 0,
        willpower: 0,
        awareness: 0,
        presence: 0
      },
      skills,
      expertises: [],
      talents: [],
      inventory: {
        startingKitId: null,
        weapons: [],
        armor: [],
        equipment: [],
        currency: { marks: 0, notes: "" }
      },
      story: {
        purpose: "",
        obstacle: "",
        goals: [],
        notes: "",
        appearance: "",
        personality: "",
        connections: []
      }
    };
  }

  function setPath(path, value) {
    const parts = path.split(".");
    let cursor = state.draft;

    for (let index = 0; index < parts.length - 1; index += 1) {
      cursor = cursor[parts[index]];
    }

    cursor[parts[parts.length - 1]] = value;
  }

  async function fetchJson(url, options) {
    const response = await fetch(url, options);
    const payload = await response.json();

    if (!response.ok) {
      const firstError = payload && payload.errors && payload.errors[0];
      throw new Error(firstError ? firstError.message : "Request failed.");
    }

    return payload;
  }

  async function loadContent() {
    state.content = await fetchJson("/api/content/bootstrap");
    state.draft = makeEmptyDraft(state.content);
  }

  async function loadExistingCharacter() {
    if (!state.token) {
      return;
    }

    const payload = await fetchJson("/api/characters/" + encodeURIComponent(state.token));
    state.draft = payload.envelope.character;
    state.mode = "sheet";
  }

  async function refreshPreview() {
    if (!state.draft) {
      return;
    }

    state.preview = await fetchJson("/api/creation/preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(state.draft)
    });
  }

  function quickFill() {
    const draft = makeEmptyDraft(state.content);

    draft.identity.characterName = "New Radiant-To-Be";
    draft.identity.ancestryId = "human";
    draft.identity.startingPathId = "agent";
    draft.identity.pathIds = ["agent"];
    draft.attributes = {
      strength: 3,
      speed: 3,
      intellect: 0,
      willpower: 3,
      awareness: 3,
      presence: 0
    };
    draft.skills.agility.ranks = 1;
    draft.skills.athletics.ranks = 1;
    draft.skills.discipline.ranks = 1;
    draft.skills.perception.ranks = 1;
    draft.talents = ["erudition"];
    draft.inventory.startingKitId = "academic_kit";
    draft.story.purpose = "Protect people who are easy to overlook.";
    draft.story.obstacle = "A private duty keeps pulling them away from safety.";
    draft.story.goals = ["Earn trust without hiding the truth."];

    state.draft = draft;
  }

  function optionList(items, selectedId) {
    return (items || []).map(function (item) {
      return '<option value="' + escapeHtml(item.id) + '"' + (item.id === selectedId ? " selected" : "") + ">" + escapeHtml(item.name) + "</option>";
    }).join("");
  }

  function renderGate() {
    return '<section class="hero">' +
      '<div>' +
      '<div class="kicker">Strict verified rules</div>' +
      '<h1>BareSafehand</h1>' +
      '<p class="lede">Build a Stormlight RPG character from structured content, preview legality, and save the sheet as an anonymous secret-link JSON object.</p>' +
      '<div class="mode-grid">' +
      '<button class="mode-card" data-action="journey"><strong>Journey Mode</strong><span>Discover identity through region, values, and story prompts, then review the pre-filled sheet.</span></button>' +
      '<button class="mode-card" data-action="sheet"><strong>Sheet Mode</strong><span>Pick exact verified options and validate directly against the rules engine.</span></button>' +
      '</div>' +
      '</div>' +
      '<div class="map-panel" aria-hidden="true">' +
      '<span class="map-pin pin-a"></span><span class="map-pin pin-b"></span><span class="map-pin pin-c"></span>' +
      '<div class="map-note"><strong>Journey map scaffold</strong><p>Regional selectors will unlock only when their lore and mechanical mappings exist as source-backed JSON.</p></div>' +
      '</div>' +
      '</section>';
  }

  function renderJourneyMode() {
    return '<section class="hero">' +
      '<div>' +
      '<div class="kicker">Journey Mode</div>' +
      '<h2>Interactive story mode is scaffolded.</h2>' +
      '<p class="lede">This path will use source-backed region and prompt content before it pre-fills mechanical choices. Until those JSON files exist, the safe path is to build in Sheet Mode.</p>' +
      '<div class="actions">' +
      '<button class="primary" data-action="sheet">Open Sheet Mode</button>' +
      '<button class="ghost" data-action="gate">Back to mode choice</button>' +
      '</div>' +
      '</div>' +
      '<div class="map-panel"><span class="map-pin pin-a"></span><span class="map-pin pin-b"></span><span class="map-pin pin-c"></span><div class="map-note"><strong>No invented content</strong><p>Unavailable regions stay locked until extracted and verified.</p></div></div>' +
      '</section>';
  }

  function renderField(path, label, value, type) {
    return '<label>' + escapeHtml(label) + '<input data-field="' + escapeHtml(path) + '" type="' + (type || "text") + '" value="' + escapeHtml(value || "") + '"></label>';
  }

  function renderTextarea(path, label, value) {
    return '<label>' + escapeHtml(label) + '<textarea data-field="' + escapeHtml(path) + '">' + escapeHtml(value || "") + '</textarea></label>';
  }

  function renderAttributes() {
    return ATTRIBUTE_KEYS.map(function (key) {
      return '<label>' + escapeHtml(key) + '<input data-number-field="attributes.' + key + '" type="number" min="0" max="3" value="' + escapeHtml(state.draft.attributes[key]) + '"></label>';
    }).join("");
  }

  function renderSkills() {
    return (state.content.skills || []).map(function (skill) {
      const key = skillKey(skill.id);
      const slot = state.draft.skills[key] || { ranks: 0 };
      return '<label>' + escapeHtml(skill.name) + '<input data-skill="' + escapeHtml(key) + '" type="number" min="0" max="2" value="' + escapeHtml(slot.ranks) + '"></label>';
    }).join("");
  }

  function renderTalentChoices() {
    const ancestryTalents = state.preview && state.preview.selectableMetadata
      ? state.preview.selectableMetadata.ancestryTalents
      : null;

    if (!ancestryTalents || !ancestryTalents.choiceGroups || ancestryTalents.choiceGroups.length === 0) {
      return '<p>No ancestry talent choice is currently required for this draft.</p>';
    }

    return ancestryTalents.choiceGroups.map(function (group) {
      const options = group.options.map(function (option) {
        const ids = option.talentIds || [option.id];
        const checked = ids.every(function (id) {
          return state.draft.talents.indexOf(id) >= 0;
        });

        return '<label><input data-talent-group="' + escapeHtml(group.id) + '" data-talent-type="' + escapeHtml(group.type) + '" data-talent-ids="' + escapeHtml(ids.join(",")) + '" type="radio" name="' + escapeHtml(group.id) + '"' + (checked ? " checked" : "") + '> ' + escapeHtml(option.name) + '</label>';
      }).join("");

      return '<div class="section"><h3>' + escapeHtml(group.id.replaceAll("_", " ")) + '</h3>' + options + '</div>';
    }).join("");
  }

  function renderIssues(items, warning) {
    if (!items || items.length === 0) {
      return "";
    }

    return '<div class="issue-list">' + items.map(function (issue) {
      return '<div class="issue ' + (warning ? "warning" : "") + '"><strong>' + escapeHtml(issue.code) + '</strong><br>' + escapeHtml(issue.message) + '</div>';
    }).join("") + '</div>';
  }

  function renderReview() {
    const preview = state.preview;
    const errors = preview ? preview.errors || [] : [];
    const warnings = preview ? preview.warnings || [] : [];
    const derived = preview ? preview.derived || {} : {};
    const canSave = preview && errors.length === 0;
    const saved = state.savedUrl
      ? '<div class="saved-link"><strong>Secret edit link</strong><br><a href="' + escapeHtml(state.savedUrl) + '">' + escapeHtml(state.savedUrl) + '</a><p>Anyone with this link can view and edit the character.</p></div>'
      : "";

    return '<aside class="review">' +
      '<div class="kicker">Review</div>' +
      '<h3>Validation and save</h3>' +
      '<p class="summary">Preview is generated by the Worker rules engine. Save is enabled only when blocking errors are clear.</p>' +
      '<div class="summary">' +
      '<p><strong>Physical Defense:</strong> ' + escapeHtml(derived.physicalDefense || "pending") + '</p>' +
      '<p><strong>Cognitive Defense:</strong> ' + escapeHtml(derived.cognitiveDefense || "pending") + '</p>' +
      '<p><strong>Spiritual Defense:</strong> ' + escapeHtml(derived.spiritualDefense || "pending") + '</p>' +
      '<p><strong>Max Focus:</strong> ' + escapeHtml(derived.focusMax || "pending") + '</p>' +
      '</div>' +
      renderIssues(errors, false) +
      renderIssues(warnings, true) +
      '<div class="actions"><button class="primary" data-action="save" ' + (canSave ? "" : "disabled") + '>' + (state.token ? "Save edits" : "Save character") + '</button></div>' +
      saved +
      '</aside>';
  }

  function renderSheetMode() {
    if (!state.content || !state.draft) {
      return '<section class="hero"><p>Loading verified content...</p></section>';
    }

    return '<section class="builder">' +
      '<aside class="rail">' +
      '<div class="brand">BareSafehand</div>' +
      '<button data-action="gate">Mode gate</button>' +
      '<button class="active" data-action="sheet">Sheet Mode</button>' +
      '<button data-action="journey">Journey Mode</button>' +
      '<p class="summary">Strict verified content. Secret-link editing. No public library.</p>' +
      '</aside>' +
      '<main class="form">' +
      '<div class="kicker">Sheet Mode</div>' +
      '<h2>Create from verified options</h2>' +
      '<p>Use exact selections, then let the backend preview normalize free path ranks, required talents, warnings, and supported derived stats.</p>' +
      '<div class="actions"><button class="ghost" data-action="quick-fill">Use verified demo spread</button><button class="ghost" data-action="preview">Refresh preview</button></div>' +
      '<div class="section grid">' +
      renderField("identity.characterName", "Character name", state.draft.identity.characterName) +
      renderField("identity.playerName", "Player name", state.draft.identity.playerName) +
      '<label>Ancestry<select data-field="identity.ancestryId"><option value="">Choose ancestry</option>' + optionList(state.content.ancestries, state.draft.identity.ancestryId) + '</select></label>' +
      '<label>Starting path<select data-field="identity.startingPathId"><option value="">Choose path</option>' + optionList(state.content.heroicPaths, state.draft.identity.startingPathId) + '</select></label>' +
      '<label>Starting kit<select data-field="inventory.startingKitId"><option value="">Choose kit</option>' + optionList(state.content.startingKits, state.draft.inventory.startingKitId) + '</select></label>' +
      '</div>' +
      '<div class="section"><h3>Attributes</h3><p>Distribute 12 points, max 3 per attribute. Intellect currently requires verified expertise choices equal to its value.</p><div class="grid">' + renderAttributes() + '</div></div>' +
      '<div class="section"><h3>Skills</h3><p>Enter the four discretionary ranks. The starting path free rank is applied by preview.</p><div class="skill-grid">' + renderSkills() + '</div></div>' +
      '<div class="section"><h3>Ancestry talents</h3>' + renderTalentChoices() + '</div>' +
      '<div class="section grid">' +
      renderTextarea("story.purpose", "Purpose", state.draft.story.purpose) +
      renderTextarea("story.obstacle", "Obstacle", state.draft.story.obstacle) +
      renderTextarea("story.goals.0", "First goal", state.draft.story.goals[0] || "") +
      renderTextarea("story.notes", "Notes", state.draft.story.notes) +
      '</div>' +
      '</main>' +
      renderReview() +
      '</section>';
  }

  function render() {
    if (!root) {
      return;
    }

    let body = "";

    if (state.loadError) {
      body = '<section class="hero"><div><h2>Something needs attention.</h2><p>' + escapeHtml(state.loadError) + '</p><button class="primary" data-action="gate">Start a new character</button></div></section>';
    } else if (state.mode === "journey") {
      body = renderJourneyMode();
    } else if (state.mode === "sheet") {
      body = renderSheetMode();
    } else {
      body = renderGate();
    }

    root.innerHTML = '<div class="shell"><header class="topbar"><div class="brand">BareSafehand</div><div class="badge-row"><span class="badge">Strict verified rules</span><span class="badge">Anonymous secret URL</span></div></header><div class="workspace">' + body + '</div></div>';
  }

  async function previewAndRender() {
    try {
      await refreshPreview();
      state.loadError = "";
    } catch (error) {
      state.loadError = error.message;
    }

    render();
  }

  async function saveCharacter() {
    const body = state.token && state.preview ? state.preview.character : state.draft;
    const url = state.token ? "/api/characters/" + encodeURIComponent(state.token) : "/api/characters";
    const method = state.token ? "PUT" : "POST";
    const payload = await fetchJson(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });

    if (payload.editUrl) {
      state.savedUrl = payload.editUrl.replace("/api/characters/", "/characters/");
    } else {
      state.savedUrl = window.location.href;
    }

    if (payload.editToken) {
      state.token = payload.editToken;
    }

    if (payload.envelope && payload.envelope.character) {
      state.draft = payload.envelope.character;
    }

    await previewAndRender();
  }

  function removeTalentGroupSelections(groupId) {
    const inputs = Array.from(document.querySelectorAll('[data-talent-group="' + groupId + '"]'));
    const removeIds = new Set();

    for (const input of inputs) {
      for (const id of (input.dataset.talentIds || "").split(",")) {
        if (id) {
          removeIds.add(id);
        }
      }
    }

    state.draft.talents = (state.draft.talents || []).filter(function (id) {
      return !removeIds.has(id);
    });
  }

  root.addEventListener("click", async function (event) {
    const target = event.target.closest("[data-action]");

    if (!target) {
      return;
    }

    const action = target.dataset.action;

    try {
      if (action === "gate") {
        state.mode = "gate";
        render();
      }

      if (action === "journey") {
        state.mode = "journey";
        render();
      }

      if (action === "sheet") {
        state.mode = "sheet";
        await previewAndRender();
      }

      if (action === "quick-fill") {
        quickFill();
        state.mode = "sheet";
        await previewAndRender();
      }

      if (action === "preview") {
        await previewAndRender();
      }

      if (action === "save") {
        await saveCharacter();
      }
    } catch (error) {
      state.loadError = error.message;
      render();
    }
  });

  root.addEventListener("change", async function (event) {
    const target = event.target;

    if (target.dataset.field) {
      const value = target.value === "" && target.tagName === "SELECT" ? null : target.value;
      setPath(target.dataset.field, value);
    }

    if (target.dataset.numberField) {
      setPath(target.dataset.numberField, Number(target.value));
    }

    if (target.dataset.skill) {
      state.draft.skills[target.dataset.skill].ranks = Number(target.value);
    }

    if (target.dataset.talentGroup) {
      removeTalentGroupSelections(target.dataset.talentGroup);
      const ids = (target.dataset.talentIds || "").split(",").filter(Boolean);
      state.draft.talents = Array.from(new Set([...(state.draft.talents || []), ...ids]));
    }

    await previewAndRender();
  });

  root.addEventListener("input", function (event) {
    const target = event.target;

    if (target.dataset.field && target.tagName !== "SELECT") {
      if (target.dataset.field === "story.goals.0") {
        state.draft.story.goals[0] = target.value;
      } else {
        setPath(target.dataset.field, target.value);
      }
    }
  });

  async function boot() {
    try {
      await loadContent();
      if (state.token) {
        await loadExistingCharacter();
      }
      render();
      if (state.mode === "sheet") {
        await previewAndRender();
      }
    } catch (error) {
      state.loadError = error.message;
      render();
    }
  }

  boot();
})();
`;

function textResponse(body: string, contentType: string, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set("content-type", contentType);

  return new Response(body, {
    ...init,
    headers
  });
}

export function appShellHandler(characterToken: string | null = null): Response {
  const tokenAttribute = characterToken ? ` data-character-token="${characterToken}"` : "";
  const body = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>BareSafehand Character Builder</title>
    <link rel="stylesheet" href="/app.css">
  </head>
  <body>
    <main data-app-root${tokenAttribute}>
      <div class="shell">
        <header class="topbar">
          <div class="brand">BareSafehand</div>
          <div class="badge-row">
            <span class="badge">Strict verified rules</span>
            <span class="badge">Anonymous secret URL</span>
          </div>
        </header>
        <div class="workspace">
          <section class="hero">
            <div>
              <div class="kicker">Strict verified rules</div>
              <h1>BareSafehand</h1>
              <p class="lede">Choose Journey Mode or Sheet Mode to start a character.</p>
              <div class="mode-grid">
                <button class="mode-card"><strong>Journey Mode</strong><span>Interactive story-first creation.</span></button>
                <button class="mode-card"><strong>Sheet Mode</strong><span>Direct verified sheet creation.</span></button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
    <script src="/app.js" defer></script>
  </body>
</html>`;

  return textResponse(body, "text/html; charset=utf-8", {
    headers: characterToken ? noIndexHeaders() : undefined
  });
}

export function appCssHandler(): Response {
  return textResponse(APP_CSS, "text/css; charset=utf-8");
}

export function appJsHandler(): Response {
  return textResponse(APP_JS, "application/javascript; charset=utf-8");
}

export function robotsHandler(): Response {
  return textResponse(ROBOTS_TXT, "text/plain; charset=utf-8");
}
