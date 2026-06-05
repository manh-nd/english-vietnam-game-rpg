extends Node

const QUESTS_PATH := "res://data/quests.json"
const STATE_NOT_STARTED := "not_started"
const STATE_ACTIVE := "active"
const STATE_COMPLETED := "completed"
const STATUS_OK := "ok"
const STATUS_ALREADY_COMPLETED := "already_completed"
const STATUS_INCORRECT_ANSWER := "incorrect_answer"
const STATUS_LESSON_NOT_REQUIRED := "lesson_not_required"
const STATUS_QUEST_COMPLETED := "quest_completed"
const STATUS_QUEST_NOT_ACTIVE := "quest_not_active"
const STATUS_QUEST_NOT_FOUND := "quest_not_found"

var _quests: Array = []
var _quests_by_id: Dictionary = {}
var _quest_states: Dictionary = {}
var _completed_lessons_by_quest: Dictionary = {}
var _validation_errors: Array[String] = []

func _ready() -> void:
	load_quests()

func load_quests(path: String = QUESTS_PATH) -> void:
	_quests.clear()
	_quests_by_id.clear()
	_quest_states.clear()
	_completed_lessons_by_quest.clear()
	_validation_errors.clear()

	var parsed_quests := _load_json_array(path)
	for quest in parsed_quests:
		if typeof(quest) != TYPE_DICTIONARY:
			_validation_errors.append("Quest entries must be JSON objects.")
			continue

		var quest_data: Dictionary = quest
		var quest_id := str(quest_data.get("id", ""))
		if quest_id.is_empty():
			_validation_errors.append("Quest is missing a non-empty id.")
			continue
		if _quests_by_id.has(quest_id):
			_validation_errors.append("Duplicate quest id: %s" % quest_id)
			continue

		_quests.append(quest_data)
		_quests_by_id[quest_id] = quest_data
		_quest_states[quest_id] = _get_default_state(quest_data)
		_completed_lessons_by_quest[quest_id] = []

func get_quest(quest_id: String) -> Dictionary:
	return _quests_by_id.get(quest_id, {}).duplicate(true)

func get_quests() -> Array:
	return _quests.duplicate(true)

func get_quests_for_npc(npc_id: String) -> Array:
	var quests: Array = []
	for quest in _quests:
		var quest_data := quest as Dictionary
		if str(quest_data.get("giver_npc_id", "")) == npc_id:
			quests.append(quest_data.duplicate(true))
	return quests

func get_active_quests() -> Array:
	var quests: Array = []
	for quest in _quests:
		var quest_data := quest as Dictionary
		var quest_id := str(quest_data.get("id", ""))
		if get_quest_state(quest_id) == STATE_ACTIVE:
			quests.append(quest_data.duplicate(true))
	return quests

func start_quest(quest_id: String) -> Dictionary:
	if not _quests_by_id.has(quest_id):
		return _build_quest_update(false, STATUS_QUEST_NOT_FOUND, quest_id)

	_quest_states[quest_id] = STATE_ACTIVE
	return _build_quest_update(true, STATUS_OK, quest_id)

func complete_quest(quest_id: String) -> Dictionary:
	if not _quests_by_id.has(quest_id):
		return _build_quest_update(false, STATUS_QUEST_NOT_FOUND, quest_id)

	_quest_states[quest_id] = STATE_COMPLETED
	var update := _build_quest_update(true, STATUS_QUEST_COMPLETED, quest_id)
	update["reward"] = _get_quest_rewards(quest_id)
	return update

func get_quest_state(quest_id: String) -> String:
	if not _quests_by_id.has(quest_id):
		return ""
	return str(_quest_states.get(quest_id, STATE_NOT_STARTED))

func get_quest_progress(quest_id: String) -> Dictionary:
	if not _quests_by_id.has(quest_id):
		return _build_quest_update(false, STATUS_QUEST_NOT_FOUND, quest_id)
	return _build_quest_update(true, STATUS_OK, quest_id)

func handle_lesson_answered(npc_id: String, lesson_id: String, result: Dictionary) -> Array:
	var updates: Array = []
	if not bool(result.get("is_correct", false)):
		return updates

	for quest in _quests:
		var quest_data := quest as Dictionary
		var quest_id := str(quest_data.get("id", ""))
		if get_quest_state(quest_id) != STATE_ACTIVE:
			continue

		var required_lesson_ids := quest_data.get("required_lesson_ids", []) as Array
		if not required_lesson_ids.has(lesson_id):
			continue

		var completed_lesson_ids := _get_completed_lesson_ids(quest_id)
		if not completed_lesson_ids.has(lesson_id):
			completed_lesson_ids.append(lesson_id)
			_completed_lessons_by_quest[quest_id] = completed_lesson_ids

		var update := _build_quest_update(true, STATUS_OK, quest_id)
		update["npc_id"] = npc_id
		update["lesson_id"] = lesson_id
		if _get_remaining_lesson_ids(quest_id).is_empty():
			update = complete_quest(quest_id)
			update["npc_id"] = npc_id
			update["lesson_id"] = lesson_id
		updates.append(update)

	return updates

func get_validation_errors() -> Array[String]:
	return _validation_errors.duplicate()

func _load_json_array(path: String) -> Array:
	if not FileAccess.file_exists(path):
		_validation_errors.append("Missing quest content file: %s" % path)
		push_warning("Missing quest content file: %s" % path)
		return []

	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		_validation_errors.append("Unable to open quest content file: %s" % path)
		push_error("Unable to open quest content file: %s" % path)
		return []

	var text := file.get_as_text()
	var parsed = JSON.parse_string(text)
	if parsed == null or typeof(parsed) != TYPE_ARRAY:
		_validation_errors.append("Quest content must be a JSON array: %s" % path)
		push_error("Quest content must be a JSON array: %s" % path)
		return []

	return parsed as Array

func _get_default_state(quest: Dictionary) -> String:
	var default_state := str(quest.get("default_state", quest.get("state", STATE_NOT_STARTED)))
	if default_state in [STATE_NOT_STARTED, STATE_ACTIVE, STATE_COMPLETED]:
		return default_state
	return STATE_NOT_STARTED

func _get_quest_rewards(quest_id: String) -> Dictionary:
	var quest := _quests_by_id.get(quest_id, {}) as Dictionary
	return (quest.get("rewards", {}) as Dictionary).duplicate(true)

func _get_required_lesson_ids(quest_id: String) -> Array:
	var quest := _quests_by_id.get(quest_id, {}) as Dictionary
	return (quest.get("required_lesson_ids", []) as Array).duplicate(true)

func _get_completed_lesson_ids(quest_id: String) -> Array:
	return (_completed_lessons_by_quest.get(quest_id, []) as Array).duplicate(true)

func _get_remaining_lesson_ids(quest_id: String) -> Array:
	var remaining_lesson_ids := _get_required_lesson_ids(quest_id)
	for lesson_id in _get_completed_lesson_ids(quest_id):
		remaining_lesson_ids.erase(lesson_id)
	return remaining_lesson_ids

func _build_quest_update(ok: bool, status: String, quest_id: String) -> Dictionary:
	var state := get_quest_state(quest_id)
	return {
		"ok": ok,
		"reason": status,
		"status": status,
		"quest_id": quest_id,
		"state": state,
		"completed_lesson_ids": _get_completed_lesson_ids(quest_id),
		"remaining_lesson_ids": _get_remaining_lesson_ids(quest_id),
	}
