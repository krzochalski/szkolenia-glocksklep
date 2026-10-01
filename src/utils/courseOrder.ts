import { COURSE_LEVEL_ORDER } from '@constants/courses';
import type { Course } from '@/types/course';

/** Ascending catalog order. Missing `order` sorts last; name is the tiebreaker. */
export const compareCoursesByOrder = (a: Course, b: Course): number => {
	const orderA = a.order ?? Number.POSITIVE_INFINITY;
	const orderB = b.order ?? Number.POSITIVE_INFINITY;
	if (orderA !== orderB) return orderA - orderB;
	return a.name.localeCompare(b.name, 'pl');
};

/**
 * Legacy public-catalog sort (level then name).
 * Used only to seed `order` when existing courses lack it.
 */
export const compareCoursesByLegacyCatalogOrder = (a: Course, b: Course): number => {
	const byLevel =
		(COURSE_LEVEL_ORDER[a.level] ?? Number.POSITIVE_INFINITY) -
		(COURSE_LEVEL_ORDER[b.level] ?? Number.POSITIVE_INFINITY);
	if (byLevel !== 0) return byLevel;
	return a.name.localeCompare(b.name, 'pl');
};

export const sortCoursesByOrder = (courses: Course[]): Course[] =>
	[...courses].sort(compareCoursesByOrder);

export const coursesNeedOrderBackfill = (courses: Course[]): boolean =>
	courses.some((c) => typeof c.order !== 'number');
