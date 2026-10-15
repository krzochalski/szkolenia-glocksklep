'use client';

import { COURSE_LEVEL_LABEL } from '@constants/courses';
import { getCourseDescriptionBySlug } from '@services/courseDescriptions';
import { getCourseBySlug } from '@services/courses';
import { useQuery } from '@tanstack/react-query';
import { Box, CircularProgress, ContentSwap, Typography } from '@ui';
import { CourseLayout, type CourseSchemaData } from '@/components/CourseLayout/CourseLayout';
import { isCourseInactive } from '@/utils/courseDates';
import { resolveCourseHeroFrom } from '@/utils/courseImages';
import { mapDescriptionToSchema } from '@/utils/mapCourseDescription';

type Props = {
	readonly slug: string;
};

export const SzkolenieDetailView = ({ slug }: Props) => {
	const { data: course, isLoading: courseLoading } = useQuery({
		queryKey: ['course', slug],
		queryFn: () => getCourseBySlug(slug),
	});

	const { data: description, isLoading: descriptionLoading } = useQuery({
		queryKey: ['courseDescription', slug],
		queryFn: () => getCourseDescriptionBySlug(slug),
		enabled: Boolean(slug),
	});

	const isLoading = courseLoading || descriptionLoading;

	const swapState = isLoading
		? 'loading'
		: course && isCourseInactive(course)
			? 'inactive'
			: !course
				? 'notfound'
				: 'content';

	const courseMeta = course
		? {
				price: course.price,
				hours: course.hours,
				level: course.level,
				tags: course.tags,
			}
		: undefined;

	return (
		<ContentSwap state={swapState}>
			{isLoading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
					<CircularProgress color='primary' />
				</Box>
			) : course && isCourseInactive(course) ? (
				<Box sx={{ textAlign: 'center', py: 10 }}>
					<Typography variant='h4'>Szkolenie nie jest obecnie dostępne</Typography>
					<Typography color='text.secondary' sx={{ mt: 1 }}>
						Rejestracja na to szkolenie jest wyłączona.
					</Typography>
				</Box>
			) : !course ? (
				<Box sx={{ textAlign: 'center', py: 10 }}>
					<Typography variant='h4'>Szkolenie nie zostało znalezione</Typography>
				</Box>
			) : description ? (
				<CourseLayout
					data={mapDescriptionToSchema(description)}
					hero={resolveCourseHeroFrom(course, description)}
					courseMeta={courseMeta}
				/>
			) : (
				<CourseLayout
					data={
						{
							eyebrow: `Poziom ${(COURSE_LEVEL_LABEL[course.level] ?? course.level).toLowerCase()}`,
							headline: [course.name, ''],
							description: course.description,
							slug: course.slug,
						} satisfies CourseSchemaData
					}
					hero={resolveCourseHeroFrom(course, null)}
					courseMeta={courseMeta}
				/>
			)}
		</ContentSwap>
	);
};
