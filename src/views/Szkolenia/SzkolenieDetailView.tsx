'use client';

import { COURSE_LEVEL_LABEL } from '@constants/courses';
import { getCourseDescriptionBySlug } from '@services/courseDescriptions';
import { getCourseBySlug, getCourses } from '@services/courses';
import { useQuery } from '@tanstack/react-query';
import { Box, CircularProgress, ContentSwap, Typography } from '@ui';
import { useMemo } from 'react';
import { CourseLayout, type CourseSchemaData } from '@/components/CourseLayout/CourseLayout';
import type { Course } from '@/types/course';
import type { CourseDescription } from '@/types/courseDescription';
import { isCourseInactive } from '@/utils/courseDates';
import { COURSE_KIND_LABEL, getCourseKind, resolvePrerequisiteNames } from '@/utils/courseKind';
import { resolveCourseHeroFrom } from '@/utils/courseImages';
import { mapDescriptionToSchema } from '@/utils/mapCourseDescription';

type Props = {
	readonly slug: string;
	readonly initialCourse?: Course | null;
	readonly initialDescription?: CourseDescription | null;
};

export const SzkolenieDetailView = ({ slug, initialCourse, initialDescription }: Props) => {
	const { data: course, isLoading: courseLoading } = useQuery({
		queryKey: ['course', slug],
		queryFn: () => getCourseBySlug(slug),
		...(initialCourse !== undefined ? { initialData: initialCourse } : {}),
	});

	const { data: description, isLoading: descriptionLoading } = useQuery({
		queryKey: ['courseDescription', slug],
		queryFn: () => getCourseDescriptionBySlug(slug),
		enabled: Boolean(slug),
		...(initialDescription !== undefined ? { initialData: initialDescription } : {}),
	});

	const { data: catalog = [] } = useQuery({
		queryKey: ['courses'],
		queryFn: getCourses,
		enabled: Boolean(course && getCourseKind(course) === 'practice'),
	});

	const isLoading = courseLoading || descriptionLoading;

	const kind = course ? getCourseKind(course) : 'course';
	const prerequisiteNames = useMemo(
		() => (course ? resolvePrerequisiteNames(course, catalog) : []),
		[catalog, course]
	);

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
				slotsMax: course.slotsMax,
				courseSlug: course.slug,
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
					kindLabel={kind === 'practice' ? COURSE_KIND_LABEL.practice : undefined}
					prerequisiteNames={prerequisiteNames}
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
					kindLabel={kind === 'practice' ? COURSE_KIND_LABEL.practice : undefined}
					prerequisiteNames={prerequisiteNames}
				/>
			)}
		</ContentSwap>
	);
};
