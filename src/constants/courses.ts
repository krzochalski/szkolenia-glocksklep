import type { CourseKind } from '@/types/course';

export const COURSE_LEVEL_LABEL: Record<string, string> = {
	basic: 'Podstawowy',
	intermediate: 'Średniozaawansowany',
	advanced: 'Zaawansowany',
};

/** Ascending difficulty for list ordering. Unknown levels sort last. */
export const COURSE_LEVEL_ORDER: Record<string, number> = {
	basic: 0,
	intermediate: 1,
	advanced: 2,
};

/** Default start time when creating a new course date. */
export const DEFAULT_COURSE_TIME_START = '09:00';

/** Default max seats when creating a new course date. */
export const DEFAULT_COURSE_SLOTS_MAX = 12;

/** Default min headcount for `kind === 'course'` (e.g. 4 of 6). */
export const DEFAULT_COURSE_MIN_PARTICIPANTS = 4;

/** Default min headcount for `kind === 'practice'` (e.g. 3 of 4). */
export const DEFAULT_PRACTICE_MIN_PARTICIPANTS = 3;

/**
 * Days before session date used to seed `minDecisionBy` when creating dates.
 * Below-min dates on/after that day escalate to needs_decision (never auto-cancel).
 */
export const DEFAULT_MIN_DECISION_DAYS_BEFORE = 7;

/** Show “ostatnie miejsca” when remaining seats are at or below this (and > 0). */
export const SCARCITY_SLOTS_THRESHOLD = 3;

/** Course-level default capacity, falling back to the global default. */
export const getCourseSlotsMax = (course: { slotsMax?: number } | null | undefined): number =>
	course?.slotsMax && course.slotsMax > 0 ? course.slotsMax : DEFAULT_COURSE_SLOTS_MAX;

/** Kind-based fallback when course has no `minParticipants`. */
export const defaultMinParticipantsForKind = (kind: CourseKind | null | undefined): number =>
	kind === 'practice' ? DEFAULT_PRACTICE_MIN_PARTICIPANTS : DEFAULT_COURSE_MIN_PARTICIPANTS;
