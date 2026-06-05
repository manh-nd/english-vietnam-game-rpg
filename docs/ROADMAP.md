# Roadmap

## Current Direction

The project is a **web-first Vite + TypeScript + Phaser** prototype. Existing Godot files remain in the repository temporarily as legacy/reference material during migration, but new feature work should target the web stack under `src/`.

The MVP remains the Ha Giang Loop vertical slice: authored NPC dialogue, lessons, quests, and progression driven by `data/*.json`.

## Current Status

### Done

- Phaser foundation for the browser prototype.
- Typed content systems for authored JSON.
- Data-driven NPC rendering in the Ha Giang scene.
- DialogueBox UI for dialogue, choices, and feedback.
- QuestManager for authored quest state and completion checks.
- Sequential lessons per NPC.
- Reward feedback for vocabulary, XP, and passport stamp placeholders.
- Placeholder Ha Giang map suitable for MVP playtesting.

### Next

- Deploy the MVP to a safe static web host for external playtesting.
- Playtest with 3–5 Vietnamese A1/A2 English learners.
- Fix playtest issues that block clarity, lesson flow, or basic browser usability.
- Polish mobile/browser controls and layout after the first feedback round.
- Add save/load after the session loop is proven useful.
- Prototype the next location only after the Ha Giang Loop is playable, understandable, and fun.

## Deployment and Playtesting Readiness

- Use `npm run build` to create the static `dist/` output.
- Use `npm run preview` to check the production build locally.
- Follow `docs/DEPLOYMENT.md` for Vercel, Netlify, and GitHub Pages notes.
- Follow `docs/PLAYTEST.md` for manual tester instructions, tasks, feedback questions, and bug reports.

## Longer-Term Goals

- Polish UI, animation, audio, accessibility, and placeholder art for the Ha Giang Loop.
- Add durable progress only after manual playtests confirm the authored loop is worth repeating.
- Add spaced review for completed lessons after the authored loop is fun.
- Evaluate content expansion only after the Ha Giang web vertical slice is playable end-to-end.
- Evaluate advanced AI only after authored dialogue and progression are fun and stable.
