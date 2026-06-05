# Roadmap

## Current Direction

The project is a **web-first Vite + TypeScript + Phaser** prototype. Godot migration reference files have been removed, and new feature work should target the web stack under `src/`. Historical Godot implementation details can be found in earlier git history if needed.

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
- Deployment preparation documentation for a static Vite build on Vercel or Netlify.
- Godot runtime/editor files removed after migration to the web-first Phaser runtime.

### Next

1. Deploy the MVP to Vercel or Netlify.
2. Run 3–5 external playtests with Vietnamese A1/A2 English learners.
3. Prioritize fixes from playtest notes, especially clarity, lesson flow, and browser usability issues.
4. Then consider mobile polish, save/load, and the next location only after the Ha Giang Loop is playable, understandable, and fun.

## Deployment and Playtesting Readiness

- Use `npm run build` to create the static `dist/` output.
- Use `npm run preview` to check the production build locally.
- Follow `docs/DEPLOYMENT.md` for the recommended Vercel/Netlify static deployment path.
- Follow `docs/PLAYTEST.md` for manual tester instructions, tasks, feedback questions, and bug reports.

## Longer-Term Goals

- Polish UI, animation, audio, accessibility, and placeholder art for the Ha Giang Loop.
- Add durable progress only after manual playtests confirm the authored loop is worth repeating.
- Add spaced review for completed lessons after the authored loop is fun.
- Evaluate content expansion only after the Ha Giang web vertical slice is playable end-to-end.
- Evaluate advanced AI only after authored dialogue and progression are fun and stable.
