import { Paths } from '@constants/paths';
import { SITE_ORIGIN } from '@constants/seo';
import type { Course } from '@/types/course';
import { getFutureCourseDates, isCourseInactive } from '@/utils/courseDates';
import { lastmodDate } from './meta';

export type SitemapEntry = {
	readonly url: string;
	readonly lastModified?: string;
};

export const courseSitemapEntries = (courses: readonly Course[]): SitemapEntry[] => {
	const entries: SitemapEntry[] = [];
	for (const course of courses) {
		if (isCourseInactive(course)) continue;
		const courseUrl = `${SITE_ORIGIN}${Paths.courses}/${course.slug}`;
		entries.push({ url: courseUrl });

		for (const { course: c, date } of getFutureCourseDates([course])) {
			if (c.slug !== course.slug) continue;
			entries.push({
				url: `${courseUrl}?termin=${encodeURIComponent(date.id)}`,
				lastModified: lastmodDate(date.date),
			});
		}
	}
	return entries;
};