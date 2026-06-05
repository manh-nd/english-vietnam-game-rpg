extends CharacterBody2D
class_name PlayerController

signal interaction_prompt_changed(prompt: String)
signal interacted(interactable: Node, result: Dictionary)

@export var movement_speed := 180.0
@export var dialogue_box_path: NodePath

@onready var interaction_detector: Area2D = %InteractionDetector

var _nearby_interactables: Array[Node] = []
var _current_interactable: Node = null
var _dialogue_box: CanvasItem = null

func _ready() -> void:
	if not dialogue_box_path.is_empty():
		_dialogue_box = get_node_or_null(dialogue_box_path) as CanvasItem

	interaction_detector.area_entered.connect(_on_interaction_area_entered)
	interaction_detector.area_exited.connect(_on_interaction_area_exited)
	_update_current_interactable()

func _physics_process(_delta: float) -> void:
	if _is_movement_blocked():
		velocity = Vector2.ZERO
		move_and_slide()
		return

	var direction := Input.get_vector("move_left", "move_right", "move_up", "move_down")
	velocity = direction * movement_speed
	move_and_slide()

func _unhandled_input(event: InputEvent) -> void:
	if _is_movement_blocked():
		return

	if event.is_action_pressed("interact"):
		_interact_with_current()
		get_viewport().set_input_as_handled()

func _interact_with_current() -> void:
	_update_current_interactable()
	if _current_interactable == null or not _current_interactable.has_method("interact"):
		return

	var result = _current_interactable.interact(self)
	if typeof(result) != TYPE_DICTIONARY:
		result = {
			"ok": false,
			"reason": "invalid_interaction_result",
		}
	interacted.emit(_current_interactable, result as Dictionary)

func _on_interaction_area_entered(area: Area2D) -> void:
	if _is_interactable(area) and not _nearby_interactables.has(area):
		_nearby_interactables.append(area)
		_update_current_interactable()

func _on_interaction_area_exited(area: Area2D) -> void:
	if _nearby_interactables.has(area):
		_nearby_interactables.erase(area)
		_update_current_interactable()

func _update_current_interactable() -> void:
	_clear_invalid_interactables()

	var closest: Node = null
	var closest_distance := INF
	for interactable in _nearby_interactables:
		if not _is_interactable(interactable):
			continue

		var node_2d := interactable as Node2D
		var distance := global_position.distance_squared_to(node_2d.global_position)
		if distance < closest_distance:
			closest = interactable
			closest_distance = distance

	if closest == _current_interactable:
		return

	_current_interactable = closest
	interaction_prompt_changed.emit(_get_current_interaction_prompt())

func _get_current_interaction_prompt() -> String:
	if _current_interactable == null or not _current_interactable.has_method("get_interaction_prompt"):
		return ""
	return str(_current_interactable.get_interaction_prompt())

func _clear_invalid_interactables() -> void:
	var valid_interactables: Array[Node] = []
	for interactable in _nearby_interactables:
		if _is_interactable(interactable):
			valid_interactables.append(interactable)
	_nearby_interactables = valid_interactables

func _is_interactable(node: Node) -> bool:
	return is_instance_valid(node) and node is Node2D and node.has_method("interact") and node.has_method("get_interaction_prompt")

func _is_movement_blocked() -> bool:
	return is_instance_valid(_dialogue_box) and _dialogue_box.visible
