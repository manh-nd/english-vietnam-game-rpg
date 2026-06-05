# English Vietnam Game RPG

A web-first TypeScript + Phaser prototype for a top-down English-learning RPG set in Vietnam. The current MVP focuses on the Ha Giang Loop: a small authored slice where Vietnamese learners practice practical English through NPC conversations, lessons, quests, and reward feedback.

## Project Status

- **Active runtime:** Vite + TypeScript + Phaser web prototype.
- **Current vertical slice:** Ha Giang Loop MVP for browser playtesting.
- **Content model:** authored JSON in `data/*.json` drives locations, NPCs, quests, and lessons.
- **Legacy material:** Godot files remain in the repository only as migration/reference material and are not the primary implementation target.

## Quick Start

Install dependencies:

```sh
npm install
```

Start the local development server:

```sh
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173/`.

## Build and Preview

Create a production build:

```sh
npm run build
```

Preview the production build locally:

```sh
npm run preview
```

The static build output is written to `dist/`.

## Content Validation

Validate authored JSON content and cross-file references:

```sh
python tools/validate_content.py
```

Run this after editing files in `data/`.

## Playtest / Deployment

- Production deployment docs: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).
- Playtest guide: [`docs/PLAYTEST.md`](docs/PLAYTEST.md).
- The current MVP is ready for a first external playtest after deployment to Vercel or Netlify.

## Current Gameplay

In the current Ha Giang web prototype, players can:

- Move around a placeholder Ha Giang map.
- Talk to May, Binh, and Lan.
- Answer authored English lessons.
- Progress authored quests.
- Collect placeholder feedback for vocabulary, XP, and passport stamps.

## Current Limitations

- Placeholder art and map visuals are used intentionally.
- No save/load yet; progress is session-only.
- No mobile polish yet.
- No real AI agent or AI API integration yet.
- No analytics yet.

## Useful Commands

```sh
npm run dev
npm run typecheck
npm run build
npm run preview
python tools/validate_content.py
```

## Repository Notes

- New MVP feature work should target `src/` in TypeScript.
- Authored learning/game content belongs in `data/*.json`.
- Godot files should not be modified for web MVP work unless specifically requested.
- Deployment preparation is static-web focused; this repository does not deploy automatically by default.
