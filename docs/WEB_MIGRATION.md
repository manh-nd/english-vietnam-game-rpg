# Web Migration Notes

## Why move from Godot to Phaser

The project is moving toward a pure web TypeScript + Phaser architecture so the MVP can be developed, tested, and shipped directly through standard browser tooling. Phaser keeps the runtime lightweight, uses familiar web deployment paths, and makes it easier to iterate on the authored English-learning loop without depending on Godot web export settings during this prototype phase.

## What is preserved

- `data/*.json` remains the source of truth for authored locations, NPCs, quests, and lessons.
- `tools/validate_content.py` remains the validation pipeline for authored content references and schemas.
- Existing Godot project files, scenes, scripts, and exports remain in the repository for now.
- Existing documentation under `docs/*.md` remains available for design and content context.

## What is not migrated yet

- Full dialogue UI and lesson prompt interactions are not implemented in Phaser yet.
- Quest progression, passport stamps, and persistent game state are not migrated yet.
- Godot scenes and GDScript behavior have not been ported or deleted.
- Final art, production maps, deployment configuration, AI APIs, and online services are intentionally out of scope for this foundation step.

## How to run the web prototype locally

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

## Next migration steps

1. Add a small content-loading wrapper that exposes typed access to the JSON already preloaded by Phaser.
2. Recreate the Ha Giang dialogue panel with authored lesson choices from `data/lessons.json`.
3. Connect placeholder NPC interactions to lesson and quest IDs from `data/npcs.json` and `data/quests.json`.
4. Add simple quest completion and passport feedback using existing JSON rewards metadata.
5. Once the Phaser vertical slice is testable end-to-end, decide when to remove or archive the old Godot runtime files.
