import { SCARCITY_SLOTS_THRESHOLD } from '@constants/courses';
import dayjs from 'dayjs';

import type { Course, CourseClass } from '@/types/course';

export type CourseDateEntry = {
	course: Course;
	date: CourseClass;
};

export const isFutureDate = (dateStr: string): boolean =>
	!dayjs(dateStr).isBefore(dayjs().startOf('day'));

export const isCourseClassCanceled = (
	date: Pick<CourseClass, 'canceled'>
): boolean => date.canceled === true;

export const isCourseInactive = (course: Pick<Course, 'inactive'>): boolean =>
	course.inactive === true;

/** Public / client enroll surfaces — skips inactive courses and canceled dates. */
export const getFutureCourseDates = (courses: Course[]): CourseDateEntry[] => {
	const entries: CourseDateEntry[] = [];
	for (const course of courses) {
		if (isCourseInactive(course)) continue;
		for (const date of course.dates ?? []) {
			if (isFutureDate(date.date) && !isCourseClassCanceled(date)) {
				entries.push({ course, date });
			}
		}
	}
	return entries.sort((a, b) => a.date.date.localeCompare(b.date.date));
};

export const getSlotsLeft = (
	date: Pick<CourseClass, 'slotsMax' | 'participants'>
): number => date.slotsMax - (date.participants?.length ?? 0);

/** True when seats remain but are scarce enough to urge booking. */
export const isLowSlotsLeft = (slotsLeft: number): boolean =>
	slotsLeft > 0 && slotsLeft <= SCARCITY_SLOTS_THRESHOLD;

/** Meta fragment for date rows: `wolne: N` or `wolne: N · ostatnie miejsca`. */
export const formatSlotsMeta = (
	date: Pick<CourseClass, 'slotsMax' | 'participants'>
): string => {
	const left = getSlotsLeft(date);
	if (isLowSlotsLeft(left)) {
		return `wolne: ${left} · ostatnie miejsca`;
	}
	return `wolne: ${left}`;
};

/** Polish count line for course waitlist demand (public). */
export const formatWaitingListDemand = (count: number): string => {
	const n = Math.max(0, Math.floor(count));
	if (n === 1) return '1 osoba już czeka na nowy termin.';
	const mod10 = n % 10;
	const mod100 = n % 100;
	if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
		return `${n} osoby już czekają na nowy termin.`;
	}
	return `${n} osób już czeka na nowy termin.`;
};
