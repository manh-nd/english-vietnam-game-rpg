# Web Deployment Guide

This project is now a web-first Vite + TypeScript + Phaser app. Godot migration reference files have been removed, and historical Godot implementation details can be found in earlier git history if needed.

## Run the Demo Locally

Install dependencies:

```sh
npm install
```

Start the Vite development server:

```sh
npm run dev
```

Open the local Vite URL shown in the terminal.

## Build a Static Web Bundle

Run:

```sh
npm run build
```

The static build output is written to `dist/`.

Preview the production build locally:

```sh
npm run preview
```

## What to commit

Commit source configuration, authored content, tools, and documentation only:

- `src/`
- `data/`
- `tools/`
- `docs/`
- `public/`, if present
- root web project files such as `package.json`, `vite.config.ts`, `tsconfig.json`, and `index.html`

Do not commit generated web build output. The `dist/`, `build/`, and `node_modules/` directories should remain untracked.

## Current limitations

- There is no deployed Web host yet.
- There is no GitHub Pages setup yet.
- There is no CI deployment build yet.
- Save/load is intentionally not implemented yet.
- Audio is intentionally not included yet.
- No AI API, network calls, native plugins, or external services are required for the MVP demo.
- Manual gameplay verification should use the browser runtime: run the Vite app, walk the player, interact with an NPC, and confirm the dialogue box works.
