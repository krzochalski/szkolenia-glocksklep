import { JsonLd } from '@components/JsonLd';
import { Paths } from '@constants/paths';
import { courseJsonLd } from '@seo/jsonLd';
import { courseItemMetadata, staticPageMetadata } from '@seo/pageMetadata';
import { itemDescription, itemTitle } from '@seo/meta';
import { getCourseBySlug } from '@services/courses';
import { SzkolenieDetailView } from '@views/Szkolenia/SzkolenieDetailView';

export const revalidate = 300;

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
	let jsonLd = null;
	try {
		const course = await getCourseBySlug(slug);
		if (course) {
			jsonLd = courseJsonLd({
				name: course.name,
				slug: course.slug,
				description: course.description,
				price: course.price,
			});
		}
	} catch {
		jsonLd = null;
	}

	return (
		<>
			{jsonLd ? <JsonLd data={jsonLd} /> : null}
			<SzkolenieDetailView slug={slug} />
		</>
	);
}
