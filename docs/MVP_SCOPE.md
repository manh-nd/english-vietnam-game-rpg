# MVP Scope

## Included

- Web-first Vite + TypeScript + Phaser setup for a 2D top-down RPG.
- First location: **Ha Giang Loop**.
- One playable character: **Linh**.
- Three NPCs.
- Five quests.
- Authored English dialogue lessons for the Ha Giang Loop.
- English Passport progression based on completed lessons and quests.
- JSON-driven content for locations, NPCs, quests, and lessons.
- Lightweight Phaser scene and TypeScript system structure for movement, content loading, location state, dialogue panels, and passport stamps.

## Not Included Yet

- Advanced AI dialogue generation.
- Procedural quest generation.
- Combat systems.
- Inventory depth beyond future quest-item placeholders.
- Save/load persistence.
- Full art, animation, music, or sound effects.
- Multi-location world map traversal beyond the Ha Giang Loop MVP.

## MVP Success Criteria

- The project runs as a browser-first Vite + Phaser app.
- Content can be extended by editing JSON files.
- The Ha Giang Loop content set includes exactly:
  - 1 player character definition in game state.
  - 3 NPCs.
  - 5 quests.
  - Authored Ha Giang lessons with valid quest/NPC references.
- The English Passport concept is represented with stamp-based progression.
- The architecture avoids hard-coding quest and lesson text into scenes.
