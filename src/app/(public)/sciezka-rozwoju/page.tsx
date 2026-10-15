import { CATALOG_REVALIDATE_SECONDS, staticPageMetadata } from '@seo/pageMetadata';
import { getCourses } from '@services/courses';
import { getDevelopmentPath } from '@services/developmentPath';
import { SciezkaRozwojuView } from '@views/SciezkaRozwoju/SciezkaRozwojuView';
import { serializeForClient } from '@/utils/serializeForClient';

export const metadata = staticPageMetadata('sciezkaRozwoju');
export const revalidate = CATALOG_REVALIDATE_SECONDS;

export default async function SciezkaRozwojuPage() {
	const [pathResult, coursesResult] = await Promise.allSettled([
		getDevelopmentPath(),
		getCourses(),
	]);
	const initialPath =
		pathResult.status === 'fulfilled' ? serializeForClient(pathResult.value) : undefined;
	const initialCourses =
		coursesResult.status === 'fulfilled' ? serializeForClient(coursesResult.value) : undefined;

	return <SciezkaRozwojuView initialPath={initialPath} initialCourses={initialCourses} />;
}
