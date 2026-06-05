import type { ContentDatabase } from './ContentDatabase';
import type { LessonAnswerResult } from './LessonManager';
import type { ContentId, QuestContent, QuestRewardsContent } from '../types/content';

export type QuestState = 'not_started' | 'active' | 'completed';

export type QuestUpdateStatus =
  | 'ok'
  | 'quest_not_found'
  | 'already_active'
  | 'already_completed'
  | 'quest_started'
  | 'quest_completed'
  | 'incorrect_answer'
  | 'lesson_not_required'
  | 'quest_not_active';

export interface QuestProgress {
  questId: ContentId;
  state: QuestState;
  requiredLessonIds: readonly ContentId[];
  completedLessonIds: readonly ContentId[];
  remainingLessonIds: readonly ContentId[];
  rewards?: QuestRewardsContent;
}

export interface QuestUpdate {
  ok: boolean;
  status: QuestUpdateStatus;
  questId?: ContentId;
  lessonId?: ContentId;
  state?: QuestState;
  progress?: QuestProgress;
  rewards?: QuestRewardsContent;
}

interface RuntimeQuestState {
  state: QuestState;
  completedLessonIds: Set<ContentId>;
}

export class QuestManager {
  private readonly questStates = new Map<ContentId, RuntimeQuestState>();

  public constructor(private readonly contentDatabase: ContentDatabase) {
    this.contentDatabase.getQuests().forEach((quest) => {
      this.questStates.set(quest.id, {
        state: this.normalizeQuestState(quest.state),
        completedLessonIds: new Set<ContentId>(),
      });
    });
  }

  public getQuest(questId: string): QuestContent | undefined {
    return this.contentDatabase.getQuest(questId);
  }

  public getQuests(): readonly QuestContent[] {
    return this.contentDatabase.getQuests();
  }

  public getQuestState(questId: string): QuestState {
    return this.questStates.get(questId)?.state ?? 'not_started';
  }

  public getQuestProgress(questId: string): QuestProgress {
    const quest = this.getQuest(questId);
    const runtimeState = this.getOrCreateRuntimeState(questId);
    const requiredLessonIds = this.getRequiredLessonIds(quest);
    const completedLessonIds = requiredLessonIds.filter((lessonId) => runtimeState.completedLessonIds.has(lessonId));
    const remainingLessonIds = requiredLessonIds.filter((lessonId) => !runtimeState.completedLessonIds.has(lessonId));

    return {
      questId,
      state: runtimeState.state,
      requiredLessonIds,
      completedLessonIds,
      remainingLessonIds,
      rewards: quest?.rewards,
    };
  }

  public getActiveQuests(): readonly QuestProgress[] {
    return this.getProgressByState('active');
  }

  public getCompletedQuests(): readonly QuestProgress[] {
    return this.getProgressByState('completed');
  }

  public startQuest(questId: string): QuestUpdate {
    const quest = this.getQuest(questId);

    if (!quest) {
      return {
        ok: false,
        status: 'quest_not_found',
        questId,
      };
    }

    const runtimeState = this.getOrCreateRuntimeState(questId);

    if (runtimeState.state === 'completed') {
      return this.createQuestUpdate(false, 'already_completed', questId);
    }

    if (runtimeState.state === 'active') {
      return this.createQuestUpdate(false, 'already_active', questId);
    }

    runtimeState.state = 'active';

    return this.createQuestUpdate(true, 'quest_started', questId);
  }

  public completeQuest(questId: string): QuestUpdate {
    const quest = this.getQuest(questId);

    if (!quest) {
      return {
        ok: false,
        status: 'quest_not_found',
        questId,
      };
    }

    const runtimeState = this.getOrCreateRuntimeState(questId);

    if (runtimeState.state === 'completed') {
      return this.createQuestUpdate(false, 'already_completed', questId);
    }

    this.getRequiredLessonIds(quest).forEach((lessonId) => {
      runtimeState.completedLessonIds.add(lessonId);
    });
    runtimeState.state = 'completed';

    return this.createQuestUpdate(true, 'quest_completed', questId, undefined, quest.rewards);
  }

  public handleLessonAnswered(
    _npcId: string,
    lessonId: string,
    result: LessonAnswerResult,
  ): readonly QuestUpdate[] {
    if (result.status !== 'correct' || !result.isCorrect) {
      return [
        {
          ok: false,
          status: 'incorrect_answer',
          lessonId,
        },
      ];
    }

    const updates: QuestUpdate[] = [];

    this.getQuests().forEach((quest) => {
      const runtimeState = this.getOrCreateRuntimeState(quest.id);

      if (runtimeState.state !== 'active') {
        return;
      }

      const requiredLessonIds = this.getRequiredLessonIds(quest);

      if (!requiredLessonIds.includes(lessonId)) {
        return;
      }

      runtimeState.completedLessonIds.add(lessonId);

      if (this.areRequiredLessonsComplete(requiredLessonIds, runtimeState.completedLessonIds)) {
        const completeUpdate = this.completeQuest(quest.id);
        updates.push({
          ...completeUpdate,
          lessonId,
        });
        return;
      }

      updates.push(this.createQuestUpdate(true, 'ok', quest.id, lessonId));
    });

    if (updates.length === 0) {
      return [
        {
          ok: false,
          status: 'lesson_not_required',
          lessonId,
        },
      ];
    }

    return updates;
  }

  private getProgressByState(state: QuestState): readonly QuestProgress[] {
    return this.getQuests()
      .filter((quest) => this.getQuestState(quest.id) === state)
      .map((quest) => this.getQuestProgress(quest.id));
  }

  private createQuestUpdate(
    ok: boolean,
    status: QuestUpdateStatus,
    questId: ContentId,
    lessonId?: ContentId,
    rewards?: QuestRewardsContent,
  ): QuestUpdate {
    const progress = this.getQuestProgress(questId);

    return {
      ok,
      status,
      questId,
      lessonId,
      state: progress.state,
      progress,
      rewards,
    };
  }

  private getOrCreateRuntimeState(questId: ContentId): RuntimeQuestState {
    const runtimeState = this.questStates.get(questId);

    if (runtimeState) {
      return runtimeState;
    }

    const createdState: RuntimeQuestState = {
      state: 'not_started',
      completedLessonIds: new Set<ContentId>(),
    };
    this.questStates.set(questId, createdState);
    return createdState;
  }

  private getRequiredLessonIds(quest: QuestContent | undefined): readonly ContentId[] {
    return quest?.required_lesson_ids ?? [];
  }

  private areRequiredLessonsComplete(
    requiredLessonIds: readonly ContentId[],
    completedLessonIds: ReadonlySet<ContentId>,
  ): boolean {
    return requiredLessonIds.every((lessonId) => completedLessonIds.has(lessonId));
  }

  private normalizeQuestState(state: QuestContent['state']): QuestState {
    if (state === 'active' || state === 'completed') {
      return state;
    }

    return 'not_started';
  }
}
