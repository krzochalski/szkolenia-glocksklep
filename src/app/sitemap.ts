import { SITEMAP_STATIC_PATHS, SITE_ORIGIN } from '@constants/seo';
import { courseSitemapEntries } from '@seo/sitemapBuilder';
import { getCourses } from '@services/courses';
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const staticEntries: MetadataRoute.Sitemap = SITEMAP_STATIC_PATHS.map((path) => ({
		url: path === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${path}`,
	}));

	try {
		const courses = await getCourses();
		const dynamicEntries: MetadataRoute.Sitemap = courseSitemapEntries(courses).map((entry) => ({
			url: entry.url,
			...(entry.lastModified ? { lastModified: entry.lastModified } : {}),
		}));
		return [...staticEntries, ...dynamicEntries];
	} catch {
		return staticEntries;
	}
}