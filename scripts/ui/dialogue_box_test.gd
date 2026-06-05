extends Control

@onready var dialogue_box: DialogueBox = %DialogueBox

var _current_lesson: Dictionary = {}

func _ready() -> void:
	var lessons := LessonManager.get_lessons()
	if lessons.is_empty():
		dialogue_box.clear()
		push_warning("No lessons are available for DialogueBox test scene.")
		return

	_current_lesson = (lessons[0] as Dictionary).duplicate(true)
	var npc_name := _get_npc_name(str(_current_lesson.get("npc_id", "")))
	dialogue_box.choice_selected.connect(_on_choice_selected)
	dialogue_box.show_lesson_prompt(npc_name, _current_lesson)

func _on_choice_selected(choice_index: int, _choice_text: String) -> void:
	var lesson_id := str(_current_lesson.get("id", ""))
	var location_id := str(_current_lesson.get("location_id", ""))
	var result := LessonManager.check_answer(lesson_id, choice_index, location_id)
	dialogue_box.show_answer_result(result)

func _get_npc_name(npc_id: String) -> String:
	var npc := ContentDatabase.find_by_id("npcs", npc_id)
	if npc.is_empty():
		return npc_id
	return str(npc.get("name", npc_id))
