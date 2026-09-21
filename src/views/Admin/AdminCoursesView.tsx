'use client';

import { Paths } from '@constants/paths';
import { deleteCourse, getCourses } from '@services/courses';
import type { Course } from '@/types/course';
import { fillPath } from '@/utils/paths';
import {
	Box,
	Button,
	CircularProgress,
	ConfirmDialog,
	IconButton,
	Paper,
	Stack,
	Tooltip,
	Typography,
} from '@ui';
import { CalendarMonth, Delete, Edit } from '@ui/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import NextLink from 'next/link';
import { useState } from 'react';
import { AdminGate } from './AdminGate';

export const AdminCoursesView = () => (
	<AdminGate>
		<AdminCoursesInner />
	</AdminGate>
);

const AdminCoursesInner = () => {
	const queryClient = useQueryClient();
	const { data: courses = [], isLoading } = useQuery({
		queryKey: ['courses'],
		queryFn: getCourses,
	});
	const [toDelete, setToDelete] = useState<Course | null>(null);

	const remove = useMutation({
		mutationFn: deleteCourse,
		onSuccess: async () => {
			setToDelete(null);
			await queryClient.invalidateQueries({ queryKey: ['courses'] });
		},
	});

	if (isLoading) return <CircularProgress />;

	return (
		<Box>
			<Stack
				direction='row'
				sx={{ mb: 3, alignItems: 'center', justifyContent: 'space-between' }}
			>
				<Typography variant='h5'>Szkolenia</Typography>
				<Button component={NextLink} href={Paths.adminCourseNew} variant='contained'>
					Nowe szkolenie
				</Button>
			</Stack>
			<Stack spacing={1.5}>
				{courses.map((course) => (
					<Paper key={course.id} variant='outlined' sx={{ p: 2 }}>
						<Stack
							direction='row'
							spacing={1}
							sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}
						>
							<Box>
								<Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
									{course.name}
								</Typography>
								<Typography variant='body2' color='text.secondary'>
									/{course.slug} · {course.dates?.length ?? 0} terminów
								</Typography>
							</Box>
							<Stack direction='row' spacing={0.25}>
								<Tooltip title='Terminy'>
									<IconButton
										size='small'
										component={NextLink}
										href={fillPath(Paths.adminCourseAllDates, { courseId: course.id })}
										aria-label='Terminy'
									>
										<CalendarMonth fontSize='small' />
									</IconButton>
								</Tooltip>
								<Tooltip title='Edytuj'>
									<IconButton
										size='small'
										component={NextLink}
										href={fillPath(Paths.adminCourseEdit, { courseId: course.id })}
										aria-label='Edytuj szkolenie'
									>
										<Edit fontSize='small' />
									</IconButton>
								</Tooltip>
								<Tooltip title='Usuń'>
									<IconButton
										size='small'
										color='error'
										onClick={() => setToDelete(course)}
										aria-label='Usuń szkolenie'
									>
										<Delete fontSize='small' />
									</IconButton>
								</Tooltip>
							</Stack>
						</Stack>
					</Paper>
				))}
			</Stack>

			<ConfirmDialog
				open={Boolean(toDelete)}
				title='Potwierdź usunięcie'
				cancelLabel='Anuluj'
				confirmLabel='Usuń'
				loading={remove.isPending}
				onCancel={() => setToDelete(null)}
				onConfirm={() => {
					if (toDelete) remove.mutate(toDelete.id);
				}}
			>
				<Typography>
					Czy na pewno chcesz usunąć szkolenie <strong>{toDelete?.name}</strong>? Tej operacji nie
					można cofnąć.
				</Typography>
			</ConfirmDialog>
		</Box>
	);
};
