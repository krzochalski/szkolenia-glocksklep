'use client';

import { Paths } from '@constants/paths';
import { getCourse, setCourseDateCanceled } from '@services/courses';
import type { CourseClass } from '@/types/course';
import { isFutureDate } from '@/utils/courseDates';
import { fillPath } from '@/utils/paths';
import { Box, Button, CircularProgress, ConfirmDialog, Paper, Stack, Typography } from '@ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import NextLink from 'next/link';
import { useState } from 'react';
import { AdminDateRowActions } from './AdminDateRowActions';
import { AdminGate } from './AdminGate';
import { cloneCourseDate, removeCourseDate } from './forms/dateMutations';

type Props = {
	readonly courseId: string;
};

export const AdminCourseDatesView = ({ courseId }: Props) => (
	<AdminGate>
		<DatesInner courseId={courseId} />
	</AdminGate>
);

const DatesInner = ({ courseId }: Props) => {
	const queryClient = useQueryClient();
	const { data: course, isLoading } = useQuery({
		queryKey: ['course', courseId],
		queryFn: () => getCourse(courseId),
	});
	const [toDelete, setToDelete] = useState<CourseClass | null>(null);
	const [toCancel, setToCancel] = useState<CourseClass | null>(null);

	const invalidate = async () => {
		await queryClient.invalidateQueries({ queryKey: ['course', courseId] });
		await queryClient.invalidateQueries({ queryKey: ['courses'] });
	};

	const clone = useMutation({
		mutationFn: (date: CourseClass) => {
			if (!course) throw new Error('Brak kursu');
			return cloneCourseDate(course, date);
		},
		onSuccess: invalidate,
	});

	const cancel = useMutation({
		mutationFn: () => {
			if (!toCancel) throw new Error('Brak terminu');
			return setCourseDateCanceled(courseId, toCancel.id, true);
		},
		onSuccess: async () => {
			setToCancel(null);
			await invalidate();
		},
	});

	const uncancel = useMutation({
		mutationFn: (dateId: string) => setCourseDateCanceled(courseId, dateId, false),
		onSuccess: invalidate,
	});

	const remove = useMutation({
		mutationFn: () => {
			if (!course || !toDelete) throw new Error('Brak kursu');
			return removeCourseDate(course, toDelete.id);
		},
		onSuccess: async () => {
			setToDelete(null);
			await invalidate();
		},
	});

	if (isLoading) return <CircularProgress />;
	if (!course) return <Typography>Nie znaleziono kursu.</Typography>;

	const dates = course.dates ?? [];
	const futureDates = dates.filter((d) => isFutureDate(d.date));
	const pastDates = dates.filter((d) => !isFutureDate(d.date));
	const pending =
		clone.isPending || cancel.isPending || uncancel.isPending || remove.isPending;

	return (
		<Box>
			<Stack
				direction='row'
				sx={{ mb: 3, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}
			>
				<Typography variant='h5'>Terminy: {course.name}</Typography>
				<Stack direction='row' spacing={1}>
					<Button
						component={NextLink}
						href={fillPath(Paths.adminCourseEdit, { courseId })}
						variant='outlined'
					>
						Edytuj szkolenie
					</Button>
					<Button
						component={NextLink}
						href={fillPath(Paths.adminCourseDateNew, { courseId })}
						variant='contained'
					>
						Nowy termin
					</Button>
				</Stack>
			</Stack>

			{dates.length === 0 ? (
				<Typography color='text.secondary'>Brak terminów.</Typography>
			) : (
				<Stack spacing={3}>
					<DateGroup
						title='Nadchodzące'
						dates={futureDates}
						courseId={courseId}
						pending={pending}
						onClone={(d) => clone.mutate(d)}
						onCancel={setToCancel}
						onUncancel={(d) => uncancel.mutate(d.id)}
						onDelete={setToDelete}
					/>
					<DateGroup
						title='Przeszłe'
						dates={pastDates}
						courseId={courseId}
						pending={pending}
						onClone={(d) => clone.mutate(d)}
						onCancel={setToCancel}
						onUncancel={(d) => uncancel.mutate(d.id)}
						onDelete={setToDelete}
					/>
				</Stack>
			)}

			<ConfirmDialog
				open={Boolean(toCancel)}
				title='Potwierdź anulowanie terminu'
				cancelLabel='Wróć'
				confirmLabel='Anuluj termin'
				confirmColor='warning'
				loading={cancel.isPending}
				onCancel={() => setToCancel(null)}
				onConfirm={() => cancel.mutate()}
			>
				<Typography>
					Czy na pewno chcesz anulować termin <strong>{toCancel?.date}</strong>? Termin pozostanie
					widoczny w panelu admina, ale uczestnicy nie będą mogli się na niego zapisać.
					{(toCancel?.participants?.length ?? 0) > 0 ? (
						<Typography component='span' color='warning.main' sx={{ display: 'block', mt: 1 }}>
							Ten termin ma {toCancel?.participants?.length} zapisanych uczestników.
						</Typography>
					) : null}
				</Typography>
			</ConfirmDialog>

			<ConfirmDialog
				open={Boolean(toDelete)}
				title='Potwierdź usunięcie terminu'
				cancelLabel='Anuluj'
				confirmLabel='Usuń'
				loading={remove.isPending}
				onCancel={() => setToDelete(null)}
				onConfirm={() => remove.mutate()}
			>
				<Typography>
					Czy na pewno chcesz usunąć termin <strong>{toDelete?.date}</strong>?
					{(toDelete?.participants?.length ?? 0) > 0 ? (
						<Typography component='span' color='error' sx={{ display: 'block', mt: 1 }}>
							Ten termin ma {toDelete?.participants?.length} zapisanych uczestników!
						</Typography>
					) : null}
				</Typography>
			</ConfirmDialog>
		</Box>
	);
};

type DateGroupProps = {
	readonly title: string;
	readonly dates: CourseClass[];
	readonly courseId: string;
	readonly pending: boolean;
	readonly onClone: (date: CourseClass) => void;
	readonly onCancel: (date: CourseClass) => void;
	readonly onUncancel: (date: CourseClass) => void;
	readonly onDelete: (date: CourseClass) => void;
};

const DateGroup = ({
	title,
	dates,
	courseId,
	pending,
	onClone,
	onCancel,
	onUncancel,
	onDelete,
}: DateGroupProps) => {
	if (dates.length === 0) return null;
	return (
		<Box>
			<Typography variant='caption' sx={{ fontWeight: 700, letterSpacing: '0.08em' }}>
				{title}
			</Typography>
			<Stack spacing={1.5} sx={{ mt: 1 }}>
				{dates.map((date) => (
					<Paper key={date.id} variant='outlined' sx={{ p: 2 }}>
						<Stack
							direction={{ xs: 'column', sm: 'row' }}
							spacing={1}
							sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
						>
							<Box>
								<Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
									{date.date} · {date.timeStart}
								</Typography>
								<Typography variant='body2' color='text.secondary'>
									{date.place?.name} · {date.participants?.length ?? 0}/{date.slotsMax}
									{date.canceled ? ' · ODWOŁANY' : ''}
								</Typography>
							</Box>
							<AdminDateRowActions
								date={date}
								editHref={fillPath(Paths.adminCourseDates, { courseId, dateId: date.id })}
								pending={pending}
								onClone={() => onClone(date)}
								onCancel={() => onCancel(date)}
								onUncancel={() => onUncancel(date)}
								onDelete={() => onDelete(date)}
							/>
						</Stack>
					</Paper>
				))}
			</Stack>
		</Box>
	);
};
