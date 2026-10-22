'use client';

import { Paths } from '@constants/paths';
import { createCourse } from '@services/courses';
import { useQueryClient } from '@tanstack/react-query';
import { Box, Button, Typography } from '@ui';
import { ArrowBack } from '@ui/icons';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { invalidateCourseQueries } from '@/utils/invalidateCourseQueries';
import { CourseForm } from './forms/CourseForm';

export const AdminCourseNewView = () => (
	<Box sx={{ width: '100%' }}>
		<Button component={NextLink} href={Paths.adminCourses} startIcon={<ArrowBack />} sx={{ mb: 2 }}>
			Powrót
		</Button>
		<Typography variant='h5' gutterBottom>
			Nowe szkolenie
		</Typography>
		<CourseFormInner />
	</Box>
);

const CourseFormInner = () => {
	const router = useRouter();
	const queryClient = useQueryClient();
	return (
		<CourseForm
			isAdmin
			submitLabel='UTWÓRZ'
			onSubmit={async (values) => {
				await createCourse(values);
				await invalidateCourseQueries(queryClient);
				router.push(Paths.adminCourses);
			}}
		/>
	);
};
