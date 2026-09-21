'use client';

import { Paths } from '@constants/paths';
import { getCourses, setCourseDateCanceled } from '@services/courses';
import type { Course, CourseClass } from '@/types/course';
import { getSlotsLeft, isFutureDate } from '@/utils/courseDates';
import { fillPath } from '@/utils/paths';
import { Box, CircularProgress, ConfirmDialog, Paper, Stack, Typography } from '@ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { AdminDateRowActions } from './AdminDateRowActions';
import { AdminGate } from './AdminGate';
import { cloneCourseDate, removeCourseDate } from './forms/dateMutations';

type DateTarget = {
	course: Course;
	date: CourseClass;
};

export const AdminNearestDatesView = () => (
	<AdminGate>
		<NearestInner />
	</AdminGate>
);

const NearestInner = () => {
	const queryClient = useQueryClient();
	const { data: courses = [], isLoading } = useQuery({
		queryKey: ['courses'],
		queryFn: getCourses,
	});
	const [toDelete, setToDelete] = useState<DateTarget | null>(null);
	const [toCancel, setToCancel] = useState<DateTarget | null>(null);
	const [toClone, setToClone] = useState<DateTarget | null>(null);
	const [toUncancel, setToUncancel] = useState<DateTarget | null>(null);

	const invalidate = async () => {
		await queryClient.invalidateQueries({ queryKey: ['courses'] });
	};

	const clone = useMutation({
		mutationFn: () => {
			if (!toClone) throw new Error('Brak terminu');
			return cloneCourseDate(toClone.course, toClone.date);
		},
		onSuccess: async () => {
			setToClone(null);
			await invalidate();
		},
	});

	const cancel = useMutation({
		mutationFn: () => {
			if (!toCancel) throw new Error('Brak terminu');
			return setCourseDateCanceled(toCancel.course.id, toCancel.date.id, true);
		},
		onSuccess: async () => {
			setToCancel(null);
			await invalidate();
		},
	});

	const uncancel = useMutation({
		mutationFn: () => {
			if (!toUncancel) throw new Error('Brak terminu');
			return setCourseDateCanceled(toUncancel.course.id, toUncancel.date.id, false);
		},
		onSuccess: async () => {
			setToUncancel(null);
			await invalidate();
		},
	});

	const remove = useMutation({
		mutationFn: () => {
			if (!toDelete) throw new Error('Brak terminu');
			return removeCourseDate(toDelete.course, toDelete.date.id);
		},
		onSuccess: async () => {
			setToDelete(null);
			await invalidate();
		},
	});

	if (isLoading) return <CircularProgress />;

	const upcoming = courses
		.flatMap((course) =>
			(course.dates ?? [])
				.filter((date) => isFutureDate(date.date))
				.map((date) => ({ course, date }))
		)
		.sort((a, b) => a.date.date.localeCompare(b.date.date));
	const pending =
		clone.isPending || cancel.isPending || uncancel.isPending || remove.isPending;

	return (
		<Box>
			<Typography variant='h5' gutterBottom>
				Najbliższe terminy
			</Typography>
			<Stack spacing={1.5}>
				{upcoming.map(({ course, date }) => (
					<Paper key={`${course.id}-${date.id}`} variant='outlined' sx={{ p: 2 }}>
						<Stack
							direction={{ xs: 'column', sm: 'row' }}
							spacing={1}
							sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
						>
							<Box>
								<Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
									{course.name} — {date.date} {date.timeStart}
								</Typography>
								<Typography variant='body2' color='text.secondary'>
									{date.place?.name} · {getSlotsLeft(date)} wolnych / {date.slotsMax}
									{date.canceled ? ' · ODWOŁANY' : ''}
								</Typography>
							</Box>
							<AdminDateRowActions
								date={date}
								editHref={fillPath(Paths.adminCourseDates, {
									courseId: course.id,
									dateId: date.id,
								})}
								pending={pending}
								onClone={() => setToClone({ course, date })}
								onCancel={() => setToCancel({ course, date })}
								onUncancel={() => setToUncancel({ course, date })}
								onDelete={() => setToDelete({ course, date })}
							/>
						</Stack>
					</Paper>
				))}
				{upcoming.length === 0 ? (
					<Typography color='text.secondary'>Brak nadchodzących terminów.</Typography>
				) : null}
			</Stack>

			<ConfirmDialog
				open={Boolean(toClone)}
				title='Potwierdź klonowanie terminu'
				cancelLabel='Anuluj'
				confirmLabel='Klonuj'
				confirmColor='primary'
				loading={clone.isPending}
				onCancel={() => setToClone(null)}
				onConfirm={() => clone.mutate()}
			>
				<Typography>
					Czy na pewno chcesz sklonować termin <strong>{toClone?.date.date}</strong> (
					{toClone?.course.name})?
				</Typography>
			</ConfirmDialog>

			<ConfirmDialog
				open={Boolean(toUncancel)}
				title='Potwierdź przywrócenie terminu'
				cancelLabel='Anuluj'
				confirmLabel='Przywróć'
				confirmColor='primary'
				loading={uncancel.isPending}
				onCancel={() => setToUncancel(null)}
				onConfirm={() => uncancel.mutate()}
			>
				<Typography>
					Czy na pewno chcesz przywrócić termin <strong>{toUncancel?.date.date}</strong>?
				</Typography>
			</ConfirmDialog>

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
					Czy na pewno chcesz anulować termin <strong>{toCancel?.date.date}</strong>?
					{(toCancel?.date.participants?.length ?? 0) > 0 ? (
						<Typography component='span' color='warning.main' sx={{ display: 'block', mt: 1 }}>
							Ten termin ma {toCancel?.date.participants?.length} zapisanych uczestników.
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
					Czy na pewno chcesz usunąć termin <strong>{toDelete?.date.date}</strong>?
					{(toDelete?.date.participants?.length ?? 0) > 0 ? (
						<Typography component='span' color='error' sx={{ display: 'block', mt: 1 }}>
							Ten termin ma {toDelete?.date.participants?.length} zapisanych uczestników!
						</Typography>
					) : null}
				</Typography>
			</ConfirmDialog>
		</Box>
	);
};
