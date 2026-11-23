import { updateCourseDates } from '@services/courses';
import type { Course } from '@/types/course';
import { cleanDateForFirestore } from './cleanDateForFirestore';

export const removeCourseDate = async (course: Course, dateId: string): Promise<void> => {
	const remaining = (course.dates ?? [])
		.filter((d) => d.id !== dateId)
		.map((d) => cleanDateForFirestore(d));
	await updateCourseDates(course.id, remaining);
};
