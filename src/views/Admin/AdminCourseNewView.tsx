'use client';

import { Paths } from '@constants/paths';
import { createCourse } from '@services/courses';
import { Box, Button, Typography } from '@ui';
import { ArrowBack } from '@ui/icons';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminGate } from './AdminGate';
import { CourseForm } from './forms/CourseForm';

export const AdminCourseNewView = () => (
	<AdminGate>
		<Box sx={{ maxWidth: 960 }}>
			<Button component={NextLink} href={Paths.adminCourses} startIcon={<ArrowBack />} sx={{ mb: 2 }}>
				Powrót
			</Button>
			<Typography variant='h5' gutterBottom>
				Nowe szkolenie
			</Typography>
			<CourseFormInner />
		</Box>
	</AdminGate>
);

const CourseFormInner = () => {
	const router = useRouter();
	return (
		<CourseForm
			isAdmin
			submitLabel='UTWÓRZ'
			onSubmit={async (values) => {
				await createCourse(values);
				router.push(Paths.adminCourses);
			}}
		/>
	);
};
