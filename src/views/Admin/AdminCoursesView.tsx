'use client';

import { COURSE_LEVEL_LABEL } from '@constants/courses';
import { Paths } from '@constants/paths';
import { deleteCourse, getCourses } from '@services/courses';
import type { Course } from '@/types/course';
import { isFutureDate, isCourseClassCanceled } from '@/utils/courseDates';
import { fillPath } from '@/utils/paths';
import { formatCoursePrice } from '@/utils/pricing';
import {
	Box,
	Button,
	Chip,
	CircularProgress,
	ConfirmDialog,
	IconButton,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
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

const getUpcomingDates = (course: Course) =>
	(course.dates ?? [])
		.filter((d) => isFutureDate(d.date) && !isCourseClassCanceled(d))
		.sort((a, b) => a.date.localeCompare(b.date));

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

	const sorted = [...courses].sort((a, b) => a.name.localeCompare(b.name, 'pl'));

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

			{sorted.length === 0 ? (
				<Typography color='text.secondary'>Brak szkoleń.</Typography>
			) : (
				<TableContainer sx={{ overflowX: 'auto' }}>
					<Table size='small' stickyHeader>
						<TableHead>
							<TableRow>
								<TableCell>Nazwa</TableCell>
								<TableCell>Slug</TableCell>
								<TableCell>Poziom</TableCell>
								<TableCell align='right'>Cena netto</TableCell>
								<TableCell align='right'>Czas</TableCell>
								<TableCell>Tagi</TableCell>
								<TableCell>Terminy</TableCell>
								<TableCell align='right'>Akcje</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{sorted.map((course) => {
								const upcoming = getUpcomingDates(course);
								const next = upcoming[0];
								const totalDates = course.dates?.length ?? 0;
								const levelLabel = COURSE_LEVEL_LABEL[course.level] ?? course.level;

								return (
									<TableRow key={course.id} hover>
										<TableCell>
											<Typography variant='body2' sx={{ fontWeight: 600 }}>
												{course.name}
											</Typography>
										</TableCell>
										<TableCell>
											<Typography
												variant='body2'
												color='text.secondary'
												sx={{ fontFamily: 'monospace' }}
											>
												/{course.slug}
											</Typography>
										</TableCell>
										<TableCell>
											<Typography variant='body2'>{levelLabel}</Typography>
										</TableCell>
										<TableCell align='right'>
											<Typography variant='body2'>
												{formatCoursePrice(course.price, 'netto')}
											</Typography>
										</TableCell>
										<TableCell align='right'>
											<Typography variant='body2'>{course.hours} h</Typography>
										</TableCell>
										<TableCell>
											{course.tags?.length ? (
												<Stack direction='row' spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
													{course.tags.map((tag) => (
														<Chip key={tag} label={tag} size='small' variant='outlined' />
													))}
												</Stack>
											) : (
												<Typography variant='body2' color='text.secondary'>
													—
												</Typography>
											)}
										</TableCell>
										<TableCell>
											<Typography variant='body2'>
												{upcoming.length} nadchodzących / {totalDates} łącznie
											</Typography>
											{next ? (
												<Typography variant='caption' color='text.secondary'>
													Następny: {next.date} {next.timeStart}
													{next.place?.name ? ` · ${next.place.name}` : ''}
												</Typography>
											) : (
												<Typography variant='caption' color='text.secondary'>
													Brak nadchodzących
												</Typography>
											)}
										</TableCell>
										<TableCell align='right'>
											<Stack direction='row' spacing={0.25} sx={{ justifyContent: 'flex-end' }}>
												<Tooltip title='Terminy'>
													<IconButton
														size='small'
														component={NextLink}
														href={fillPath(Paths.adminCourseAllDates, {
															courseId: course.id,
														})}
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
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</TableContainer>
			)}

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
