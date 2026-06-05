extends PanelContainer
class_name DialogueBox

signal choice_selected(choice_index: int, choice_text: String)

const SELECTED_CHOICE_PREFIX := "▶ "
const UNSELECTED_CHOICE_PREFIX := "  "

@onready var npc_name_label: Label = %NpcNameLabel
@onready var dialogue_line_label: Label = %DialogueLineLabel
@onready var choices_container: VBoxContainer = %ChoicesContainer
@onready var hint_label: Label = %HintLabel

var _choice_buttons: Array[Button] = []
var _choice_texts: Array[String] = []
var _selected_choice_index := -1

func _ready() -> void:
	focus_mode = Control.FOCUS_ALL
	clear()

func _input(event: InputEvent) -> void:
	if not visible or _choice_buttons.is_empty():
		return

	if event is InputEventKey:
		var key_event := event as InputEventKey
		if not key_event.pressed or key_event.echo:
			return

		match key_event.keycode:
			KEY_UP:
				_move_selection(-1)
				get_viewport().set_input_as_handled()
			KEY_DOWN:
				_move_selection(1)
				get_viewport().set_input_as_handled()
			KEY_ENTER, KEY_KP_ENTER, KEY_SPACE:
				_confirm_selected_choice()
				get_viewport().set_input_as_handled()

func show_lesson_prompt(npc_name: String, lesson: Dictionary) -> void:
	clear()
	visible = true
	npc_name_label.text = npc_name
	dialogue_line_label.text = str(lesson.get("npc_line", ""))
	hint_label.text = str(lesson.get("hint", ""))

	var choices = lesson.get("choices", [])
	if typeof(choices) != TYPE_ARRAY:
		return

	for choice in choices:
		_add_choice_button(str(choice))

	if not _choice_buttons.is_empty():
		_set_selected_choice(0)

func show_answer_result(result: Dictionary) -> void:
	var is_correct := bool(result.get("is_correct", false))
	var feedback := "Correct!" if is_correct else "Try again."
	var hint := str(result.get("hint", ""))
	var explanation := str(result.get("explanation_vi", ""))
	var correct_choice := str(result.get("correct_choice", ""))
	var feedback_lines := PackedStringArray([feedback])

	if not is_correct and not correct_choice.is_empty():
		feedback_lines.append("Correct answer: %s" % correct_choice)
	if not hint.is_empty():
		feedback_lines.append("Hint: %s" % hint)
	if not explanation.is_empty():
		feedback_lines.append("Explanation: %s" % explanation)

	hint_label.text = "\n".join(feedback_lines)

func clear() -> void:
	npc_name_label.text = ""
	dialogue_line_label.text = ""
	hint_label.text = ""
	_choice_texts.clear()
	_selected_choice_index = -1

	for child in choices_container.get_children():
		child.free()
	_choice_buttons.clear()

func _add_choice_button(choice_text: String) -> void:
	var choice_index := _choice_buttons.size()
	var button := Button.new()
	button.text = choice_text
	button.alignment = HORIZONTAL_ALIGNMENT_LEFT
	button.focus_mode = Control.FOCUS_ALL
	button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	button.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	button.pressed.connect(_on_choice_pressed.bind(choice_index))
	button.mouse_entered.connect(_set_selected_choice.bind(choice_index))

	choices_container.add_child(button)
	_choice_buttons.append(button)
	_choice_texts.append(choice_text)

func _move_selection(direction: int) -> void:
	if _choice_buttons.is_empty():
		return

	var next_index := _selected_choice_index + direction
	if next_index < 0:
		next_index = _choice_buttons.size() - 1
	elif next_index >= _choice_buttons.size():
		next_index = 0

	_set_selected_choice(next_index)

func _set_selected_choice(choice_index: int) -> void:
	if choice_index < 0 or choice_index >= _choice_buttons.size():
		return

	_selected_choice_index = choice_index
	for index in range(_choice_buttons.size()):
		var prefix := SELECTED_CHOICE_PREFIX if index == _selected_choice_index else UNSELECTED_CHOICE_PREFIX
		_choice_buttons[index].text = "%s%s" % [prefix, _choice_texts[index]]

	_choice_buttons[_selected_choice_index].grab_focus()

func _confirm_selected_choice() -> void:
	if _selected_choice_index < 0 or _selected_choice_index >= _choice_texts.size():
		return

	choice_selected.emit(_selected_choice_index, _choice_texts[_selected_choice_index])

func _on_choice_pressed(choice_index: int) -> void:
	_set_selected_choice(choice_index)
	_confirm_selected_choice()
