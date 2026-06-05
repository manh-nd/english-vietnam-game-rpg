extends Node
class_name NPCInteractionController

const RESULT_DIALOGUE_BOX_MISSING := "dialogue_box_missing"
const RESULT_LESSON_NOT_FOUND := "lesson_not_found"
const RESULT_NPC_MISSING_INTRO_LESSON := "npc_missing_intro_lesson"
const RESULT_NPC_NOT_FOUND := "npc_not_found"
const RESULT_OK := "ok"
const RESULT_WRONG_LOCATION := "wrong_location"

var _current_dialogue_box: DialogueBox = null
var _current_lesson_id := ""
var _current_location_id := ""
var _current_npc_id := ""

func start_npc_interaction(npc_id: String, dialogue_box: DialogueBox, location_id: String = "") -> Dictionary:
	_clear_current_interaction()

	if dialogue_box == null:
		return _build_result(RESULT_DIALOGUE_BOX_MISSING, npc_id, "", location_id)

	var npc := ContentDatabase.find_by_id("npcs", npc_id)
	if npc.is_empty():
		return _build_result(RESULT_NPC_NOT_FOUND, npc_id, "", location_id)

	var intro_lesson_id := str(npc.get("intro_lesson_id", ""))
	if intro_lesson_id.is_empty():
		return _build_result(RESULT_NPC_MISSING_INTRO_LESSON, npc_id, "", location_id, {
			"npc": npc.duplicate(true),
		})

	var npc_location_id := str(npc.get("location_id", ""))
	if not location_id.is_empty() and npc_location_id != location_id:
		return _build_result(RESULT_WRONG_LOCATION, npc_id, intro_lesson_id, location_id, {
			"required_location_id": npc_location_id,
			"current_location_id": location_id,
			"npc": npc.duplicate(true),
		})

	var access := LessonManager.validate_lesson_access(intro_lesson_id, location_id)
	if not bool(access.get("can_access", false)):
		var reason := str(access.get("reason", RESULT_LESSON_NOT_FOUND))
		var mapped_reason := RESULT_WRONG_LOCATION if reason == RESULT_WRONG_LOCATION else RESULT_LESSON_NOT_FOUND
		return _build_result(mapped_reason, npc_id, intro_lesson_id, location_id, access)

	var lesson := access.get("lesson", {}) as Dictionary
	_current_dialogue_box = dialogue_box
	_current_lesson_id = intro_lesson_id
	_current_location_id = location_id
	_current_npc_id = npc_id

	var choice_callable := Callable(self, "_on_choice_selected")
	if not _current_dialogue_box.choice_selected.is_connected(choice_callable):
		_current_dialogue_box.choice_selected.connect(choice_callable)

	_current_dialogue_box.show_lesson_prompt(str(npc.get("name", npc_id)), lesson)

	return _build_result(RESULT_OK, npc_id, intro_lesson_id, location_id, {
		"npc": npc.duplicate(true),
		"lesson": lesson.duplicate(true),
	})

func _on_choice_selected(choice_index: int, _choice_text: String) -> void:
	if _current_dialogue_box == null or _current_lesson_id.is_empty():
		return

	var result := LessonManager.check_answer(_current_lesson_id, choice_index, _current_location_id)
	_current_dialogue_box.show_answer_result(result)

func _clear_current_interaction() -> void:
	if is_instance_valid(_current_dialogue_box):
		var choice_callable := Callable(self, "_on_choice_selected")
		if _current_dialogue_box.choice_selected.is_connected(choice_callable):
			_current_dialogue_box.choice_selected.disconnect(choice_callable)

	_current_dialogue_box = null
	_current_lesson_id = ""
	_current_location_id = ""
	_current_npc_id = ""

func _build_result(reason: String, npc_id: String, lesson_id: String, location_id: String, extra: Dictionary = {}) -> Dictionary:
	var result := {
		"reason": reason,
		"status": reason,
		"ok": reason == RESULT_OK,
		"npc_id": npc_id,
		"lesson_id": lesson_id,
		"location_id": location_id,
	}
	result.merge(extra, true)
	return result
