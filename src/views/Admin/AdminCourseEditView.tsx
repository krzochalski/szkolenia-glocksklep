'use client';

import { Paths } from '@constants/paths';
import { getCourse, updateCourse } from '@services/courses';
import { fillPath } from '@/utils/paths';
import type { CourseFormValues } from '@/utils/schemas';
import { Box, Button, CircularProgress, Typography } from '@ui';
import { ArrowBack } from '@ui/icons';
import { useQuery } from '@tanstack/react-query';
import NextLink from 'next/link';
import { AdminGate } from './AdminGate';
import { CourseDetailsForm } from './forms/CourseDetailsForm';

type Props = {
	readonly courseId: string;
};

export const AdminCourseEditView = ({ courseId }: Props) => (
	<AdminGate>
		<EditInner courseId={courseId} />
	</AdminGate>
);

const EditInner = ({ courseId }: Props) => {
	const { data: course, isLoading } = useQuery({
		queryKey: ['course', courseId],
		queryFn: () => getCourse(courseId),
	});

	if (isLoading) return <CircularProgress />;
	if (!course) return <Typography>Nie znaleziono kursu.</Typography>;

	const initial: Partial<CourseFormValues> = {
		name: course.name,
		slug: course.slug,
		description: course.description,
		price: course.price,
		hours: course.hours,
		level: course.level,
		tags: course.tags ?? [],
	};

	return (
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
				onSubmit={async (values) => {
					await updateCourse(courseId, values);
				}}
			/>
		</Box>
	);
};
