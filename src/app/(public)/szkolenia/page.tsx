import { JsonLd } from '@components/JsonLd';
import { STATIC_SEO } from '@constants/seo';
import { collectionJsonLd } from '@seo/jsonLd';
import { staticPageMetadata } from '@seo/pageMetadata';
import { getCourseDescriptions } from '@services/courseDescriptions';
import { getCourses } from '@services/courses';
import { SzkoleniaListView } from '@views/Szkolenia/SzkoleniaListView';
import { serializeForClient } from '@/utils/serializeForClient';

export const metadata = staticPageMetadata('courses');
export const revalidate = 300;

export default async function SzkoleniaPage() {
	const [coursesResult, descriptionsResult] = await Promise.allSettled([
		getCourses(),
		getCourseDescriptions(),
	]);
	const initialCourses =
		coursesResult.status === 'fulfilled' ? serializeForClient(coursesResult.value) : undefined;
	const initialDescriptions =
		descriptionsResult.status === 'fulfilled'
			? serializeForClient(descriptionsResult.value)
			: undefined;

	return (
		<>
			<JsonLd
				data={collectionJsonLd({
					name: STATIC_SEO.courses.title,
					path: STATIC_SEO.courses.path,
					description: STATIC_SEO.courses.description,
				})}
			/>
			<SzkoleniaListView
				initialCourses={initialCourses}
				initialDescriptions={initialDescriptions}
			/>
		</>
	);
}
