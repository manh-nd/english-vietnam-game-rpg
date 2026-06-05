extends Area2D
class_name Interactable

func interact(_interactor: Node) -> Dictionary:
	return {
		"ok": false,
		"reason": "not_implemented",
	}

func get_interaction_prompt() -> String:
	return "Interact"
