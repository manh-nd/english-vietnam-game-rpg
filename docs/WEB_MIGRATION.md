# Web Migration Notes

## Current Direction

The project is moving toward a pure web TypeScript + Phaser architecture so the MVP can be developed, tested, and shipped directly through standard browser tooling. Phaser keeps the runtime lightweight, uses familiar web deployment paths, and makes it easier to iterate on the authored English-learning loop without depending on Godot web export settings during this prototype phase.

New feature work should target the **web stack under `src/`**, not the Godot runtime.

## Current Status

- Phaser foundation added.
- Vite and TypeScript are the active browser-first development toolchain.
- Godot runtime retained temporarily as legacy/reference material during migration.
- Existing Godot project files, scenes, scripts, and exports have not been deleted.
- `data/*.json` remains the source of truth for authored locations, NPCs, quests, and lessons.
- `tools/validate_content.py` remains the validation pipeline for authored content references and schemas.

## What is Preserved During Migration

- Authored content in `data/*.json`.
- Content validation through `tools/validate_content.py`.
- Existing documentation under `docs/*.md` for design and content context.
- Existing Godot project files, scenes, scripts, and exports as temporary reference material.

## What is Not Migrated Yet

- Typed content access through `src/game/systems/ContentDatabase.ts` is not implemented yet.
- Lesson flow coordination through `src/game/systems/LessonManager.ts` is not implemented yet.
- Full dialogue UI and lesson prompt interactions are not implemented in Phaser yet.
- Data-driven NPC rendering from `data/npcs.json` is not complete yet.
- Quest progression, passport stamps, and persistent game state are not migrated yet.
- Final art, production maps, deployment configuration, AI APIs, and online services are intentionally out of scope for this foundation step.

## How to Run the Web Prototype Locally

Install dependencies:

```sh
npm install
```

Start the Vite development server:

```sh
npm run dev
```

Run type checks:

```sh
npm run typecheck
```

Build the static web prototype:

```sh
npm run build
```

Validate authored content:

```sh
python tools/validate_content.py
```

## Next Migration Steps

1. Implement `src/game/systems/ContentDatabase.ts`.
2. Implement `src/game/systems/LessonManager.ts`.
3. Render NPCs from `data/npcs.json`.
4. Build `src/game/ui/DialogueBox.ts` in the web UI.
5. Reconnect quest progression.

## Implementation Guidance

- New gameplay systems should be written in TypeScript under `src/`.
- Godot files should remain available as reference material but should not receive new systems unless explicitly requested.
- Keep authored content in `data/*.json`; do not hardcode lesson, NPC, quest, or dialogue content in TypeScript systems.
- Keep PRs small and focused around one migration step at a time.
