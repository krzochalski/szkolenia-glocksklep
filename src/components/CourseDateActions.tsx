'use client';

import { Paths } from '@constants/paths';
import { useAuthUser } from '@hooks';
import { enrollInCourse } from '@services/courses';
import {
	addToWaitingList,
	getUserWaitingListEntries,
	removeFromWaitingList,
} from '@services/courseWaitingList';
import { getUserProfile } from '@services/users';
import type { Course, CourseClass } from '@/types/course';
import { getSlotsLeft } from '@/utils/courseDates';
import { Button, ConfirmDialog, Stack, Typography } from '@ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import NextLink from 'next/link';
import { useState } from 'react';

type Props = {
	readonly course: Course;
	readonly date: CourseClass;
	readonly size?: 'small' | 'medium' | 'large';
	readonly onError?: (message: string) => void;
	readonly onSuccess?: () => void;
};

type ConfirmAction = 'enroll' | 'joinWaitlist' | 'leaveWaitlist';

export const CourseDateActions = ({
	course,
	date,
	size = 'medium',
	onError,
	onSuccess,
}: Props) => {
	const user = useAuthUser();
	const queryClient = useQueryClient();
	const slots = getSlotsLeft(date);
	const enrolled = date.participants?.some((p) => p.id === user?.uid) ?? false;
	const uid = user?.uid;
	const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

	const { data: waitingEntries = [] } = useQuery({
		queryKey: ['waitingList', uid],
		queryFn: () => {
			if (!uid) return Promise.resolve([]);
			return getUserWaitingListEntries(uid);
		},
		enabled: Boolean(uid),
	});

	const onWaitingList = waitingEntries.some((entry) => entry.courseId === course.id);

	const resolveParticipant = async () => {
		if (!user) throw new Error('Zaloguj się, aby zapisać się na szkolenie.');
		const profile = await getUserProfile();
		return {
			id: user.uid,
			name: profile?.displayName || user.displayName || user.email || 'Uczestnik',
			email: profile?.email || user.email || '',
			phoneNumber: profile?.phoneNumber ?? user.phoneNumber ?? undefined,
		};
	};

	const enroll = useMutation({
		mutationFn: async () => {
			const participant = await resolveParticipant();
			await enrollInCourse(course.id, date.id, participant);
		},
		onSuccess: async () => {
			setConfirmAction(null);
			onSuccess?.();
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ['courses'] }),
				queryClient.invalidateQueries({ queryKey: ['course'] }),
				queryClient.invalidateQueries({ queryKey: ['waitingList', uid] }),
			]);
		},
		onError: (err: Error) => onError?.(err.message),
	});

	const joinWaitlist = useMutation({
		mutationFn: async () => {
			const participant = await resolveParticipant();
			await addToWaitingList({
				courseId: course.id,
				courseName: course.name,
				courseSlug: course.slug,
				userId: participant.id,
				userName: participant.name,
				email: participant.email,
				phoneNumber: participant.phoneNumber,
			});
		},
		onSuccess: async () => {
			setConfirmAction(null);
			onSuccess?.();
			await queryClient.invalidateQueries({ queryKey: ['waitingList', uid] });
		},
		onError: (err: Error) => onError?.(err.message),
	});

	const leaveWaitlist = useMutation({
		mutationFn: async () => {
			if (!uid) throw new Error('Zaloguj się.');
			await removeFromWaitingList(course.id, uid);
		},
		onSuccess: async () => {
			setConfirmAction(null);
			onSuccess?.();
			await queryClient.invalidateQueries({ queryKey: ['waitingList', uid] });
		},
		onError: (err: Error) => onError?.(err.message),
	});

	const pending = enroll.isPending || joinWaitlist.isPending || leaveWaitlist.isPending;

	const confirmCopy: Record<
		ConfirmAction,
		{ title: string; confirmLabel: string; confirmColor: 'primary' | 'error'; message: string }
	> = {
		enroll: {
			title: 'Potwierdź zapis',
			confirmLabel: 'Zapisz się',
			confirmColor: 'primary',
			message: `Czy na pewno chcesz zapisać się na „${course.name}” (${date.date})?`,
		},
		joinWaitlist: {
			title: 'Potwierdź dołączenie do listy',
			confirmLabel: 'Dołącz',
			confirmColor: 'primary',
			message: `Czy na pewno chcesz dołączyć do listy oczekujących na „${course.name}”?`,
		},
		leaveWaitlist: {
			title: 'Potwierdź opuszczenie listy',
			confirmLabel: 'Opuść listę',
			confirmColor: 'error',
			message: `Czy na pewno chcesz opuścić listę oczekujących na „${course.name}”?`,
		},
	};

	const dialog = confirmAction ? (
		<ConfirmDialog
			open
			title={confirmCopy[confirmAction].title}
			cancelLabel='Anuluj'
			confirmLabel={confirmCopy[confirmAction].confirmLabel}
			confirmColor={confirmCopy[confirmAction].confirmColor}
			loading={pending}
			onCancel={() => setConfirmAction(null)}
			onConfirm={() => {
				if (confirmAction === 'enroll') enroll.mutate();
				else if (confirmAction === 'joinWaitlist') joinWaitlist.mutate();
				else leaveWaitlist.mutate();
			}}
		>
			{confirmCopy[confirmAction].message}
		</ConfirmDialog>
	) : null;

	if (enrolled) {
		return (
			<Typography color='success.main' sx={{ fontWeight: 600 }}>
				Zapisano
			</Typography>
		);
	}

	if (!user) {
		return (
			<Button component={NextLink} href={Paths.login} variant='contained' size={size}>
				Zaloguj się
			</Button>
		);
	}

	if (slots > 0) {
		return (
			<>
				<Button
					variant='contained'
					size={size}
					disabled={pending}
					onClick={() => setConfirmAction('enroll')}
				>
					Zapisz się
				</Button>
				{dialog}
			</>
		);
	}

	if (onWaitingList) {
		return (
			<>
				<Stack spacing={0.5} sx={{ alignItems: { xs: 'stretch', sm: 'flex-end' } }}>
					<Typography color='warning.main' sx={{ fontWeight: 600 }}>
						Na liście oczekujących
					</Typography>
					<Button
						variant='outlined'
						color='inherit'
						size='small'
						disabled={pending}
						onClick={() => setConfirmAction('leaveWaitlist')}
					>
						Opuść listę
					</Button>
				</Stack>
				{dialog}
			</>
		);
	}

	return (
		<>
			<Button
				variant='outlined'
				size={size}
				disabled={pending}
				onClick={() => setConfirmAction('joinWaitlist')}
			>
				Lista oczekujących
			</Button>
			{dialog}
		</>
	);
};
