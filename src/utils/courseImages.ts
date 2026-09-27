import type { CourseDescription } from '@/types/courseDescription';
import { toOptimizedImagePath } from '@/utils/optimizedImagePath';

const trimPath = (value: string | undefined): string | undefined => {
	const trimmed = value?.trim();
	return trimmed ? toOptimizedImagePath(trimmed) : undefined;
};

/** List-card image: prefer `thumbnail`, fall back to legacy `background`. */
export const resolveCourseThumbnail = (
	description: Pick<CourseDescription, 'thumbnail' | 'background'>
): string | undefined => trimPath(description.thumbnail) ?? trimPath(description.background);

/** Detail-page hero: prefer `hero`, fall back to legacy `background`. */
export const resolveCourseHero = (
	description: Pick<CourseDescription, 'hero' | 'background'>
): string | undefined => trimPath(description.hero) ?? trimPath(description.background);
