import dayjs from 'dayjs';

import type { Course, CourseClass } from '@/types/course';

export type CourseDateEntry = {
	course: Course;
	date: CourseClass;
};

export const isFutureDate = (dateStr: string): boolean =>
	!dayjs(dateStr).isBefore(dayjs().startOf('day'));

export const isCourseClassCanceled = (date: CourseClass): boolean => date.canceled === true;

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

export const getSlotsLeft = (date: CourseClass): number =>
	date.slotsMax - (date.participants?.length ?? 0);
