extends Node2D

@onready var player: PlayerController = %Player
@onready var prompt_label: Label = %PromptLabel
@onready var result_label: Label = %ResultLabel
@onready var dialogue_box: DialogueBox = %DialogueBox

func _ready() -> void:
	dialogue_box.close()
	prompt_label.visible = false
	player.interaction_prompt_changed.connect(_on_interaction_prompt_changed)
	player.interacted.connect(_on_player_interacted)

func _on_interaction_prompt_changed(prompt: String) -> void:
	prompt_label.text = prompt
	prompt_label.visible = not prompt.is_empty()

func _on_player_interacted(_interactable: Node, result: Dictionary) -> void:
	result_label.text = "Interaction: %s" % str(result.get("reason", "unknown"))
