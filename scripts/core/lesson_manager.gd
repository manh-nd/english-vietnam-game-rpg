extends Node

const LESSONS_PATH := "res://data/lessons.json"
const REQUIRED_FIELDS := [
	"id",
	"title",
	"location_id",
	"npc_id",
	"npc_line",
	"choices",
	"hint",
	"explanation_vi",
	"reward_vocab",
	"skill",
	"passport_stamp_id",
	"correct_choice_index",
]

var _lessons: Array = []
var _lessons_by_id: Dictionary = {}
var _validation_errors: Array[String] = []

func _ready() -> void:
	load_lessons()

func load_lessons(path: String = LESSONS_PATH) -> void:
	_lessons.clear()
	_lessons_by_id.clear()
	_validation_errors.clear()

	var parsed_lessons := _load_json_array(path)
	for lesson in parsed_lessons:
		if typeof(lesson) != TYPE_DICTIONARY:
			_validation_errors.append("Lesson entries must be JSON objects.")
			continue

		var lesson_data: Dictionary = lesson
		var lesson_id := str(lesson_data.get("id", ""))
		var errors := _validate_lesson_schema(lesson_data)
		_validation_errors.append_array(errors)

		if not errors.is_empty():
			continue

		_lessons.append(lesson_data)
		_lessons_by_id[lesson_id] = lesson_data

func has_lesson(lesson_id: String) -> bool:
	return _lessons_by_id.has(lesson_id)

func get_lesson(lesson_id: String) -> Dictionary:
	return _lessons_by_id.get(lesson_id, {}).duplicate(true)

func get_lessons() -> Array:
	return _lessons.duplicate(true)

func get_validation_errors() -> Array[String]:
	return _validation_errors.duplicate()

func validate_lesson_access(lesson_id: String, location_id: String = "") -> Dictionary:
	if lesson_id.is_empty():
		return {
			"can_access": false,
			"lesson_id": lesson_id,
			"reason": "missing_lesson_id",
		}

	if not has_lesson(lesson_id):
		return {
			"can_access": false,
			"lesson_id": lesson_id,
			"reason": "lesson_not_found",
		}

	var lesson := _lessons_by_id[lesson_id] as Dictionary
	if not location_id.is_empty() and str(lesson.get("location_id", "")) != location_id:
		return {
			"can_access": false,
			"lesson_id": lesson_id,
			"reason": "wrong_location",
			"required_location_id": lesson.get("location_id", ""),
			"current_location_id": location_id,
		}

	return {
		"can_access": true,
		"lesson_id": lesson_id,
		"reason": "ok",
		"lesson": lesson.duplicate(true),
	}

func check_answer_text(lesson_id: String, answer_text: String, location_id: String = "") -> Dictionary:
	var access := validate_lesson_access(lesson_id, location_id)
	if not access.get("can_access", false):
		return _build_unavailable_answer_result(lesson_id, -1, access.get("reason", "lesson_unavailable"))

	var lesson := _lessons_by_id[lesson_id] as Dictionary
	var choices := lesson.get("choices", []) as Array
	var choice_index := choices.find(answer_text)
	if choice_index == -1:
		var result := _build_answer_result(lesson_id, -1, true)
		result["answer_text"] = answer_text
		result["reason"] = "answer_not_found"
		return result

	var result := check_answer(lesson_id, choice_index, location_id)
	result["answer_text"] = answer_text
	return result

func check_answer(lesson_id: String, choice_index: int, location_id: String = "") -> Dictionary:
	var access := validate_lesson_access(lesson_id, location_id)
	if not access.get("can_access", false):
		return _build_unavailable_answer_result(lesson_id, choice_index, access.get("reason", "lesson_unavailable"))

	return _build_answer_result(lesson_id, choice_index, true)

func _load_json_array(path: String) -> Array:
	if not FileAccess.file_exists(path):
		_validation_errors.append("Missing lesson content file: %s" % path)
		push_warning("Missing lesson content file: %s" % path)
		return []

	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		_validation_errors.append("Unable to open lesson content file: %s" % path)
		push_error("Unable to open lesson content file: %s" % path)
		return []

	var text := file.get_as_text()
	var parsed = JSON.parse_string(text)
	if parsed == null or typeof(parsed) != TYPE_ARRAY:
		_validation_errors.append("Lesson content must be a JSON array: %s" % path)
		push_error("Lesson content must be a JSON array: %s" % path)
		return []

	return parsed as Array

func _validate_lesson_schema(lesson: Dictionary) -> Array[String]:
	var errors: Array[String] = []
	var lesson_id := str(lesson.get("id", ""))

	for field in REQUIRED_FIELDS:
		if not lesson.has(field):
			errors.append("Lesson %s is missing required field: %s" % [lesson_id, field])

	if lesson_id.is_empty():
		errors.append("Lesson is missing a non-empty id.")
	elif _lessons_by_id.has(lesson_id):
		errors.append("Duplicate lesson id: %s" % lesson_id)

	var choices = lesson.get("choices", [])
	if typeof(choices) != TYPE_ARRAY or choices.is_empty():
		errors.append("Lesson %s must define at least one choice." % lesson_id)
	else:
		var correct_choice_index = lesson.get("correct_choice_index")
		if not _is_integer_value(correct_choice_index):
			errors.append("Lesson %s correct_choice_index must be an integer." % lesson_id)
		elif correct_choice_index < 0 or correct_choice_index >= choices.size():
			errors.append("Lesson %s has an invalid correct_choice_index." % lesson_id)

	if typeof(lesson.get("reward_vocab", [])) != TYPE_ARRAY:
		errors.append("Lesson %s reward_vocab must be an array." % lesson_id)

	return errors

func _is_integer_value(value: Variant) -> bool:
	match typeof(value):
		TYPE_INT:
			return true
		TYPE_FLOAT:
			return is_equal_approx(value, floorf(value))
		_:
			return false

func _build_unavailable_answer_result(lesson_id: String, choice_index: int, reason: String) -> Dictionary:
	return {
		"lesson_id": lesson_id,
		"choice_index": choice_index,
		"can_access": false,
		"choice_exists": false,
		"is_correct": false,
		"reason": reason,
		"hint": "",
		"explanation_vi": "",
		"reward": {},
	}

func _build_answer_result(lesson_id: String, choice_index: int, can_access: bool) -> Dictionary:
	var lesson := _lessons_by_id[lesson_id] as Dictionary
	var choices := lesson.get("choices", []) as Array
	var correct_choice_index := int(lesson.get("correct_choice_index", -1))
	var choice_exists := choice_index >= 0 and choice_index < choices.size()
	var is_correct := can_access and choice_exists and choice_index == correct_choice_index

	return {
		"lesson_id": lesson_id,
		"choice_index": choice_index,
		"can_access": can_access,
		"choice_exists": choice_exists,
		"is_correct": is_correct,
		"reason": "ok" if choice_exists else "choice_not_found",
		"correct_choice_index": correct_choice_index,
		"correct_choice": choices[correct_choice_index] if correct_choice_index >= 0 and correct_choice_index < choices.size() else "",
		"hint": lesson.get("hint", ""),
		"explanation_vi": lesson.get("explanation_vi", ""),
		"reward": _build_reward_data(lesson, is_correct),
	}

func _build_reward_data(lesson: Dictionary, unlocked: bool) -> Dictionary:
	return {
		"unlocked": unlocked,
		"passport_stamp_id": lesson.get("passport_stamp_id", ""),
		"vocabulary": lesson.get("reward_vocab", []).duplicate(true),
		"skill": lesson.get("skill", ""),
	}
