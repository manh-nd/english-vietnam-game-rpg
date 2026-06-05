import type { ContentDatabase } from './ContentDatabase';
import type { LessonAnswerResult, LessonManager } from './LessonManager';
import type { ContentId, LessonContent, NpcContent } from '../types/content';

export type NpcInteractionStatus =
  | 'ok'
  | 'npc_not_found'
  | 'npc_missing_intro_lesson'
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

export class NpcInteractionController {
  private currentNpcId?: ContentId;
  private currentLessonId?: ContentId;
  private currentLocationId?: ContentId;

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

    if (!npc.intro_lesson_id) {
      this.clear();
      return {
        ok: false,
        status: 'npc_missing_intro_lesson',
        npcId,
        locationId: locationId ?? npc.location_id,
        npc,
      };
    }

    const resolvedLocationId = locationId ?? npc.location_id;
    const accessResult = this.lessonManager.validateLessonAccess(npc.intro_lesson_id, resolvedLocationId);

    if (!accessResult.ok || !accessResult.lesson) {
      this.clear();
      return {
        ok: false,
        status: accessResult.status,
        npcId,
        locationId: resolvedLocationId,
        lessonId: npc.intro_lesson_id,
        npc,
        lesson: accessResult.lesson,
      };
    }

    this.currentNpcId = npc.id;
    this.currentLessonId = accessResult.lesson.id;
    this.currentLocationId = resolvedLocationId;

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

    return this.lessonManager.checkAnswer(this.currentLessonId, choiceIndex, this.currentLocationId);
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
  }
}
