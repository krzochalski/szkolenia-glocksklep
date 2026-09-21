import { updateCourseDates } from '@services/courses';
import type { Course, CourseClass } from '@/types/course';
import { v4 as uuid } from 'uuid';
import { cleanDateForFirestore } from './cleanDateForFirestore';
import { withClonedDate } from './cloneDate';

export { withClonedDate } from './cloneDate';

export const cloneCourseDate = async (course: Course, date: CourseClass): Promise<void> => {
	const next = withClonedDate(course.dates ?? [], date.id, uuid());
	await updateCourseDates(
		course.id,
		next.map((d) => cleanDateForFirestore(d))
	);
};

export const removeCourseDate = async (course: Course, dateId: string): Promise<void> => {
	const remaining = (course.dates ?? [])
		.filter((d) => d.id !== dateId)
		.map((d) => cleanDateForFirestore(d));
	await updateCourseDates(course.id, remaining);
};
