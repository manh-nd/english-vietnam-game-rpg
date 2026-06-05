extends Control

@onready var status_label: Label = %StatusLabel

func _ready() -> void:
	var quest := _get_test_quest()
	if quest.is_empty():
		status_label.text = "QuestManager test failed: no quest data found."
		return

	var quest_id := str(quest.get("id", ""))
	var npc_id := str(quest.get("giver_npc_id", ""))
	var required_lesson_ids := quest.get("required_lesson_ids", []) as Array
	var log_lines: Array[String] = []

	var start_result := QuestManager.start_quest(quest_id)
	log_lines.append("Started %s: %s" % [quest_id, str(start_result.get("status", "unknown"))])
	print(start_result)

	for lesson_id in required_lesson_ids:
		var lesson_result := {
			"lesson_id": str(lesson_id),
			"is_correct": true,
		}
		var updates := QuestManager.handle_lesson_answered(npc_id, str(lesson_id), lesson_result)
		log_lines.append("Answered %s -> %s" % [str(lesson_id), str(updates)])
		print(updates)

	var progress := QuestManager.get_quest_progress(quest_id)
	log_lines.append("State: %s" % str(progress.get("state", "unknown")))
	log_lines.append("Completed lessons: %s" % str(progress.get("completed_lesson_ids", [])))
	log_lines.append("Remaining lessons: %s" % str(progress.get("remaining_lesson_ids", [])))
	status_label.text = "\n".join(log_lines)

func _get_test_quest() -> Dictionary:
	var quests := QuestManager.get_quests()
	for quest in quests:
		var quest_data := quest as Dictionary
		var required_lesson_ids := quest_data.get("required_lesson_ids", []) as Array
		if not required_lesson_ids.is_empty():
			return quest_data.duplicate(true)
	return {}
