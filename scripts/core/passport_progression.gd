extends Node

const STAMPS_PER_LEVEL := 5

var earned_stamps: Array[String] = []

func award_stamp(stamp_id: String) -> void:
	if not earned_stamps.has(stamp_id):
		earned_stamps.append(stamp_id)

func get_level() -> int:
	return int(floor(float(earned_stamps.size()) / float(STAMPS_PER_LEVEL))) + 1

func get_progress_to_next_level() -> float:
	return float(earned_stamps.size() % STAMPS_PER_LEVEL) / float(STAMPS_PER_LEVEL)

func has_stamp(stamp_id: String) -> bool:
	return earned_stamps.has(stamp_id)
