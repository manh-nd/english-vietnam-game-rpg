# AGENTS.md

## 1. Project Goal

This repository is a **Godot 4 web-exportable 2D top-down RPG** that teaches English to Vietnamese learners through an authored journey across Vietnam.

The intended player experience is:

- Explore Vietnam through small, readable top-down RPG scenes.
- Meet NPCs who present practical English-learning conversations.
- Complete short quests that reinforce vocabulary, dialogue comprehension, and useful travel phrases.
- Progress through authored learning content in a way that feels playful before it becomes broad or technically complex.

The current design priority is to make the **authored dialogue and learning loop fun, clear, and replayable** before adding larger systems.

## 2. Current MVP Scope

The MVP is focused on making the **Ha Giang Loop** playable as the first vertical slice.

MVP work should prioritize:

- Player movement and interaction in the Ha Giang Loop scene.
- NPC dialogue driven by JSON content.
- Short quests driven by JSON content.
- Lessons and learning prompts driven by JSON content.
- Passport/progression feedback for completing authored Ha Giang Loop activities.
- Placeholder visuals that make gameplay understandable without blocking on final art.
- Web export compatibility from Godot 4.

Do **not** expand the game horizontally until the first loop is fun. In particular, do not add new locations before the **Ha Giang Loop** is playable and testable end-to-end.

## 3. Repo Structure

Expected repository layout:

- `project.godot` — Godot project settings, autoloads, input map, renderer settings, and main scene configuration.
- `assets/` — art, icons, temporary placeholder assets, and future production assets.
- `data/` — JSON-authored learning and game content. This is the source of truth for lessons, quests, NPCs, and locations.
  - `data/locations.json` — location metadata and scene references.
  - `data/npcs.json` — NPC metadata and authored dialogue references/content.
  - `data/quests.json` — quest definitions and completion requirements.
  - `data/lessons.json` — English-learning lesson content.
- `scenes/` — Godot `.tscn` scenes.
  - `scenes/Main.tscn` — project entry scene.
  - `scenes/world/HaGiangLoop.tscn` — MVP gameplay test scene.
  - `scenes/characters/` — player and character scenes.
  - `scenes/ui/` — UI scenes such as dialogue panels.
- `scripts/` — GDScript runtime behavior.
  - `scripts/content/` — content loading and validation helpers.
  - `scripts/core/` — game state and progression systems.
  - `scripts/player/` — player input and movement behavior.
  - `scripts/ui/` — UI controllers.
  - `scripts/world/` — location and world interaction controllers.

When adding new files, keep this structure simple and avoid premature framework abstractions.

## 4. Godot 4 / GDScript Conventions

Follow Godot 4 conventions throughout the project:

- Use Godot 4-compatible APIs and syntax only.
- Prefer typed GDScript where it improves clarity, especially for function return types, exported variables, and core data structures.
- Use `snake_case` for files, variables, functions, node paths, and signal names.
- Use `PascalCase` for class names when `class_name` is appropriate.
- Keep scripts small and attached to scenes that own the behavior.
- Prefer composition through scenes/nodes over large inheritance hierarchies.
- Use `@export` for designer-tunable values.
- Avoid magic strings in gameplay code when a stable constant or data ID is more appropriate.
- Keep autoloads minimal and purposeful; do not turn global singletons into catch-all managers.
- Do not put `try`/`catch` blocks around imports or preload/load statements.
- Keep gameplay logic deterministic and lightweight enough for web export.

Scene conventions:

- Every gameplay feature should be testable in `scenes/world/HaGiangLoop.tscn` during the MVP.
- Prefer placeholder nodes, `ColorRect`, simple shapes, and temporary sprites over final art while proving gameplay.
- Keep scene node names descriptive and stable because scripts may rely on them.
- Avoid adding editor-only dependencies that break headless checks or web exports.

## 5. Data-Driven Content Rules

This project is data-driven. Authored game and learning content belongs in `data/*.json`, not in scripts.

Required rules:

- Do **not** hardcode lesson, quest, NPC, or location content in scripts.
- All learning content must live in `data/*.json`.
- NPC dialogue, lesson prompts, vocabulary, quiz choices, quest text, rewards, location descriptions, and progression metadata should be authored in JSON.
- Scripts may load, validate, route, and display content, but should not define the authored content itself.
- Use stable string IDs to connect locations, NPCs, quests, lessons, and passport/progression records.
- Prefer adding fields to JSON content over adding one-off script branches.
- Keep content schemas simple and readable by non-programmers.
- If a feature needs new authored data, update the relevant JSON file and the loader/consumer together in the same focused PR.

During the MVP, content should serve the Ha Giang Loop vertical slice first.

## 6. JSON Content Rules

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
- Validate JSON after edits with a command such as `python -m json.tool data/<file>.json` or an equivalent parser.

## 7. Web Export Constraints

The project should remain exportable to Web from Godot 4.

Web compatibility rules:

- Avoid native plugins, platform-specific APIs, and desktop-only filesystem assumptions.
- Use `res://` project resources for bundled content.
- Keep runtime file access compatible with exported resources.
- Keep memory, texture sizes, and scene complexity modest.
- Avoid blocking network calls and large synchronous operations during gameplay.
- Do not add advanced AI API integration until the authored dialogue loop is fun.
- Do not require secrets, API keys, local files outside the exported project, or server-only infrastructure for MVP gameplay.
- Test changes in a way that does not assume a desktop-only runtime path.
- Preserve Godot 4 GL Compatibility / web-friendly rendering choices unless there is a deliberate, tested reason to change them.

## 8. Testing Expectations

Before submitting changes, run the checks that are practical for the change type.

Minimum expectations:

- For JSON changes, validate every edited `data/*.json` file with `python -m json.tool` or an equivalent parser.
- For GDScript changes, run Godot headless checks if the Godot executable is available in the environment.
- For scene or gameplay changes, verify the feature can be exercised in `scenes/world/HaGiangLoop.tscn`.
- For web-sensitive changes, consider whether the change depends on unsupported native, filesystem, network, or rendering behavior.
- If a check cannot be run because Godot or another dependency is unavailable, state that clearly in the PR/test summary.

Recommended commands when available:

```sh
python -m json.tool data/locations.json >/dev/null
python -m json.tool data/npcs.json >/dev/null
python -m json.tool data/quests.json >/dev/null
python -m json.tool data/lessons.json >/dev/null
godot --headless --path . --quit
```

## 9. PR Checklist

Codex and human contributors should complete this checklist before submitting future PRs:

- [ ] The PR is small, focused, and describes one coherent change.
- [ ] No gameplay code hardcodes lesson, quest, NPC, dialogue, or location content.
- [ ] All learning content added or changed lives in `data/*.json`.
- [ ] Edited JSON files have been validated with a parser.
- [ ] The change is testable in the Ha Giang Loop scene during the MVP.
- [ ] No new locations were added before the Ha Giang Loop is playable end-to-end.
- [ ] No combat, inventory, economy, or procedural content systems were introduced.
- [ ] No advanced AI API integration was added before the authored dialogue loop is fun.
- [ ] Placeholder art was preferred over final art unless final art was explicitly requested.
- [ ] The project remains exportable to Web from Godot 4.
- [ ] Relevant checks were run, or any skipped checks are explained with the reason.
- [ ] The final response/PR summary includes the commands that were run.

## 10. Do-Not Rules

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
- Do not add dependencies that compromise Godot 4 Web export.
- Do not require online services for the MVP gameplay loop.
- Do not replace simple authored content with complex frameworks before the vertical slice proves the fun.
