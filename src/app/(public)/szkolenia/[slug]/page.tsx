import { JsonLd } from '@components/JsonLd';
import { Paths } from '@constants/paths';
import { courseJsonLd } from '@seo/jsonLd';
import { itemDescription, itemTitle } from '@seo/meta';
import {
	CATALOG_REVALIDATE_SECONDS,
	courseItemMetadata,
	staticPageMetadata,
} from '@seo/pageMetadata';
import { getCourseDescriptionBySlug } from '@services/courseDescriptions';
import { getCourseBySlug } from '@services/courses';
import { SzkolenieDetailView } from '@views/Szkolenia/SzkolenieDetailView';
import { serializeForClient } from '@/utils/serializeForClient';

export const revalidate = CATALOG_REVALIDATE_SECONDS;

type Props = {
	params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
	const { slug } = await params;
	try {
		const course = await getCourseBySlug(slug);
		if (!course) return staticPageMetadata('notFound', `${Paths.courses}/${slug}`);
		return courseItemMetadata({
			title: itemTitle(course.name),
			description: itemDescription(course.description),
			path: `${Paths.courses}/${course.slug}`,
		});
	} catch {
		return staticPageMetadata('courses');
	}
}

export default async function SzkoleniePage({ params }: Props) {
	const { slug } = await params;
	const [courseResult, descriptionResult] = await Promise.allSettled([
		getCourseBySlug(slug),
		getCourseDescriptionBySlug(slug),
	]);
	const course = courseResult.status === 'fulfilled' ? courseResult.value : null;
	const initialCourse =
		courseResult.status === 'fulfilled' ? serializeForClient(courseResult.value) : undefined;
	const initialDescription =
		descriptionResult.status === 'fulfilled'
			? serializeForClient(descriptionResult.value)
			: undefined;
	const jsonLd = course
		? courseJsonLd({
				name: course.name,
				slug: course.slug,
				description: course.description,
				price: course.price,
			})
		: null;

	return (
		<>
			{jsonLd ? <JsonLd data={jsonLd} /> : null}
			<SzkolenieDetailView
				slug={slug}
				initialCourse={initialCourse}
				initialDescription={initialDescription}
			/>
		</>
	);
}
