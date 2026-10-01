import type { Course } from '@/types/course';
import type { CourseDescription } from '@/types/courseDescription';
import { toOptimizedImagePath } from '@/utils/optimizedImagePath';

type ImageSource = Pick<Course, 'thumbnail' | 'hero'> &
	Pick<CourseDescription, 'thumbnail' | 'hero' | 'background'>;

const trimPath = (value: string | undefined): string | undefined => {
	const trimmed = value?.trim();
	return trimmed ? toOptimizedImagePath(trimmed) : undefined;
};

/** List-card image: course/description `thumbnail`, then legacy `background`. */
export const resolveCourseThumbnail = (source: ImageSource): string | undefined =>
	trimPath(source.thumbnail) ?? trimPath(source.background);

/** Detail-page hero: course/description `hero`, then legacy `background`. */
export const resolveCourseHero = (source: ImageSource): string | undefined =>
	trimPath(source.hero) ?? trimPath(source.background);

/** Prefer course paths, fall back to CMS description (incl. legacy `background`). */
export const resolveCourseThumbnailFrom = (
	course: Pick<Course, 'thumbnail'> | null | undefined,
	description: Pick<CourseDescription, 'thumbnail' | 'background'> | null | undefined
): string | undefined =>
	trimPath(course?.thumbnail) ??
	(description ? resolveCourseThumbnail(description) : undefined);

export const resolveCourseHeroFrom = (
	course: Pick<Course, 'hero'> | null | undefined,
	description: Pick<CourseDescription, 'hero' | 'background'> | null | undefined
): string | undefined =>
	trimPath(course?.hero) ?? (description ? resolveCourseHero(description) : undefined);
