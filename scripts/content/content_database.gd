extends Node

const DATA_PATHS := {
	"locations": "res://data/locations.json",
	"npcs": "res://data/npcs.json",
	"quests": "res://data/quests.json",
	"lessons": "res://data/lessons.json",
}

var _content: Dictionary = {}

func _ready() -> void:
	load_all()

func load_all() -> void:
	_content.clear()
	for key in DATA_PATHS:
		_content[key] = _load_json(DATA_PATHS[key])

func get_locations() -> Array:
	return _content.get("locations", [])

func get_npcs() -> Array:
	return _content.get("npcs", [])

func get_quests() -> Array:
	return _content.get("quests", [])

func get_lessons() -> Array:
	return _content.get("lessons", [])

func find_by_id(collection: String, id: String) -> Dictionary:
	for item in _content.get(collection, []):
		if item.get("id", "") == id:
			return item
	return {}

func _load_json(path: String) -> Array:
	if not FileAccess.file_exists(path):
		push_warning("Missing content file: %s" % path)
		return []

	var file := FileAccess.open(path, FileAccess.READ)
	var text := file.get_as_text()
	var parsed = JSON.parse_string(text)
	if parsed == null or typeof(parsed) != TYPE_ARRAY:
		push_error("Content file must contain a JSON array: %s" % path)
		return []

	return parsed
