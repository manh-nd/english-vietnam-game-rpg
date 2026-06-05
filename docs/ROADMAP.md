# Roadmap

## Current Direction

The project is moving to a **web-first Vite + TypeScript + Phaser** architecture. Existing Godot files remain in the repository temporarily as legacy/reference material during migration, but new feature work should target the web stack under `src/`.

The MVP remains the Ha Giang Loop vertical slice: authored NPC dialogue, lessons, quests, and progression driven by `data/*.json`.

## Near-Term Web Migration Roadmap

- **Web PR 1: Phaser foundation — done**
  - Vite, TypeScript, and Phaser foundation is in place.
  - Godot runtime material is retained temporarily for reference.
- **Web PR 2: ContentDatabase + LessonManager**
  - Implement `src/game/systems/ContentDatabase.ts` for typed access to authored JSON content.
  - Implement `src/game/systems/LessonManager.ts` for lesson state and answer feedback.
- **Web PR 3: data-driven NPC rendering**
  - Render NPC placeholders in `src/game/scenes/HaGiangScene.ts` from `data/npcs.json`.
  - Connect NPCs to stable content IDs instead of scene hardcoding.
- **Web PR 4: DialogueBox + lesson choice UI**
  - Add `src/game/ui/DialogueBox.ts` for dialogue text, learner choices, and feedback.
  - Use lesson and dialogue data from `data/lessons.json` and related content references.
- **Web PR 5: QuestManager + progression**
  - Add `src/game/systems/QuestManager.ts` for quest state and completion requirements.
  - Reconnect passport/progression feedback using existing authored quest metadata.
- **Web PR 6: Ha Giang web vertical slice**
  - Bring movement, NPC interaction, lessons, dialogue UI, quests, and progression together in the web scene.
  - Verify the first Ha Giang loop can be tested end-to-end in the browser.
- **Web PR 7: deployment**
  - Add the deployment path for the static web build after the vertical slice is stable.

## Longer-Term Goals

- Polish UI, animation, audio, accessibility, and placeholder art for the Ha Giang Loop.
- Add spaced review for completed lessons after the authored loop is fun.
- Evaluate content expansion only after the Ha Giang web vertical slice is playable end-to-end.
- Evaluate advanced AI only after authored dialogue and progression are fun and stable.
