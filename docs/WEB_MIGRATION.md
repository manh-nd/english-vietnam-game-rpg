# Web Migration Notes

## Current Direction

The project now uses a pure web TypeScript + Phaser architecture so the MVP can be developed, tested, and shipped directly through standard browser tooling. Phaser keeps the runtime lightweight, uses familiar web deployment paths, and makes it easier to iterate on the authored English-learning loop.

New feature work should target the **web stack under `src/`**.

## Current Status

- Phaser foundation is in place.
- Vite and TypeScript are the active browser-first development toolchain.
- Godot migration reference files have been removed.
- The active runtime is fully web-first TypeScript + Phaser.
- Historical Godot implementation details can be found in earlier git history if needed.
- `data/*.json` remains the source of truth for authored locations, NPCs, quests, and lessons.
- `tools/validate_content.py` remains the validation pipeline for authored content references and schemas.
- `ContentDatabase` and `LessonManager` provide typed web access to loaded authored content and lesson answer checking.
- NPC placeholders render from authored content in the Ha Giang scene.
- DialogueBox, QuestManager, sequential NPC lessons, quest HUD feedback, reward toasts, and passport stamp placeholders are available for the Ha Giang MVP loop.

## What is Preserved During Migration

- Authored content in `data/*.json`.
- Content validation through `tools/validate_content.py`.
- Existing documentation under `docs/*.md` for design and content context.
- Web-first Phaser implementation under `src/`.

## What Is Still Out of Scope

- Final art and production maps.
- Save/load and persistent game state.
- Mobile polish and accessibility polish.
- Analytics.
- AI APIs or online services.
- New locations beyond the Ha Giang Loop until the first loop is playtested and fun.

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

Preview the production build locally:

```sh
npm run preview
```

Validate authored content:

```sh
python tools/validate_content.py
```

## Deployment and Playtest Preparation

- Deployment notes live in `docs/DEPLOYMENT.md`.
- Manual playtest instructions live in `docs/PLAYTEST.md`.
- The generated static build output is `dist/` and should not be committed.
- Vite should keep the default base path unless a deployment target, such as GitHub Pages repository hosting, serves the app from a subpath.

## Implementation Guidance

- New gameplay systems should be written in TypeScript under `src/`.
- Do not restore Godot runtime/editor files for normal MVP work.
- Keep authored content in `data/*.json`; do not hardcode lesson, NPC, quest, or dialogue content in TypeScript systems.
- Keep PRs small and focused around one migration step at a time.
