extends Node

signal location_changed(location_id: String)
signal quest_started(quest_id: String)
signal quest_completed(quest_id: String)
signal lesson_completed(lesson_id: String)

var current_location_id := "ha_giang_loop"
var playable_character := {
	"id": "player_01",
	"display_name": "Linh",
	"role": "English learner and traveler",
}
var started_quests: Array[String] = []
var completed_quests: Array[String] = []
var completed_lessons: Array[String] = []

func set_location(location_id: String) -> void:
	current_location_id = location_id
	location_changed.emit(location_id)

func start_quest(quest_id: String) -> void:
	if not started_quests.has(quest_id):
		started_quests.append(quest_id)
		quest_started.emit(quest_id)

func complete_quest(quest_id: String) -> void:
	if not completed_quests.has(quest_id):
		completed_quests.append(quest_id)
		quest_completed.emit(quest_id)

func complete_lesson(lesson_id: String) -> void:
	if not completed_lessons.has(lesson_id):
		completed_lessons.append(lesson_id)
		lesson_completed.emit(lesson_id)
