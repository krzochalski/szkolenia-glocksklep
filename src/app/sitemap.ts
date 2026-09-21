import { SITEMAP_STATIC_PATHS, SITE_ORIGIN } from '@constants/seo';
import { getCourses } from '@services/courses';
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const staticEntries: MetadataRoute.Sitemap = SITEMAP_STATIC_PATHS.map((path) => ({
		url: path === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${path}`,
	}));

	try {
		const courses = await getCourses();
		const courseEntries: MetadataRoute.Sitemap = courses.map((c) => ({
			url: `${SITE_ORIGIN}/szkolenia/${c.slug}`,
		}));
		return [...staticEntries, ...courseEntries];
	} catch {
		return staticEntries;
	}
}
