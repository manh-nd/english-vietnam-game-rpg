import type { ContentDatabase } from './ContentDatabase';
import type { LessonContent } from '../types/content';

export type LessonAccessStatus = 'ok' | 'lesson_not_found' | 'wrong_location';
export type LessonAnswerStatus =
  | 'correct'
  | 'incorrect'
  | 'lesson_not_found'
  | 'wrong_location'
  | 'invalid_choice';

export interface LessonAccessResult {
  ok: boolean;
  status: LessonAccessStatus;
  lessonId: string;
  locationId?: string;
  lesson?: LessonContent;
}

export interface LessonAnswerResult {
  ok: boolean;
  status: LessonAnswerStatus;
  lessonId: string;
  locationId?: string;
  choiceIndex: number;
  isCorrect: boolean;
  npcLine: string;
  selectedChoice?: string;
  correctChoice?: string;
  hint: string;
  explanationVi?: string;
  rewardVocab?: readonly string[];
  skill?: string;
}

export class LessonManager {
  public constructor(private readonly contentDatabase: ContentDatabase) {}

  public getLesson(lessonId: string): LessonContent | undefined {
    return this.contentDatabase.getLesson(lessonId);
  }

  public validateLessonAccess(lessonId: string, locationId?: string): LessonAccessResult {
    const lesson = this.getLesson(lessonId);

    if (!lesson) {
      return {
        ok: false,
        status: 'lesson_not_found',
        lessonId,
        locationId,
      };
    }

    if (locationId !== undefined && lesson.location_id !== locationId) {
      return {
        ok: false,
        status: 'wrong_location',
        lessonId,
        locationId,
        lesson,
      };
    }

    return {
      ok: true,
      status: 'ok',
      lessonId,
      locationId,
      lesson,
    };
  }

  public checkAnswer(lessonId: string, choiceIndex: number, locationId?: string): LessonAnswerResult {
    const accessResult = this.validateLessonAccess(lessonId, locationId);

    if (!accessResult.ok || !accessResult.lesson) {
      return this.createUnavailableLessonResult(accessResult, choiceIndex);
    }

    const lesson = accessResult.lesson;
    const correctChoice = this.getChoice(lesson, lesson.correct_choice_index);

    if (!Number.isInteger(choiceIndex) || !this.isChoiceInRange(lesson, choiceIndex)) {
      return {
        ok: false,
        status: 'invalid_choice',
        lessonId,
        locationId,
        choiceIndex,
        isCorrect: false,
        npcLine: lesson.npc_line,
        correctChoice,
        hint: this.getHint(lessonId),
        explanationVi: lesson.explanation_vi,
        rewardVocab: lesson.reward_vocab,
        skill: lesson.skill,
      };
    }

    const selectedChoice = lesson.choices[choiceIndex];
    const isCorrect = choiceIndex === lesson.correct_choice_index;

    return {
      ok: isCorrect,
      status: isCorrect ? 'correct' : 'incorrect',
      lessonId,
      locationId,
      choiceIndex,
      isCorrect,
      npcLine: lesson.npc_line,
      selectedChoice,
      correctChoice,
      hint: this.getHint(lessonId),
      explanationVi: lesson.explanation_vi,
      rewardVocab: lesson.reward_vocab,
      skill: lesson.skill,
    };
  }

  public getHint(lessonId: string): string {
    return this.getLesson(lessonId)?.hint ?? '';
  }

  private createUnavailableLessonResult(accessResult: LessonAccessResult, choiceIndex: number): LessonAnswerResult {
    const lesson = accessResult.lesson;

    return {
      ok: false,
      status: accessResult.status === 'ok' ? 'lesson_not_found' : accessResult.status,
      lessonId: accessResult.lessonId,
      locationId: accessResult.locationId,
      choiceIndex,
      isCorrect: false,
      npcLine: lesson?.npc_line ?? '',
      correctChoice: lesson ? this.getChoice(lesson, lesson.correct_choice_index) : undefined,
      hint: lesson?.hint ?? '',
      explanationVi: lesson?.explanation_vi,
      rewardVocab: lesson?.reward_vocab,
      skill: lesson?.skill,
    };
  }

  private isChoiceInRange(lesson: LessonContent, choiceIndex: number): boolean {
    return choiceIndex >= 0 && choiceIndex < lesson.choices.length;
  }

  private getChoice(lesson: LessonContent, choiceIndex: number): string | undefined {
    return this.isChoiceInRange(lesson, choiceIndex) ? lesson.choices[choiceIndex] : undefined;
  }
}
