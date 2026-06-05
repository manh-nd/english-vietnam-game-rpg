# Content Pipeline

This project keeps authored gameplay and English-learning content in `data/*.json`. The Ha Giang Loop MVP uses these files as the source of truth for locations, NPCs, quests, lessons, passport stamps, and cross-file references.

## Source Files

- `data/locations.json` — location metadata, scene references, recommended lessons, and location passport stamps.
- `data/npcs.json` — NPC metadata and links to locations, intro lessons, and quests.
- `data/quests.json` — quest definitions, giver NPC references, required lessons, and rewards.
- `data/lessons.json` — lesson prompts, dialogue, vocabulary, NPC references, and lesson passport stamps.

Each file must contain a top-level JSON array. Every object in the array must include a stable, non-empty, unique `id` string.

## Reference Rules

Content should connect through explicit IDs instead of hardcoded gameplay branches.

The validator checks that:

- Every NPC `location_id` exists in `data/locations.json`.
- Every NPC `intro_lesson_id` exists in `data/lessons.json`.
- Every NPC `quest_ids` entry exists in `data/quests.json`.
- Every quest `location_id` exists in `data/locations.json`.
- Every quest `giver_npc_id` exists in `data/npcs.json`.
- Every quest `required_lesson_ids` entry exists in `data/lessons.json`.
- Every lesson `location_id` exists in `data/locations.json`.
- Every lesson `npc_id` exists in `data/npcs.json`.
- Every location `recommended_lessons` entry exists in `data/lessons.json`.
- Every passport stamp ID authored in locations, quests, or lessons is a non-empty string.

## Running Validation

Run the content validator from the repository root:

```sh
python tools/validate_content.py
```

On success, the command prints `Content validation passed.` and exits with code `0`.

On failure, the command prints one clear error per invalid content issue and exits with code `1`. Fix the reported JSON content or references, then rerun the validator.

## Recommended Authoring Workflow

1. Edit the relevant JSON file under `data/`.
2. Keep IDs lowercase, stable, and written in `snake_case`.
3. Prefer adding fields to JSON over adding one-off branches in gameplay scripts.
4. Validate edited JSON syntax when making focused content changes, for example:

   ```sh
   python -m json.tool data/lessons.json >/dev/null
   ```

5. Run the full cross-file validator before submitting changes:

   ```sh
   python tools/validate_content.py
   ```

The validator is intentionally small and dependency-free so it can run in local development, CI, and lightweight web-export checks without requiring Godot.
