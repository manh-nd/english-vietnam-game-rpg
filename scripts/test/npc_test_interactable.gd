extends Interactable

@export var npc_id := ""
@export var location_id := ""
@export var dialogue_box_path: NodePath
@export var interaction_controller_path: NodePath
@export var prompt := "Press E to talk"

var _dialogue_box: DialogueBox = null
var _interaction_controller: NPCInteractionController = null

func _ready() -> void:
	_dialogue_box = get_node_or_null(dialogue_box_path) as DialogueBox
	_interaction_controller = get_node_or_null(interaction_controller_path) as NPCInteractionController

	if _interaction_controller != null:
		var quest_callable := Callable(QuestManager, "handle_lesson_answered")
		if not _interaction_controller.lesson_answered.is_connected(quest_callable):
			_interaction_controller.lesson_answered.connect(quest_callable)

func interact(interactor: Node) -> Dictionary:
	if _interaction_controller == null:
		return _build_result(false, "npc_interaction_controller_missing", interactor)
	if _dialogue_box == null:
		return _build_result(false, "dialogue_box_missing", interactor)

	var result := _interaction_controller.start_npc_interaction(npc_id, _dialogue_box, location_id)
	result["interactor_path"] = interactor.get_path()
	return result

func get_interaction_prompt() -> String:
	return prompt

func _build_result(ok: bool, reason: String, interactor: Node) -> Dictionary:
	return {
		"ok": ok,
		"reason": reason,
		"status": reason,
		"npc_id": npc_id,
		"location_id": location_id,
		"interactor_path": interactor.get_path(),
	}
