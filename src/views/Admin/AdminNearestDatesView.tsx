'use client';

import { Paths } from '@constants/paths';
import { getCourses, setCourseDateCanceled } from '@services/courses';
import type { Course, CourseClass } from '@/types/course';
import { warsawToday } from '@/utils/adminDashboard';
import { getSlotsLeft, isFutureDate } from '@/utils/courseDates';
import { invalidateCourseQueries } from '@/utils/invalidateCourseQueries';
import {
	formatMinParticipantsMeta,
	isBelowMinStatus,
	resolveDateMinParticipants,
	resolveSessionStatus,
	signedUpCount,
} from '@/utils/minParticipants';
import { fillPath } from '@/utils/paths';
import {
	Box,
	Chip,
	CircularProgress,
	ConfirmDialog,
	ContentSwap,
	FormControlLabel,
	Paper,
	Stack,
	Stagger,
	StaggerItem,
	Switch,
	Typography,
} from '@ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { PlaceNameLink } from '@/components/PlaceNameLink';
import { AdminDateRowActions } from './AdminDateRowActions';
import {
	SESSION_STATUS_LABEL,
	sessionStatusChipColor,
} from './dashboard/sessionStatusLabel';
import { cloneCourseDate, removeCourseDate } from './forms/dateMutations';

type DateTarget = {
	course: Course;
	date: CourseClass;
};

export const AdminNearestDatesView = () => <NearestInner />;

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
	const [belowMinOnly, setBelowMinOnly] = useState(false);
	const today = warsawToday();

	const invalidate = () => invalidateCourseQueries(queryClient);

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

	const upcoming = useMemo(() => {
		const all = courses
			.flatMap((course) =>
				(course.dates ?? [])
					.filter((date) => isFutureDate(date.date))
					.map((date) => ({ course, date }))
			)
			.sort((a, b) => a.date.date.localeCompare(b.date.date));
		if (!belowMinOnly) return all;
		return all.filter(({ course, date }) =>
			isBelowMinStatus(resolveSessionStatus({ date, course, today }))
		);
	}, [courses, belowMinOnly, today]);
	const pending =
		clone.isPending || cancel.isPending || uncancel.isPending || remove.isPending;

	return (
		<ContentSwap state={isLoading ? 'loading' : 'content'}>
			{isLoading ? (
				<CircularProgress />
			) : (
		<Box>
			<Stack
				direction={{ xs: 'column', sm: 'row' }}
				sx={{ mb: 2, alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 1 }}
			>
				<Typography variant='h5'>Najbliższe terminy</Typography>
				<FormControlLabel
					control={
						<Switch
							checked={belowMinOnly}
							onChange={(_, v) => setBelowMinOnly(v)}
							size='small'
						/>
					}
					label='Poniżej minimum'
				/>
			</Stack>
			<Stagger sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
				{upcoming.map(({ course, date }) => {
					const signedUp = signedUpCount(date);
					const min = resolveDateMinParticipants(course, date);
					const status = resolveSessionStatus({ date, course, today });
					return (
						<StaggerItem key={`${course.id}-${date.id}`}>
							<Paper variant='outlined' sx={{ p: 2 }}>
								<Stack
									direction={{ xs: 'column', sm: 'row' }}
									spacing={1}
									sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
								>
									<Box>
										<Stack
											direction='row'
											spacing={1}
											sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 0.5 }}
										>
											<Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
												{course.name} — {date.date} {date.timeStart}
											</Typography>
											<Chip
												label={SESSION_STATUS_LABEL[status]}
												size='small'
												color={sessionStatusChipColor(status)}
											/>
										</Stack>
										<Typography variant='body2' color='text.secondary'>
											<PlaceNameLink place={date.place} /> · {getSlotsLeft(date)} wolnych /{' '}
											{date.slotsMax}
											{` · ${formatMinParticipantsMeta(signedUp, min)}`}
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
						</StaggerItem>
					);
				})}
				{upcoming.length === 0 ? (
					<Typography color='text.secondary'>
						{belowMinOnly
							? 'Brak nadchodzących terminów poniżej minimum.'
							: 'Brak nadchodzących terminów.'}
					</Typography>
				) : null}
			</Stagger>

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
			)}
		</ContentSwap>
	);
};
