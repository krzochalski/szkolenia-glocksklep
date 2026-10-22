'use client';

import { getCourseSlotsMax } from '@constants/courses';
import { Paths } from '@constants/paths';
import { getCourse, updateCourse } from '@services/courses';
import { getCourseKind } from '@/utils/courseKind';
import { fillPath } from '@/utils/paths';
import type { CourseFormValues } from '@/utils/schemas';
import { Box, Button, CircularProgress, ContentSwap, Typography } from '@ui';
import { ArrowBack } from '@ui/icons';
import { useQuery } from '@tanstack/react-query';
import NextLink from 'next/link';
import { CourseDetailsForm } from './forms/CourseDetailsForm';

type Props = {
	readonly courseId: string;
};

export const AdminCourseEditView = ({ courseId }: Props) => <EditInner courseId={courseId} />;

const EditInner = ({ courseId }: Props) => {
	const { data: course, isLoading } = useQuery({
		queryKey: ['course', courseId],
		queryFn: () => getCourse(courseId),
	});

	const initial: Partial<CourseFormValues> | null = course
		? {
				name: course.name,
				subtitle: course.subtitle ?? '',
				slug: course.slug,
				description: course.description,
				price: course.price,
				hours: course.hours,
				slotsMax: getCourseSlotsMax(course),
				level: course.level,
				kind: getCourseKind(course),
				prerequisiteCourseIds: course.prerequisiteCourseIds ?? [],
				tags: course.tags ?? [],
				thumbnail: course.thumbnail ?? '',
				hero: course.hero ?? '',
				inactive: course.inactive === true,
			}
		: null;

	return (
		<ContentSwap state={isLoading ? 'loading' : !course ? 'empty' : 'content'}>
			{isLoading ? (
				<CircularProgress />
			) : !course || !initial ? (
				<Typography>Nie znaleziono kursu.</Typography>
			) : (
		<Box sx={{ maxWidth: 960 }}>
			<Button
				component={NextLink}
				href={fillPath(Paths.adminCourseAllDates, { courseId })}
				startIcon={<ArrowBack />}
				sx={{ mb: 2 }}
			>
				Terminy
			</Button>
			<Typography variant='h5' gutterBottom>
				Edycja: {course.name}
			</Typography>
			<CourseDetailsForm
				defaultValues={initial}
				excludeCourseId={courseId}
				onSubmit={async (values) => {
					await updateCourse(courseId, values);
				}}
			/>
		</Box>
			)}
		</ContentSwap>
	);
};
