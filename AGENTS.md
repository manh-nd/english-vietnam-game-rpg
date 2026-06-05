# AGENTS.md

## 1. Project Goal

This repository is a **web-first TypeScript + Phaser 2D top-down RPG** that teaches English to Vietnamese learners through an authored journey across Vietnam.

The intended player experience is:

- Explore Vietnam through small, readable top-down RPG scenes in the browser.
- Meet NPCs who present practical English-learning conversations.
- Complete short quests that reinforce vocabulary, dialogue comprehension, and useful travel phrases.
- Progress through authored learning content in a way that feels playful before it becomes broad or technically complex.

The current design priority is to make the **authored dialogue and learning loop fun, clear, and replayable** in the web stack before adding larger systems.

## 2. Current Primary Implementation Target

The active implementation target is a **pure web game using Vite + TypeScript + Phaser**.

Primary web runtime work should happen under `src/` and should use standard browser-compatible TypeScript. New gameplay systems should be implemented in TypeScript.

The near-term MVP remains focused on making the **Ha Giang Loop** playable as the first vertical slice.

MVP work should prioritize:

- Player movement and interaction in the Phaser Ha Giang scene.
- NPC dialogue driven by JSON content.
- Short quests driven by JSON content.
- Lessons and learning prompts driven by JSON content.
- Passport/progression feedback for completing authored Ha Giang Loop activities.
- Placeholder visuals that make gameplay understandable without blocking on final art.
- Browser-first development, testing, and deployment through Vite.

Do **not** expand the game horizontally until the first loop is fun. In particular, do not add new locations before the **Ha Giang Loop** is playable and testable end-to-end in the web stack.

## 3. Legacy Godot Status

Godot migration reference files have been removed from the repository. The active runtime is now fully **web-first TypeScript + Phaser**.

Removed Godot runtime/editor material includes:

- `project.godot`
- `export_presets.cfg`
- `scenes/`
- `scripts/`
- `.godot/`
- `*.import` and other Godot-only asset import metadata

Historical Godot implementation details can be found in earlier git history if needed.

Rules after cleanup:

- Do **not** add new GDScript or Godot gameplay systems unless explicitly requested.
- Do **not** restore Godot runtime/editor files for normal MVP work.
- New implementation guidance should point to the web stack.

## 4. Repo Structure

Expected repository layout during migration:

- `src/` — active web implementation using Vite, TypeScript, and Phaser.
  - `src/game/scenes/HaGiangScene.ts` — primary MVP gameplay scene for the web vertical slice.
  - `src/game/systems/ContentDatabase.ts` — planned typed access layer for authored JSON content.
  - `src/game/systems/LessonManager.ts` — planned lesson flow/state coordinator.
  - `src/game/systems/QuestManager.ts` — planned later quest/progression coordinator.
  - `src/game/ui/DialogueBox.ts` — planned later reusable dialogue and lesson choice UI.
- `data/` — JSON-authored learning and game content. This remains the source of truth for lessons, quests, NPCs, and locations.
  - `data/locations.json` — location metadata and scene references.
  - `data/npcs.json` — NPC metadata and authored dialogue references/content.
  - `data/quests.json` — quest definitions and completion requirements.
  - `data/lessons.json` — English-learning lesson content.
- `tools/validate_content.py` — content validation tool for authored JSON references and schemas.
- `docs/` — roadmap, migration notes, and design documentation.
- `assets/` — art, icons, temporary placeholder assets, and future production assets.

When adding new files, keep this structure simple and avoid premature framework abstractions.

## 5. Architecture Direction

Current and planned web architecture:

- `src/game/scenes/HaGiangScene.ts` is the main Phaser scene for the Ha Giang Loop vertical slice.
- `src/game/systems/ContentDatabase.ts` should become the typed data access layer for `data/*.json` content.
- `src/game/systems/LessonManager.ts` should coordinate authored lesson state and answer feedback.
- `src/game/systems/QuestManager.ts` should be added later for quest state, requirements, and progression.
- `src/game/ui/DialogueBox.ts` should be added later for reusable web dialogue and lesson choice UI.

Architectural rules:

- Keep systems data-driven and browser-compatible.
- Keep authored lesson, NPC, quest, dialogue, and location content out of gameplay code.
- Prefer small TypeScript modules with clear ownership over large catch-all managers.
- Avoid introducing dependencies unless the user explicitly asks for them.
- Keep the Phaser foundation lightweight and easy to build with Vite.

## 6. TypeScript / Phaser Coding Conventions

Follow strict TypeScript and Phaser conventions throughout new web work:

- Use strict TypeScript with explicit types where they improve clarity.
- Use `camelCase` for variables and functions.
- Use `PascalCase` for classes and TypeScript types/interfaces.
- Keep scene classes focused on scene composition and Phaser lifecycle behavior.
- Put reusable gameplay/data logic in `src/game/systems/` instead of hardcoding it inside scene methods.
- Put reusable UI components in `src/game/ui/` when they are introduced.
- Prefer deterministic, lightweight browser-compatible logic.
- Do not add native, server-only, or desktop-only assumptions.
- Do not put `try`/`catch` blocks around imports.
- Do not add new dependencies in documentation-only or small gameplay PRs.

