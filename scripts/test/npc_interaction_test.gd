extends Control

@onready var dialogue_box: DialogueBox = %DialogueBox
@onready var interaction_controller: NPCInteractionController = %NPCInteractionController
@onready var status_label: Label = %StatusLabel

func _ready() -> void:
	var npc := _get_test_npc()
	if npc.is_empty():
		status_label.text = "NPC interaction test failed: no NPC data found."
		dialogue_box.clear()
		return

	var npc_id := str(npc.get("id", ""))
	var location_id := str(npc.get("location_id", ""))
	var result := interaction_controller.start_npc_interaction(npc_id, dialogue_box, location_id)
	status_label.text = "NPC interaction test: %s" % str(result.get("reason", "unknown"))

func _get_test_npc() -> Dictionary:
	var npcs := ContentDatabase.get_npcs()
	if npcs.is_empty():
		return {}

	return (npcs[0] as Dictionary).duplicate(true)
