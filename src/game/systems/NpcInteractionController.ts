import type { ContentDatabase } from './ContentDatabase';
import type { LessonAnswerResult, LessonManager } from './LessonManager';
import type { ContentId, LessonContent, NpcContent } from '../types/content';

export type NpcInteractionStatus =
  | 'ok'
  | 'npc_not_found'
  | 'npc_missing_intro_lesson'
  | 'npc_lessons_complete'
  | 'lesson_not_found'
  | 'wrong_location';

export interface NpcInteractionResult {
  ok: boolean;
  status: NpcInteractionStatus;
  npcId: ContentId;
  locationId?: ContentId;
  lessonId?: ContentId;
  npc?: NpcContent;
  lesson?: LessonContent;
}

export interface NpcLessonProgress {
  npcId: ContentId;
  completedLessonIds: readonly ContentId[];
  availableLessonIds: readonly ContentId[];
  nextLessonId?: ContentId;
  isComplete: boolean;
}

export class NpcInteractionController {
  private readonly completedLessonIdsByNpc = new Map<ContentId, Set<ContentId>>();

  private currentNpcId?: ContentId;
  private currentLessonId?: ContentId;
  private currentLocationId?: ContentId;
  private currentLessonCompleted = false;

  public constructor(
    private readonly contentDatabase: ContentDatabase,
    private readonly lessonManager: LessonManager,
  ) {}

  public startNpcInteraction(npcId: string, locationId?: string): NpcInteractionResult {
    const npc = this.contentDatabase.getNpc(npcId);

    if (!npc) {
      this.clear();
      return {
        ok: false,
        status: 'npc_not_found',
        npcId,
        locationId,
      };
    }

    if (locationId !== undefined && npc.location_id !== locationId) {
      this.clear();
      return {
        ok: false,
        status: 'wrong_location',
        npcId,
        locationId,
        npc,
      };
    }

    const resolvedLocationId = locationId ?? npc.location_id;

    if (!npc.intro_lesson_id) {
      this.clear();
      return {
        ok: false,
        status: 'npc_missing_intro_lesson',
        npcId,
        locationId: resolvedLocationId,
        npc,
      };
    }

    const completedLessonIds = this.getCompletedLessonIdsForNpc(npc.id);

    if (!completedLessonIds.has(npc.intro_lesson_id)) {
      const introAccessResult = this.lessonManager.validateLessonAccess(npc.intro_lesson_id, resolvedLocationId);

      if (!introAccessResult.ok || !introAccessResult.lesson) {
        this.clear();
        return {
          ok: false,
          status: introAccessResult.status,
          npcId,
          locationId: resolvedLocationId,
          lessonId: npc.intro_lesson_id,
          npc,
          lesson: introAccessResult.lesson,
        };
      }
    }

    const nextLesson = this.getNextLessonForNpc(npc.id, resolvedLocationId);

    if (!nextLesson) {
      this.clear();
      const progress = this.getNpcLessonProgress(npc.id);
      return {
        ok: false,
        status: progress.availableLessonIds.length === 0 ? 'npc_missing_intro_lesson' : 'npc_lessons_complete',
        npcId,
        locationId: resolvedLocationId,
        npc,
      };
    }

    const accessResult = this.lessonManager.validateLessonAccess(nextLesson.id, resolvedLocationId);

    if (!accessResult.ok || !accessResult.lesson) {
      this.clear();
      return {
        ok: false,
        status: accessResult.status,
        npcId,
        locationId: resolvedLocationId,
        lessonId: nextLesson.id,
        npc,
        lesson: accessResult.lesson,
      };
    }

    this.currentNpcId = npc.id;
    this.currentLessonId = accessResult.lesson.id;
    this.currentLocationId = resolvedLocationId;
    this.currentLessonCompleted = this.getCompletedLessonIdsForNpc(npc.id).has(accessResult.lesson.id);

    return {
      ok: true,
      status: 'ok',
      npcId: npc.id,
      locationId: resolvedLocationId,
      lessonId: accessResult.lesson.id,
      npc,
      lesson: accessResult.lesson,
    };
  }

