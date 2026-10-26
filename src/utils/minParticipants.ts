/**
 * Minimum headcount to treat a course date as ready to run.
 *
 * Count rule: every signup in `participants[]` (same as capacity / getSlotsLeft).
 * Unpaid seats still count — do not filter on `paid` or `paysByCash`.
 *
 * Status priority: cancelled > needs_decision > at_risk > full > open.
 * Never auto-cancels; admin must cancel or confirm run despite min.
 */

import {
	DEFAULT_MIN_DECISION_DAYS_BEFORE,
	defaultMinParticipantsForKind,
	getCourseSlotsMax,
} from '@constants/courses';
import type { Course, CourseClass, CourseKind } from '@/types/course';
import { getCourseKind } from '@/utils/courseKind';

/** Add calendar days to `YYYY-MM-DD` (UTC noon arithmetic — DST-safe). */
const addCalendarDays = (ymd: string, days: number): string => {
	const [y, m, d] = ymd.split('-').map(Number);
	const dt = new Date(Date.UTC(y, m - 1, d));
	dt.setUTCDate(dt.getUTCDate() + days);
	const yy = dt.getUTCFullYear();
	const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
	const dd = String(dt.getUTCDate()).padStart(2, '0');
	return `${yy}-${mm}-${dd}`;
};

export type MinParticipantsSessionStatus =
	| 'cancelled'
	| 'needs_decision'
	| 'at_risk'
	| 'full'
	| 'open';

export type CourseMinDefaults = Pick<
	Course,
	'kind' | 'minParticipants' | 'minDecisionDaysBefore' | 'slotsMax'
>;

/** Signed-up count for min / capacity (all participants). */
export const signedUpCount = (
	date: Pick<CourseClass, 'participants'>
): number => date.participants?.length ?? 0;

/** Course-level default min, falling back to kind defaults. */
export const getCourseMinParticipants = (
	course: CourseMinDefaults | null | undefined
): number => {
	const raw = course?.minParticipants;
	if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 1) {
		return Math.floor(raw);
	}
	return defaultMinParticipantsForKind(getCourseKind(course ?? undefined));
};

/** Course-level days-before used to seed date decision deadlines. */
export const getCourseMinDecisionDaysBefore = (
	course: Pick<Course, 'minDecisionDaysBefore'> | null | undefined
): number => {
	const raw = course?.minDecisionDaysBefore;
	if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) {
		return Math.floor(raw);
	}
	return DEFAULT_MIN_DECISION_DAYS_BEFORE;
};

/** Session date minus N calendar days → `YYYY-MM-DD` (clamped conceptually by callers). */
export const defaultMinDecisionBy = (sessionDate: string, daysBefore: number): string => {
	const days = Number.isFinite(daysBefore) && daysBefore >= 0 ? Math.floor(daysBefore) : 0;
	return addCalendarDays(sessionDate, -days);
};

/**
 * Resolved min for a date: date field → course default → kind default.
 * Capped at slotsMax so min never exceeds capacity.
 */
export const resolveDateMinParticipants = (
	course: CourseMinDefaults | null | undefined,
	date: Pick<CourseClass, 'minParticipants' | 'slotsMax'>
): number => {
	const slotsMax = date.slotsMax > 0 ? date.slotsMax : getCourseSlotsMax(course);
	const raw =
		typeof date.minParticipants === 'number' &&
		Number.isFinite(date.minParticipants) &&
		date.minParticipants >= 1
			? Math.floor(date.minParticipants)
			: getCourseMinParticipants(course);
	return Math.min(Math.max(1, raw), slotsMax);
};

/**
 * Resolved decision deadline: date field → sessionDate − course days-before.
 * Never after the session date.
 */
export const resolveDateMinDecisionBy = (
	course: CourseMinDefaults | null | undefined,
	date: Pick<CourseClass, 'date' | 'minDecisionBy'>
): string => {
	const sessionDate = date.date;
	const raw = date.minDecisionBy?.trim();
	const candidate =
		raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)
			? raw
			: defaultMinDecisionBy(sessionDate, getCourseMinDecisionDaysBefore(course));
	return candidate > sessionDate ? sessionDate : candidate;
};

export type ResolveSessionStatusInput = {
	readonly date: CourseClass;
	readonly course?: CourseMinDefaults | null;
	/** Europe/Warsaw `YYYY-MM-DD` (caller supplies; do not call warsawToday in pure tests). */
	readonly today: string;
};

/**
 * Ops status including min-participants risk.
 * Past dates below min stay `open`/`full` (no at_risk after the day).
 */
export const resolveSessionStatus = ({
	date,
	course,
	today,
}: ResolveSessionStatusInput): MinParticipantsSessionStatus => {
	if (date.canceled === true) return 'cancelled';

	const signedUp = signedUpCount(date);
	const slotsMax = date.slotsMax > 0 ? date.slotsMax : 1;
	const min = resolveDateMinParticipants(course, date);
	const isFuture = date.date >= today;
	const belowMin = signedUp < min;
	const forceRun = date.runConfirmedDespiteMin === true;

	if (isFuture && belowMin && !forceRun) {
		const deadline = resolveDateMinDecisionBy(course, date);
		if (today >= deadline) return 'needs_decision';
		return 'at_risk';
	}

	if (signedUp >= slotsMax) return 'full';
	return 'open';
};

/** True when status is below-min (admin filter / spotlight). */
export const isBelowMinStatus = (
	status: MinParticipantsSessionStatus
): boolean => status === 'at_risk' || status === 'needs_decision';

/** Admin / dashboard counter fragment, e.g. `3/4 min`. */
export const formatMinParticipantsMeta = (signedUp: number, min: number): string =>
	`${signedUp}/${min} min`;

/**
 * Public soft copy when a future non-canceled date is below min.
 * Returns null when at/above min or not applicable.
 */
export const formatPublicMinParticipantsHint = (
	course: CourseMinDefaults | null | undefined,
	date: Pick<CourseClass, 'minParticipants' | 'slotsMax' | 'participants' | 'canceled' | 'date'>,
	today: string
): string | null => {
	if (date.canceled === true) return null;
	if (date.date < today) return null;
	const min = resolveDateMinParticipants(course, date);
	if (signedUpCount(date) >= min) return null;
	return `Termin wystartuje przy min. ${min} osobach`;
};

/** Kind helper for forms that only know a kind string. */
export const minParticipantsDefaultForKind = (kind: CourseKind): number =>
	defaultMinParticipantsForKind(kind);
