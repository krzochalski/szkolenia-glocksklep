import type { Course } from '@/types/course';
import { isCourseInactive } from '@/utils/courseDates';

const tagScore = (a: Course, b: Course): number => {
	if (!a.tags.length || !b.tags.length) return 0;
	const setB = new Set(b.tags);
	return a.tags.filter((t) => setB.has(t)).length;
};

/** Pick related catalog entries for internal linking (same level / tags first). */
export const pickRelatedCourses = (
	course: Course,
	catalog: readonly Course[],
	limit = 3
): Course[] => {
	const candidates = catalog.filter((c) => c.id !== course.id && !isCourseInactive(c));
	const ranked = [...candidates].sort((a, b) => {
		const levelA = a.level === course.level ? 2 : 0;
		const levelB = b.level === course.level ? 2 : 0;
		const kindA = (a.kind ?? 'course') === (course.kind ?? 'course') ? 1 : 0;
		const kindB = (b.kind ?? 'course') === (course.kind ?? 'course') ? 1 : 0;
		const scoreA = levelA + kindA + tagScore(course, a);
		const scoreB = levelB + kindB + tagScore(course, b);
		if (scoreB !== scoreA) return scoreB - scoreA;
		return (a.order ?? 0) - (b.order ?? 0);
	});
	return ranked.slice(0, limit);
};