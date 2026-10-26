'use client';

import { Paths } from '@constants/paths';
import { getCourse, setCourseDateCanceled } from '@services/courses';
import type { Course, CourseClass } from '@/types/course';
import { warsawToday } from '@/utils/adminDashboard';
import { isFutureDate } from '@/utils/courseDates';
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
	Button,
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
import NextLink from 'next/link';
import { useMemo, useState } from 'react';
import { PlaceNameLink } from '@/components/PlaceNameLink';
import { AdminDateRowActions } from './AdminDateRowActions';
import {
	SESSION_STATUS_LABEL,
	sessionStatusChipColor,
} from './dashboard/sessionStatusLabel';
import { cloneCourseDate, removeCourseDate } from './forms/dateMutations';

type Props = {
	readonly courseId: string;
};

export const AdminCourseDatesView = ({ courseId }: Props) => <DatesInner courseId={courseId} />;

const DatesInner = ({ courseId }: Props) => {
	const queryClient = useQueryClient();
	const { data: course, isLoading } = useQuery({
		queryKey: ['course', courseId],
		queryFn: () => getCourse(courseId),
	});
	const [toDelete, setToDelete] = useState<CourseClass | null>(null);
	const [toCancel, setToCancel] = useState<CourseClass | null>(null);
	const [toClone, setToClone] = useState<CourseClass | null>(null);
	const [toUncancel, setToUncancel] = useState<CourseClass | null>(null);
	const [belowMinOnly, setBelowMinOnly] = useState(false);
	const today = warsawToday();

	const invalidate = () => invalidateCourseQueries(queryClient);

	const clone = useMutation({
		mutationFn: () => {
			if (!course || !toClone) throw new Error('Brak kursu');
			return cloneCourseDate(course, toClone);
		},
		onSuccess: async () => {
			setToClone(null);
			await invalidate();
		},
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
		mutationFn: () => {
			if (!toUncancel) throw new Error('Brak terminu');
			return setCourseDateCanceled(courseId, toUncancel.id, false);
		},
		onSuccess: async () => {
			setToUncancel(null);
			await invalidate();
		},
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

	const dates = course?.dates ?? [];
	const futureDates = useMemo(() => {
		const future = dates.filter((d) => isFutureDate(d.date));
		if (!belowMinOnly || !course) return future;
		return future.filter((d) =>
			isBelowMinStatus(resolveSessionStatus({ date: d, course, today }))
		);
	}, [dates, belowMinOnly, course, today]);
	const pastDates = dates.filter((d) => !isFutureDate(d.date));
	const pending =
		clone.isPending || cancel.isPending || uncancel.isPending || remove.isPending;

	return (
		<ContentSwap state={isLoading ? 'loading' : !course ? 'empty' : 'content'}>
			{isLoading ? (
				<CircularProgress />
			) : !course ? (
				<Typography>Nie znaleziono kursu.</Typography>
			) : (
		<Box>
			<Stack
				direction='row'
				sx={{ mb: 3, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}
			>
				<Typography variant='h5'>Terminy: {course.name}</Typography>
				<Stack direction='row' spacing={1} sx={{ flexWrap: 'wrap' }}>
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
						course={course}
						courseId={courseId}
						today={today}
						pending={pending}
						emptyFilterMessage={
							belowMinOnly ? 'Brak nadchodzących terminów poniżej minimum.' : undefined
						}
						onClone={setToClone}
						onCancel={setToCancel}
						onUncancel={setToUncancel}
						onDelete={setToDelete}
					/>
					{belowMinOnly ? null : (
						<DateGroup
							title='Przeszłe'
							dates={pastDates}
							course={course}
							courseId={courseId}
							today={today}
							pending={pending}
							onClone={setToClone}
							onCancel={setToCancel}
							onUncancel={setToUncancel}
							onDelete={setToDelete}
						/>
					)}
				</Stack>
			)}

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
					Czy na pewno chcesz sklonować termin <strong>{toClone?.date}</strong>?
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
					Czy na pewno chcesz przywrócić termin <strong>{toUncancel?.date}</strong>?
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
			)}
		</ContentSwap>
	);
};

type DateGroupProps = {
	readonly title: string;
	readonly dates: CourseClass[];
	readonly course: Course;
	readonly courseId: string;
	readonly today: string;
	readonly pending: boolean;
	readonly emptyFilterMessage?: string;
	readonly onClone: (date: CourseClass) => void;
	readonly onCancel: (date: CourseClass) => void;
	readonly onUncancel: (date: CourseClass) => void;
	readonly onDelete: (date: CourseClass) => void;
};

const DateGroup = ({
	title,
	dates,
	course,
	courseId,
	today,
	pending,
	emptyFilterMessage,
	onClone,
	onCancel,
	onUncancel,
	onDelete,
}: DateGroupProps) => {
	if (dates.length === 0) {
		if (!emptyFilterMessage) return null;
		return (
			<Box>
				<Typography variant='caption' sx={{ fontWeight: 700, letterSpacing: '0.08em' }}>
					{title}
				</Typography>
				<Typography color='text.secondary' sx={{ mt: 1 }}>
					{emptyFilterMessage}
				</Typography>
			</Box>
		);
	}
	return (
		<Box>
			<Typography variant='caption' sx={{ fontWeight: 700, letterSpacing: '0.08em' }}>
				{title}
			</Typography>
			<Stagger sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
				{dates.map((date) => {
					const signedUp = signedUpCount(date);
					const min = resolveDateMinParticipants(course, date);
					const status = resolveSessionStatus({ date, course, today });
					return (
						<StaggerItem key={date.id}>
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
												{date.date} · {date.timeStart}
											</Typography>
											<Chip
												label={SESSION_STATUS_LABEL[status]}
												size='small'
												color={sessionStatusChipColor(status)}
											/>
										</Stack>
										<Typography variant='body2' color='text.secondary'>
											<PlaceNameLink place={date.place} /> · {signedUp}/{date.slotsMax}
											{` · ${formatMinParticipantsMeta(signedUp, min)}`}
										</Typography>
									</Box>
									<AdminDateRowActions
										date={date}
										editHref={fillPath(Paths.adminCourseDates, {
											courseId,
											dateId: date.id,
										})}
										pending={pending}
										onClone={() => onClone(date)}
										onCancel={() => onCancel(date)}
										onUncancel={() => onUncancel(date)}
										onDelete={() => onDelete(date)}
									/>
								</Stack>
							</Paper>
						</StaggerItem>
					);
				})}
			</Stagger>
		</Box>
	);
};
