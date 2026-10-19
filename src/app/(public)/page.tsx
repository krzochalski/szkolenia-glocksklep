import { JsonLd } from '@components/JsonLd';
import { homeJsonLd } from '@seo/jsonLd';
import { staticPageMetadata } from '@seo/pageMetadata';
import { getCourses } from '@services/courses';
import { getHomepage } from '@services/homepage';
import { HomeView } from '@views/Home/HomeView';
import { serializeForClient } from '@/utils/serializeForClient';

export const metadata = staticPageMetadata('home');
export const revalidate = 300;

export default async function HomePage() {
	const [homepageResult, coursesResult] = await Promise.allSettled([
		getHomepage(),
		getCourses(),
	]);
	const initialHomepage =
		homepageResult.status === 'fulfilled'
			? serializeForClient(homepageResult.value)
			: undefined;
	const initialCourses =
		coursesResult.status === 'fulfilled' ? serializeForClient(coursesResult.value) : undefined;

	return (
		<>
			<JsonLd data={homeJsonLd()} />
			<HomeView initialHomepage={initialHomepage} initialCourses={initialCourses} />
		</>
	);
}
