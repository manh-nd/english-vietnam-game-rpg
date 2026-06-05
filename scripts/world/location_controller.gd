extends Node2D

@export var location_id := "ha_giang_loop"

func _ready() -> void:
	GameState.set_location(location_id)
	var location := ContentDatabase.find_by_id("locations", location_id)
	if location.is_empty():
		push_warning("No location data found for %s" % location_id)
