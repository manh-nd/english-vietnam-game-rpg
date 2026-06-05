# Web Export Guide

This project is prepared for a Godot 4 Web export of the Ha Giang MVP demo.

## Open the demo locally in Godot

1. Open Godot 4.
2. Choose **Import** and select this repository's `project.godot` file.
3. Open `scenes/main/main.tscn` to inspect the demo entry scene.
4. Press **Play** to run the configured main scene.

The configured project main scene is `res://scenes/main/main.tscn`, which instances `res://scenes/locations/ha_giang_mvp.tscn`.

## Export a Web build from the Godot editor

1. Open the project in Godot 4.
2. Go to **Project > Export...**.
3. Select the **Web** preset.
4. If Godot prompts for export templates, install the matching templates for your Godot version.
5. Click **Export Project...**.
6. Keep the export path as `build/web/index.html` unless you intentionally need a local-only alternate output folder.

## Expected output path

The Web preset exports to:

```text
build/web/index.html
```

Godot will also generate supporting files next to `index.html` inside `build/web/`.

## What to commit

Commit source configuration and documentation only:

- `project.godot`
- `export_presets.cfg`
- `scenes/main/main.tscn`
- `docs/WEB_EXPORT.md`
- `.gitignore`

Do not commit generated Web build output. The entire `build/` directory is ignored because it is local export output.

## Current limitations

- There is no deployed Web host yet.
- There is no GitHub Pages setup yet.
- There is no CI export build yet.
- Save/load is intentionally not implemented yet.
- Audio is intentionally not included yet.
- No AI API, network calls, native plugins, or external services are required for the MVP demo.
- Manual gameplay verification still needs Godot available locally: press Play, walk the player, interact with an NPC, and confirm the dialogue box works.