  public getNextLessonForNpc(npcId: string, locationId?: string): LessonContent | undefined {
    const npc = this.contentDatabase.getNpc(npcId);

    if (!npc) {
      return undefined;
    }

    const completedLessonIds = this.getCompletedLessonIdsForNpc(npcId);

    return this.getOrderedLessonsForNpc(npc)
      .filter((lesson) => locationId === undefined || lesson.location_id === locationId)
      .find((lesson) => !completedLessonIds.has(lesson.id));
  }

  public getNpcLessonProgress(npcId: string): NpcLessonProgress {
    const npc = this.contentDatabase.getNpc(npcId);
    const availableLessons = npc ? this.getOrderedLessonsForNpc(npc) : [];
    const availableLessonIds = availableLessons.map((lesson) => lesson.id);
    const completedLessonIdSet = this.getCompletedLessonIdsForNpc(npcId);
    const completedLessonIds = availableLessonIds.filter((lessonId) => completedLessonIdSet.has(lessonId));
    const nextLessonId = availableLessons.find((lesson) => !completedLessonIdSet.has(lesson.id))?.id;

    return {
      npcId,
      completedLessonIds,
      availableLessonIds,
      nextLessonId,
      isComplete: availableLessonIds.length > 0 && nextLessonId === undefined,
    };
  }

  public answerCurrentLesson(choiceIndex: number): LessonAnswerResult | NpcInteractionResult {
    if (!this.currentNpcId || !this.currentLessonId) {
      return {
        ok: false,
        status: 'lesson_not_found',
        npcId: this.currentNpcId ?? '',
        locationId: this.currentLocationId,
        lessonId: this.currentLessonId,
      };
    }

    const result = this.lessonManager.checkAnswer(this.currentLessonId, choiceIndex, this.currentLocationId);

    if (result.isCorrect) {
      this.markCurrentLessonCompleted();
    }

    return result;
  }

  public markCurrentLessonCompleted(): void {
    if (!this.currentNpcId || !this.currentLessonId || this.currentLessonCompleted) {
      return;
    }

    this.getCompletedLessonIdsForNpc(this.currentNpcId).add(this.currentLessonId);
    this.currentLessonCompleted = true;
  }

  public getCurrentNpcId(): string | undefined {
    return this.currentNpcId;
  }

  public getCurrentLessonId(): string | undefined {
    return this.currentLessonId;
  }

  public clear(): void {
    this.currentNpcId = undefined;
    this.currentLessonId = undefined;
    this.currentLocationId = undefined;
    this.currentLessonCompleted = false;
  }

  private getOrderedLessonsForNpc(npc: NpcContent): readonly LessonContent[] {
    const orderedLessons: LessonContent[] = [];
    const addedLessonIds = new Set<ContentId>();

    if (npc.intro_lesson_id) {
      const introLesson = this.contentDatabase.getLesson(npc.intro_lesson_id);

      if (introLesson && introLesson.npc_id === npc.id) {
        orderedLessons.push(introLesson);
        addedLessonIds.add(introLesson.id);
      }
    }

    this.contentDatabase.getLessonsByNpc(npc.id).forEach((lesson) => {
      if (addedLessonIds.has(lesson.id)) {
        return;
      }

      orderedLessons.push(lesson);
      addedLessonIds.add(lesson.id);
    });

    return orderedLessons;
  }

  private getCompletedLessonIdsForNpc(npcId: ContentId): Set<ContentId> {
    const completedLessonIds = this.completedLessonIdsByNpc.get(npcId);

    if (completedLessonIds) {
      return completedLessonIds;
    }

    const createdCompletedLessonIds = new Set<ContentId>();
    this.completedLessonIdsByNpc.set(npcId, createdCompletedLessonIds);
    return createdCompletedLessonIds;
  }
}
