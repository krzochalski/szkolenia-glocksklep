'use client';

import { Paths } from '@constants/paths';
import {
	getCourse,
	setCourseDateCanceled,
	setParticipantPaysByCash,
	toggleParticipantPaid,
	unenrollFromCourse,
} from '@services/courses';
import type { Participant } from '@/types/course';
import { fillPath } from '@/utils/paths';
import {
	Box,
	Button,
	CircularProgress,
	ConfirmDialog,
	FormControlLabel,
	Stack,
	Switch,
	Typography,
} from '@ui';
import { ArrowBack } from '@ui/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AdminGate } from './AdminGate';
import { CourseDateEditForm } from './forms/CourseDateEditForm';
import { removeCourseDate } from './forms/dateMutations';

type Props = {
	readonly courseId: string;
	readonly dateId: string;
};

export const AdminCourseDateDetailView = ({ courseId, dateId }: Props) => (
	<AdminGate>
		<DetailInner courseId={courseId} dateId={dateId} />
	</AdminGate>
);

const DetailInner = ({ courseId, dateId }: Props) => {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { data: course, isLoading } = useQuery({
		queryKey: ['course', courseId],
		queryFn: () => getCourse(courseId),
	});
	const [cancelOpen, setCancelOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [paidTarget, setPaidTarget] = useState<Participant | null>(null);
	const [removeTarget, setRemoveTarget] = useState<Participant | null>(null);

	const date = course?.dates?.find((d) => d.id === dateId);

	const invalidate = async () => {
		await queryClient.invalidateQueries({ queryKey: ['course', courseId] });
		await queryClient.invalidateQueries({ queryKey: ['courses'] });
	};

	const togglePaid = useMutation({
		mutationFn: (participantId: string) => toggleParticipantPaid(courseId, dateId, participantId),
		onSuccess: async () => {
			setPaidTarget(null);
			await invalidate();
		},
	});

	const toggleCash = useMutation({
		mutationFn: ({ id, paysByCash }: { id: string; paysByCash: boolean }) =>
			setParticipantPaysByCash(courseId, dateId, id, paysByCash),
		onSuccess: invalidate,
	});

	const toggleCanceled = useMutation({
		mutationFn: (canceled: boolean) => setCourseDateCanceled(courseId, dateId, canceled),
		onSuccess: async () => {
			setCancelOpen(false);
			await invalidate();
		},
	});

	const removeParticipant = useMutation({
		mutationFn: (participantId: string) => unenrollFromCourse(courseId, dateId, participantId),
		onSuccess: async () => {
			setRemoveTarget(null);
			await invalidate();
		},
	});

	const deleteDate = useMutation({
		mutationFn: async () => {
			if (!course) throw new Error('Brak kursu');
			await removeCourseDate(course, dateId);
		},
		onSuccess: async () => {
			await invalidate();
			router.push(fillPath(Paths.adminCourseAllDates, { courseId }));
		},
	});

	if (isLoading) return <CircularProgress />;
	if (!course || !date) return <Typography>Nie znaleziono terminu.</Typography>;

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
			<Button
				component={NextLink}
				href={fillPath(Paths.adminCourseAllDates, { courseId })}
				startIcon={<ArrowBack />}
				sx={{ alignSelf: 'flex-start' }}
			>
				Powrót
			</Button>
			<Typography variant='h5'>
				{course.name} — {date.date} {date.timeStart}
			</Typography>
			<Typography color='text.secondary'>
				{date.place?.name} · {date.instructor?.name}
			</Typography>

			<CourseDateEditForm courseId={courseId} courseDate={date} onSaved={invalidate} />

			<Stack direction='row' spacing={1}>
				{date.canceled ? (
					<Button
						variant='outlined'
						color='success'
						disabled={toggleCanceled.isPending}
						onClick={() => toggleCanceled.mutate(false)}
					>
						Przywróć termin
					</Button>
				) : (
					<Button
						variant='outlined'
						color='error'
						disabled={toggleCanceled.isPending}
						onClick={() => setCancelOpen(true)}
					>
						Odwołaj termin
					</Button>
				)}
				<Button
					variant='outlined'
					color='error'
					disabled={deleteDate.isPending}
					onClick={() => setDeleteOpen(true)}
				>
					Usuń termin
				</Button>
			</Stack>

			<Typography variant='h6'>
				Uczestnicy ({date.participants?.length ?? 0}/{date.slotsMax})
			</Typography>
			<Stack spacing={1.5}>
				{(date.participants ?? []).map((p) => (
					<Stack
						key={p.id}
						direction={{ xs: 'column', sm: 'row' }}
						spacing={1}
						sx={{
							borderBottom: 1,
							borderColor: 'divider',
							pb: 1,
							alignItems: { sm: 'center' },
						}}
					>
						<Box sx={{ flex: 1 }}>
							<Typography sx={{ fontWeight: 600 }}>{p.name}</Typography>
							<Typography variant='body2' color='text.secondary'>
								{p.email} {p.phoneNumber ? `· ${p.phoneNumber}` : ''}
							</Typography>
						</Box>
						<FormControlLabel
							control={
								<Switch checked={Boolean(p.paid)} onChange={() => setPaidTarget(p)} />
							}
							label='Opłacone'
						/>
						<FormControlLabel
							control={
								<Switch
									checked={Boolean(p.paysByCash)}
									onChange={(_, checked) =>
										toggleCash.mutate({ id: p.id, paysByCash: checked })
									}
								/>
							}
							label='Gotówka'
						/>
						<Button
							size='small'
							color='error'
							variant='outlined'
							disabled={removeParticipant.isPending}
							onClick={() => setRemoveTarget(p)}
						>
							Wypisz
						</Button>
					</Stack>
				))}
				{(date.participants?.length ?? 0) === 0 ? (
					<Typography color='text.secondary'>Brak uczestników.</Typography>
				) : null}
			</Stack>

			<ConfirmDialog
				open={cancelOpen}
				title='Potwierdź anulowanie terminu'
				cancelLabel='Wróć'
				confirmLabel='Anuluj termin'
				confirmColor='warning'
				loading={toggleCanceled.isPending}
				onCancel={() => setCancelOpen(false)}
				onConfirm={() => toggleCanceled.mutate(true)}
			>
				<Typography>
					Czy na pewno chcesz anulować termin <strong>{date.date}</strong>? Termin pozostanie
					widoczny w panelu admina, ale uczestnicy nie będą mogli się na niego zapisać.
					{(date.participants?.length ?? 0) > 0 ? (
						<Typography component='span' color='warning.main' sx={{ display: 'block', mt: 1 }}>
							Ten termin ma {date.participants?.length} zapisanych uczestników.
						</Typography>
					) : null}
				</Typography>
			</ConfirmDialog>

			<ConfirmDialog
				open={deleteOpen}
				title='Potwierdź usunięcie terminu'
				cancelLabel='Anuluj'
				confirmLabel='Usuń'
				loading={deleteDate.isPending}
				onCancel={() => setDeleteOpen(false)}
				onConfirm={() => deleteDate.mutate()}
			>
				<Typography>
					Czy na pewno chcesz usunąć ten termin?
					{(date.participants?.length ?? 0) > 0 ? (
						<Typography component='span' color='error' sx={{ display: 'block', mt: 1 }}>
							Ten termin ma {date.participants?.length} zapisanych uczestników!
						</Typography>
					) : null}
				</Typography>
			</ConfirmDialog>

			<ConfirmDialog
				open={Boolean(paidTarget)}
				title='Potwierdź zmianę płatności'
				cancelLabel='Anuluj'
				confirmLabel='Potwierdź'
				confirmColor='primary'
				loading={togglePaid.isPending}
				onCancel={() => setPaidTarget(null)}
				onConfirm={() => {
					if (paidTarget) togglePaid.mutate(paidTarget.id);
				}}
			>
				<Typography>
					{paidTarget?.paid
						? `Czy na pewno chcesz oznaczyć płatność uczestnika ${paidTarget.name} jako nieopłaconą?`
						: `Czy na pewno chcesz potwierdzić płatność uczestnika ${paidTarget?.name}?`}
				</Typography>
			</ConfirmDialog>

			<ConfirmDialog
				open={Boolean(removeTarget)}
				title='Potwierdź usunięcie uczestnika'
				cancelLabel='Anuluj'
				confirmLabel='Usuń'
				loading={removeParticipant.isPending}
				onCancel={() => setRemoveTarget(null)}
				onConfirm={() => {
					if (removeTarget) removeParticipant.mutate(removeTarget.id);
				}}
			>
				<Typography>
					Czy na pewno chcesz usunąć uczestnika <strong>{removeTarget?.name}</strong> z tego
					terminu? Tej operacji nie można cofnąć.
				</Typography>
			</ConfirmDialog>
		</Box>
	);
};
