'use client';

import { CourseLayout, type CourseSchemaData } from '@/components/CourseLayout/CourseLayout';
import { COURSE_LEVEL_LABEL } from '@constants/courses';
import { getCourseBySlug } from '@services/courses';
import { getCourseDescriptionBySlug } from '@services/courseDescriptions';
import { mapDescriptionToSchema } from '@/utils/mapCourseDescription';
import { Box, CircularProgress, Typography } from '@ui';
import { useQuery } from '@tanstack/react-query';

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

	if (courseLoading || descriptionLoading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
				<CircularProgress color='primary' />
			</Box>
		);
	}

	if (description) {
		return (
			<CourseLayout data={mapDescriptionToSchema(description)} background={description.background} />
		);
	}

	if (!course) {
		return (
			<Box sx={{ textAlign: 'center', py: 10 }}>
				<Typography variant='h4'>Szkolenie nie zostało znalezione</Typography>
			</Box>
		);
	}

	const levelLabel = COURSE_LEVEL_LABEL[course.level] ?? course.level;
	const data: CourseSchemaData = {
		eyebrow: `Poziom ${levelLabel.toLowerCase()}`,
		headline: [course.name, ''],
		description: course.description,
		slug: course.slug,
	};

	return <CourseLayout data={data} />;
};
