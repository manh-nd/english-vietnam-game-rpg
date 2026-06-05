export type ContentId = string;

export interface LocationContent {
  id: ContentId;
  name: string;
  region?: string;
  description?: string;
  scene_path?: string;
  recommended_lessons?: ContentId[];
  [key: string]: unknown;
}

export interface NpcContent {
  id: ContentId;
  name: string;
  location_id: ContentId;
  intro_lesson_id?: ContentId;
  quest_ids?: ContentId[];
  [key: string]: unknown;
}

export interface QuestRewardsContent {
  xp?: number;
  vocab?: string[];
  passport_stamps?: ContentId[];
  [key: string]: unknown;
}

export interface QuestContent {
  id: ContentId;
  title: string;
  description: string;
  state?: 'not_started' | 'active' | 'completed';
  location_id: ContentId;
  giver_npc_id: ContentId;
  required_lesson_ids?: ContentId[];
  rewards?: QuestRewardsContent;
  [key: string]: unknown;
}

export interface LessonContent {
  id: ContentId;
  skill: string;
  location_id: ContentId;
  npc_id: ContentId;
  npc_line: string;
  choices: string[];
  correct_choice_index: number;
  hint?: string;
  explanation_vi?: string;
  reward_vocab?: string[];
  [key: string]: unknown;
}

export interface AuthoredContent {
  locations: LocationContent[];
  npcs: NpcContent[];
  quests: QuestContent[];
  lessons: LessonContent[];
}
