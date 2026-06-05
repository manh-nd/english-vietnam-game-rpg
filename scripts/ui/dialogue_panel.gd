extends Control

@onready var title_label: Label = %TitleLabel
@onready var body_label: Label = %BodyLabel

func show_lesson(lesson_id: String) -> void:
	var lesson := ContentDatabase.find_by_id("lessons", lesson_id)
	if lesson.is_empty():
		title_label.text = "Lesson not found"
		body_label.text = lesson_id
		return

	title_label.text = lesson.get("title", "Dialogue Lesson")
	body_label.text = lesson.get("learning_goal", "Practice English dialogue.")
	visible = true

func hide_panel() -> void:
	visible = false
