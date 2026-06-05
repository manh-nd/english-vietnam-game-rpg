#!/usr/bin/env python3
"""Validate authored JSON content references for the Ha Giang Loop MVP."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any


REQUIRED_FILES = {
    "locations": Path("data/locations.json"),
    "npcs": Path("data/npcs.json"),
    "quests": Path("data/quests.json"),
    "lessons": Path("data/lessons.json"),
}


class ContentValidator:
    def __init__(self, project_root: Path) -> None:
        self.project_root = project_root
        self.errors: list[str] = []
        self.content: dict[str, list[dict[str, Any]]] = {}
        self.ids: dict[str, set[str]] = {}

    def validate(self) -> bool:
        self._load_required_files()
        if self.errors:
            return False

        self._validate_unique_ids()
        self._validate_references()
        self._validate_gameplay_schema()
        self._validate_passport_stamp_ids()
        return not self.errors

    def _load_required_files(self) -> None:
        for content_type, relative_path in REQUIRED_FILES.items():
            path = self.project_root / relative_path
            if not path.exists():
                self._error(f"Missing required file: {relative_path}")
                continue

            try:
                with path.open("r", encoding="utf-8") as file:
                    parsed = json.load(file)
            except json.JSONDecodeError as exc:
                self._error(
                    f"Invalid JSON in {relative_path}: line {exc.lineno}, column {exc.colno}: {exc.msg}"
                )
                continue
            except OSError as exc:
                self._error(f"Could not read {relative_path}: {exc}")
                continue

            if not isinstance(parsed, list):
                self._error(f"{relative_path} must contain a top-level JSON array.")
                continue

            objects: list[dict[str, Any]] = []
            for index, item in enumerate(parsed):
                if not isinstance(item, dict):
                    self._error(
                        f"{relative_path}[{index}] must be a JSON object with an id field."
                    )
                    continue
                objects.append(item)
            self.content[content_type] = objects

    def _validate_unique_ids(self) -> None:
        for content_type, items in self.content.items():
            relative_path = REQUIRED_FILES[content_type]
            seen: set[str] = set()
            ids: set[str] = set()

            for index, item in enumerate(items):
                item_id = item.get("id")
                if not self._is_non_empty_string(item_id):
                    self._error(
                        f"{relative_path}[{index}] must have a non-empty string id."
                    )
                    continue

                if item_id in seen:
                    self._error(f"Duplicate id '{item_id}' in {relative_path}.")
                    continue

                seen.add(item_id)
                ids.add(item_id)

            self.ids[content_type] = ids

    def _validate_references(self) -> None:
        location_ids = self.ids.get("locations", set())
        npc_ids = self.ids.get("npcs", set())
        quest_ids = self.ids.get("quests", set())
        lesson_ids = self.ids.get("lessons", set())

        for npc in self.content.get("npcs", []):
            npc_label = self._item_label(npc)
            self._require_reference(
                npc.get("location_id"), location_ids, f"NPC {npc_label} location_id"
            )
            self._require_reference(
                npc.get("intro_lesson_id"),
                lesson_ids,
                f"NPC {npc_label} intro_lesson_id",
            )
            self._require_reference_list(
                npc.get("quest_ids"), quest_ids, f"NPC {npc_label} quest_ids"
            )

        for quest in self.content.get("quests", []):
            quest_label = self._item_label(quest)
            self._require_reference(
                quest.get("location_id"), location_ids, f"Quest {quest_label} location_id"
            )
            self._require_reference(
                quest.get("giver_npc_id"), npc_ids, f"Quest {quest_label} giver_npc_id"
            )
            self._require_reference_list(
                quest.get("required_lesson_ids"),
                lesson_ids,
                f"Quest {quest_label} required_lesson_ids",
            )

        for lesson in self.content.get("lessons", []):
            lesson_label = self._item_label(lesson)
            self._require_reference(
                lesson.get("location_id"),
                location_ids,
                f"Lesson {lesson_label} location_id",
            )
            self._require_reference(
                lesson.get("npc_id"), npc_ids, f"Lesson {lesson_label} npc_id"
            )

        for location in self.content.get("locations", []):
            location_label = self._item_label(location)
            self._require_reference_list(
                location.get("recommended_lessons"),
                lesson_ids,
                f"Location {location_label} recommended_lessons",
            )

    def _validate_gameplay_schema(self) -> None:
        valid_quest_states = {"not_started", "active", "completed"}
        valid_english_levels = {"A1", "A2", "B1", "B2", "C1", "C2"}

        for lesson in self.content.get("lessons", []):
            lesson_label = self._item_label(lesson)
            if not self._is_non_empty_string(lesson.get("id")):
                self._error(f"Lesson {lesson_label} id must be a non-empty string.")
            self._require_non_empty_string(
                lesson.get("skill"), f"Lesson {lesson_label} skill"
            )
            self._require_non_empty_string(
                lesson.get("npc_line"), f"Lesson {lesson_label} npc_line"
            )
            self._require_non_empty_string_list(
                lesson.get("choices"),
                f"Lesson {lesson_label} choices",
                require_non_empty=True,
            )
            choices = lesson.get("choices")
            correct_choice_index = lesson.get("correct_choice_index")
            if not self._is_integer(correct_choice_index):
                self._error(
                    f"Lesson {lesson_label} correct_choice_index must be an integer."
                )
            elif (
                not isinstance(choices, list)
                or not 0 <= correct_choice_index < len(choices)
            ):
                self._error(
                    f"Lesson {lesson_label} correct_choice_index must be within choices range."
                )
            self._require_non_empty_string(
                lesson.get("hint"), f"Lesson {lesson_label} hint"
            )
            self._require_non_empty_string(
                lesson.get("explanation_vi"),
                f"Lesson {lesson_label} explanation_vi",
            )
            self._require_non_empty_string_list(
                lesson.get("reward_vocab"),
                f"Lesson {lesson_label} reward_vocab",
                require_non_empty=False,
            )

        for quest in self.content.get("quests", []):
            quest_label = self._item_label(quest)
            self._require_non_empty_string(
                quest.get("title"), f"Quest {quest_label} title"
            )
            self._require_non_empty_string(
                quest.get("description"), f"Quest {quest_label} description"
            )
            state = quest.get("state")
            if state not in valid_quest_states:
                self._error(
                    f"Quest {quest_label} state must be one of: not_started, active, completed."
                )
            rewards = quest.get("rewards")
            if not isinstance(rewards, dict):
                self._error(f"Quest {quest_label} rewards must be an object.")
                continue
            xp = rewards.get("xp")
            if xp is not None and (not self._is_integer(xp) or xp < 0):
                self._error(
                    f"Quest {quest_label} rewards.xp must be a non-negative integer."
                )
            if "vocab" in rewards:
                self._require_non_empty_string_list(
                    rewards.get("vocab"),
                    f"Quest {quest_label} rewards.vocab",
                    require_non_empty=False,
                )
            if "passport_stamps" in rewards:
                self._require_non_empty_string_list(
                    rewards.get("passport_stamps"),
                    f"Quest {quest_label} rewards.passport_stamps",
                    require_non_empty=False,
                )

        for npc in self.content.get("npcs", []):
            npc_label = self._item_label(npc)
            self._require_non_empty_string(npc.get("name"), f"NPC {npc_label} name")
            self._require_non_empty_string(npc.get("role"), f"NPC {npc_label} role")
            self._require_non_empty_string(
                npc.get("personality"), f"NPC {npc_label} personality"
            )
            english_level = npc.get("english_level")
            if english_level not in valid_english_levels:
                self._error(
                    f"NPC {npc_label} english_level must be one of: A1, A2, B1, B2, C1, C2."
                )

        for location in self.content.get("locations", []):
            location_label = self._item_label(location)
            self._require_non_empty_string(
                location.get("name"), f"Location {location_label} name"
            )
            self._require_non_empty_string(
                location.get("region"), f"Location {location_label} region"
            )

    def _validate_passport_stamp_ids(self) -> None:
        for location in self.content.get("locations", []):
            location_label = self._item_label(location)
            passport_stamp = location.get("passport_stamp")
            if passport_stamp is None:
                continue
            if not isinstance(passport_stamp, dict):
                self._error(f"Location {location_label} passport_stamp must be an object.")
                continue
            if not self._is_non_empty_string(passport_stamp.get("id")):
                self._error(
                    f"Location {location_label} passport_stamp.id must be a non-empty string."
                )

        for quest in self.content.get("quests", []):
            quest_label = self._item_label(quest)
            rewards = quest.get("rewards")
            if rewards is None:
                continue
            if not isinstance(rewards, dict):
                self._error(f"Quest {quest_label} rewards must be an object.")
                continue
            passport_stamps = rewards.get("passport_stamps")
            if passport_stamps is None:
                continue
            if not isinstance(passport_stamps, list):
                self._error(f"Quest {quest_label} rewards.passport_stamps must be an array.")
                continue
            for index, stamp_id in enumerate(passport_stamps):
                if not self._is_non_empty_string(stamp_id):
                    self._error(
                        f"Quest {quest_label} rewards.passport_stamps[{index}] must be a non-empty string."
                    )

        for lesson in self.content.get("lessons", []):
            lesson_label = self._item_label(lesson)
            if "passport_stamp_id" not in lesson:
                continue
            if not self._is_non_empty_string(lesson.get("passport_stamp_id")):
                self._error(
                    f"Lesson {lesson_label} passport_stamp_id must be a non-empty string."
                )

    def _require_non_empty_string(self, value: Any, label: str) -> None:
        if not self._is_non_empty_string(value):
            self._error(f"{label} must be a non-empty string.")

    def _require_non_empty_string_list(
        self, value: Any, label: str, *, require_non_empty: bool
    ) -> None:
        if not isinstance(value, list):
            self._error(f"{label} must be an array of non-empty strings.")
            return
        if require_non_empty and not value:
            self._error(f"{label} must be a non-empty array of strings.")
            return
        for index, item in enumerate(value):
            if not self._is_non_empty_string(item):
                self._error(f"{label}[{index}] must be a non-empty string.")

    @staticmethod
    def _is_integer(value: Any) -> bool:
        return isinstance(value, int) and not isinstance(value, bool)

    def _require_reference(self, value: Any, valid_ids: set[str], label: str) -> None:
        if not self._is_non_empty_string(value):
            self._error(f"{label} must be a non-empty string reference.")
            return
        if value not in valid_ids:
            self._error(f"{label} references missing id '{value}'.")

    def _require_reference_list(self, value: Any, valid_ids: set[str], label: str) -> None:
        if value is None:
            self._error(f"{label} must be an array of id references.")
            return
        if not isinstance(value, list):
            self._error(f"{label} must be an array of id references.")
            return
        for index, item_id in enumerate(value):
            item_label = f"{label}[{index}]"
            if not self._is_non_empty_string(item_id):
                self._error(f"{item_label} must be a non-empty string reference.")
                continue
            if item_id not in valid_ids:
                self._error(f"{item_label} references missing id '{item_id}'.")

    def _item_label(self, item: dict[str, Any]) -> str:
        item_id = item.get("id")
        if self._is_non_empty_string(item_id):
            return f"'{item_id}'"
        return "<missing id>"

    def _error(self, message: str) -> None:
        self.errors.append(message)

    @staticmethod
    def _is_non_empty_string(value: Any) -> bool:
        return isinstance(value, str) and bool(value.strip())


def main() -> int:
    project_root = Path(__file__).resolve().parents[1]
    validator = ContentValidator(project_root)

    if validator.validate():
        print("Content validation passed.")
        return 0

    print("Content validation failed:", file=sys.stderr)
    for error in validator.errors:
        print(f"- {error}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
