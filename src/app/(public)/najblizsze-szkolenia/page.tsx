import { JsonLd } from '@components/JsonLd';
import { STATIC_SEO } from '@constants/seo';
import { collectionJsonLd, upcomingEventsJsonLd } from '@seo/jsonLd';
import { staticPageMetadata } from '@seo/pageMetadata';
import { getCourses } from '@services/courses';
import { NajblizszeSzkoleniaView } from '@views/Szkolenia/NajblizszeSzkoleniaView';
import { serializeForClient } from '@/utils/serializeForClient';

export const metadata = staticPageMetadata('nearest');
export const revalidate = 60;

export default async function NajblizszePage() {
	const coursesResult = await Promise.allSettled([getCourses()]);
	const courses =
		coursesResult[0].status === 'fulfilled' ? coursesResult[0].value : [];
	const initialCourses =
		coursesResult[0].status === 'fulfilled'
			? serializeForClient(coursesResult[0].value)
			: undefined;

	return (
		<>
			<JsonLd
				data={[
					collectionJsonLd({
						name: STATIC_SEO.nearest.title,
						path: STATIC_SEO.nearest.path,
						description: STATIC_SEO.nearest.description,
					}),
					upcomingEventsJsonLd(courses),
				]}
			/>
			<NajblizszeSzkoleniaView initialCourses={initialCourses} />
		</>
	);
}
