import { JsonLd } from '@components/JsonLd';
import { BreadcrumbsNav } from '@components/seo/BreadcrumbsNav';
import { CourseDetailSeoSections } from '@components/seo/CourseDetailSeoSections';
import { Paths } from '@constants/paths';
import { buildCourseFaqItems } from '@seo/courseFaq';
import { coursePageJsonLd } from '@seo/jsonLd';
import { courseSeoDescription } from '@seo/courseMeta';
import { itemTitle } from '@seo/meta';
import { courseItemMetadata, staticPageMetadata } from '@seo/pageMetadata';
import { getCourseDescriptionBySlug } from '@services/courseDescriptions';
import { getCourseBySlug, getCourses } from '@services/courses';
import { getFaqItems } from '@services/faq';
import { SzkolenieDetailView } from '@views/Szkolenia/SzkolenieDetailView';
import { fillPath } from '@/utils/paths';
import { resolveCourseHeroFrom } from '@/utils/courseImages';
import { serializeForClient } from '@/utils/serializeForClient';

export const revalidate = 60;

type Props = {
	params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
	const { slug } = await params;
	try {
		const course = await getCourseBySlug(slug);
		if (!course) return staticPageMetadata('notFound', `${Paths.courses}/${slug}`);
		const description = await getCourseDescriptionBySlug(slug).catch(() => null);
		const image = resolveCourseHeroFrom(course, description);
		return courseItemMetadata({
			title: itemTitle(course.name),
			description: courseSeoDescription(course),
			path: `${Paths.courses}/${course.slug}`,
			image,
		});
	} catch {
		return staticPageMetadata('courses');
	}
}

export default async function SzkoleniePage({ params }: Props) {
	const { slug } = await params;
	const [courseResult, descriptionResult, catalogResult, faqResult] = await Promise.allSettled([
		getCourseBySlug(slug),
		getCourseDescriptionBySlug(slug),
		getCourses(),
		getFaqItems(),
	]);
	const course = courseResult.status === 'fulfilled' ? courseResult.value : null;
	const catalog = catalogResult.status === 'fulfilled' ? catalogResult.value : [];
	const faqItems = faqResult.status === 'fulfilled' ? faqResult.value : [];

	const initialCourse =
		courseResult.status === 'fulfilled' ? serializeForClient(courseResult.value) : undefined;
	const initialDescription =
		descriptionResult.status === 'fulfilled'
			? serializeForClient(descriptionResult.value)
			: undefined;

	const jsonLd =
		course != null
			? coursePageJsonLd({
					course,
					faq: buildCourseFaqItems(course, faqItems),
				})
			: null;

	const breadcrumbs =
		course != null
			? [
					{ name: 'Główna', path: '/' },
					{ name: 'Szkolenia', path: Paths.courses },
					{
						name: course.name,
						path: fillPath(Paths.coursePage, { slug: course.slug }),
					},
				]
			: null;

	return (
		<>
			{jsonLd ? <JsonLd data={jsonLd} /> : null}
			{breadcrumbs ? <BreadcrumbsNav items={breadcrumbs} /> : null}
			<SzkolenieDetailView
				slug={slug}
				initialCourse={initialCourse}
				initialDescription={initialDescription}
			/>
			{course && !course.inactive ? (
				<CourseDetailSeoSections course={course} catalog={catalog} faqItems={faqItems} />
			) : null}
		</>
	);
}