## 7. Data-Driven Content Rules

This project is data-driven. Authored game and learning content belongs in `data/*.json`, not in scripts.

Required rules:

- `data/*.json` remains the authored content source of truth.
- `tools/validate_content.py` remains the content validation tool.
- Do **not** hardcode lesson, quest, NPC, dialogue, quiz answer, or location content in gameplay systems.
- All learning content must live in `data/*.json`.
- NPC dialogue, lesson prompts, vocabulary, quiz choices, quest text, rewards, location descriptions, and progression metadata should be authored in JSON.
- TypeScript systems may load, validate, route, and display content, but should not define authored content themselves.
- Use stable string IDs to connect locations, NPCs, quests, lessons, and passport/progression records.
- Prefer adding fields to JSON content over adding one-off script branches.
- Keep content schemas simple and readable by non-programmers.
- If a feature needs new authored data, update the relevant JSON file and the loader/consumer together in the same focused PR.

During the MVP, content should serve the Ha Giang Loop vertical slice first.

## 8. JSON Content Rules

All files under `data/` should remain valid, readable JSON.

JSON authoring expectations:

- Top-level content files should use arrays of objects unless there is a clear reason to do otherwise.
- Every authored object should have a stable, unique `id` string.
- IDs should use lowercase `snake_case`.
- Prefer explicit references by ID, for example `lesson_id`, `npc_id`, `quest_id`, or `location_id`.
- Keep field names consistent across similar content types.
- Avoid deeply nested content unless it directly improves readability.
- Do not include comments in JSON files.
- Do not store generated, procedural, or machine-expanded bulk content in JSON during the MVP.
- Keep Vietnamese learner context in mind: English should be practical, level-appropriate, and easy to connect to the scenario.
- When adding dialogue choices, ensure the correct answer and feedback are represented in data, not hardcoded in UI scripts.
- Validate JSON after edits with `python tools/validate_content.py` and, when useful, `python -m json.tool data/<file>.json`.

## 9. Web Runtime Constraints

The project should run as a browser-first web game.

Web compatibility rules:

- Use Vite-compatible imports and browser-compatible TypeScript.
- Avoid native plugins, platform-specific APIs, and desktop-only filesystem assumptions.
- Use bundled project resources for authored content and assets.
- Keep memory, texture sizes, and scene complexity modest.
- Avoid blocking network calls and large synchronous operations during gameplay.
- Do not add advanced AI API integration until the authored dialogue loop is fun.
- Do not require secrets, API keys, local files outside the project, or server-only infrastructure for MVP gameplay.
- Test changes in a way that reflects the browser runtime.

## 10. Testing Expectations

Before submitting changes, run the checks that are practical for the change type.

Expected commands for web migration work:

```sh
npm run typecheck
npm run build
python tools/validate_content.py
```

Minimum expectations:

- For TypeScript changes, run `npm run typecheck`.
- For web runtime changes, run `npm run build`.
- For JSON/content changes, run `python tools/validate_content.py`.
- For documentation-only changes, run the practical validation checks above when available and explain any skipped checks.
- If a check cannot be run because a dependency is unavailable, state that clearly in the PR/test summary.

## 11. PR Checklist

Codex and human contributors should complete this checklist before submitting future PRs:

- [ ] The PR is small, focused, and describes one coherent change.
- [ ] New feature work targets the web TypeScript + Phaser stack under `src/`.
- [ ] Godot runtime/editor files were not restored unless explicitly requested.
- [ ] No new GDScript/Godot systems were added unless explicitly requested.
- [ ] No gameplay code hardcodes lesson, quest, NPC, dialogue, or location content.
- [ ] All learning content added or changed lives in `data/*.json`.
- [ ] Edited JSON files have been validated with `python tools/validate_content.py` or an equivalent parser.
- [ ] The change is testable in the Ha Giang web vertical slice during the MVP.
- [ ] No new locations were added before the Ha Giang Loop is playable end-to-end.
- [ ] No combat, inventory, economy, or procedural content systems were introduced.
- [ ] No advanced AI API integration was added before the authored dialogue loop is fun.
- [ ] Placeholder art was preferred over final art unless final art was explicitly requested.
- [ ] The project remains buildable as a browser-first Vite application.
- [ ] Relevant checks were run, or any skipped checks are explained with the reason.
- [ ] The final response/PR summary includes the commands that were run.

## 12. Do-Not Rules

Do not do the following during the MVP:

- Do not modify gameplay code when the task only asks for documentation or repository guidance.
- Do not hardcode lessons, quests, NPCs, dialogue, location descriptions, quiz answers, or learning content in scripts.
- Do not put learning content anywhere outside `data/*.json`.
- Do not add new locations before the Ha Giang Loop is playable.
- Do not create combat systems.
- Do not create inventory systems.
- Do not create economy, shop, currency, or item-pricing systems.
- Do not create procedural content systems.
- Do not add advanced AI API integration until the authored dialogue loop is fun.
- Do not make large, unfocused PRs.
- Do not block MVP progress on final art; use placeholders.
- Do not add dependencies that compromise the browser-first web runtime.
- Do not require online services for the MVP gameplay loop.
- Do not replace simple authored content with complex frameworks before the vertical slice proves the fun.
