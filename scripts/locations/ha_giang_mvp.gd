extends Node2D

const LOCATION_ID := "ha_giang_loop"
const STARTING_QUEST_IDS := [
	"quest_find_the_viewpoint",
	"quest_repair_vocabulary",
	"quest_safe_route_plan",
	"quest_homestay_dinner",
	"quest_passport_stamp",
]

@onready var player: PlayerController = %Player
@onready var dialogue_box: DialogueBox = %DialogueBox
@onready var interaction_controller: NPCInteractionController = %NPCInteractionController
@onready var interaction_prompt_label: Label = %InteractionPromptLabel
@onready var quest_status_label: Label = %QuestStatusLabel
@onready var instructions_label: Label = %InstructionsLabel

var _latest_quest_status := "Scene ready. Walk to an NPC and press E."
var _quest_state_snapshot: Dictionary = {}

func _ready() -> void:
	player.interaction_prompt_changed.connect(_on_interaction_prompt_changed)
	player.interacted.connect(_on_player_interacted)

	var quest_callable := Callable(QuestManager, "handle_lesson_answered")
	if not interaction_controller.lesson_answered.is_connected(quest_callable):
		interaction_controller.lesson_answered.connect(quest_callable)
	interaction_controller.lesson_answered.connect(_on_lesson_answered)

	instructions_label.text = "WASD/Arrow keys: move\nE: talk to nearby NPC\nUp/Down + Enter/Space or mouse: answer\nEscape: close DialogueBox"
	_start_mvp_quests()
	_update_interaction_prompt("")
	_refresh_quest_state_snapshot()
	_update_quest_status_label()

func _start_mvp_quests() -> void:
	var started_count := 0
	for quest_id in STARTING_QUEST_IDS:
		var update := QuestManager.start_quest(quest_id)
		if bool(update.get("ok", false)):
			started_count += 1
		_latest_quest_status = "%s: %s" % [quest_id, str(update.get("status", "unknown"))]
	_latest_quest_status = "Started %d/%d Ha Giang MVP quests." % [started_count, STARTING_QUEST_IDS.size()]

func _on_interaction_prompt_changed(prompt: String) -> void:
	_update_interaction_prompt(prompt)

func _on_player_interacted(_interactable: Node, result: Dictionary) -> void:
	var status := str(result.get("status", result.get("reason", "unknown")))
	if not bool(result.get("ok", false)):
		_latest_quest_status = "Interaction failed: %s" % status
		_update_quest_status_label()

func _on_lesson_answered(npc_id: String, lesson_id: String, result: Dictionary) -> void:
	_latest_quest_status = _build_latest_quest_update_text(npc_id, lesson_id, result)
	_refresh_quest_state_snapshot()
	_update_quest_status_label()

func _update_interaction_prompt(prompt: String) -> void:
	if prompt.is_empty():
		interaction_prompt_label.text = "Walk near an NPC to talk."
	else:
		interaction_prompt_label.text = prompt

func _build_latest_quest_update_text(npc_id: String, lesson_id: String, result: Dictionary) -> String:
	if not bool(result.get("is_correct", false)):
		return "%s answered try_again for %s; quest status unchanged." % [npc_id, lesson_id]

	var updated_quest_lines := PackedStringArray()
	for quest_id in STARTING_QUEST_IDS:
		var progress := QuestManager.get_quest_progress(quest_id)
		var completed_lesson_ids := progress.get("completed_lesson_ids", []) as Array
		if not completed_lesson_ids.has(lesson_id):
			continue

		var state := str(progress.get("state", "unknown"))
		var remaining_count := (progress.get("remaining_lesson_ids", []) as Array).size()
		var previous_state := str(_quest_state_snapshot.get(quest_id, ""))
		var status := QuestManager.STATUS_QUEST_COMPLETED if state == QuestManager.STATE_COMPLETED and previous_state != QuestManager.STATE_COMPLETED else QuestManager.STATUS_OK
		updated_quest_lines.append("%s: %s (%s, %d remaining)" % [quest_id, status, state, remaining_count])

	if updated_quest_lines.is_empty():
		return "%s answered correct for %s; no active quest required it." % [npc_id, lesson_id]

	return "; ".join(updated_quest_lines)

func _refresh_quest_state_snapshot() -> void:
	_quest_state_snapshot.clear()
	for quest_id in STARTING_QUEST_IDS:
		_quest_state_snapshot[quest_id] = QuestManager.get_quest_state(quest_id)

func _update_quest_status_label() -> void:
	var active_count := 0
	var completed_count := 0
	for quest_id in STARTING_QUEST_IDS:
		match QuestManager.get_quest_state(quest_id):
			QuestManager.STATE_ACTIVE:
				active_count += 1
			QuestManager.STATE_COMPLETED:
				completed_count += 1

	quest_status_label.text = "Active quests: %d\nCompleted quests: %d\nLatest update: %s" % [
		active_count,
		completed_count,
		_latest_quest_status,
	]
