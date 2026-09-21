'use client';

import { Paths } from '@constants/paths';
import { useAuthUser } from '@hooks';
import {
	addToWaitingList,
	getUserWaitingListEntries,
	removeFromWaitingList,
} from '@services/courseWaitingList';
import { getUserProfile } from '@services/users';
import type { Course } from '@/types/course';
import { Button, ConfirmDialog, Stack, Typography } from '@ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import NextLink from 'next/link';
import { useState } from 'react';

type Props = {
	readonly course: Course;
	readonly onError?: (message: string) => void;
	readonly onSuccess?: () => void;
};

type ConfirmAction = 'join' | 'leave';

/** Join / leave course-level waitlist when there are no open seats (or no dates). */
export const CourseWaitingListActions = ({ course, onError, onSuccess }: Props) => {
	const user = useAuthUser();
	const queryClient = useQueryClient();
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

	const joinWaitlist = useMutation({
		mutationFn: async () => {
			if (!user) throw new Error('Zaloguj się, aby dołączyć do listy oczekujących.');
			const profile = await getUserProfile();
			await addToWaitingList({
				courseId: course.id,
				courseName: course.name,
				courseSlug: course.slug,
				userId: user.uid,
				userName: profile?.displayName || user.displayName || user.email || 'Uczestnik',
				email: profile?.email || user.email || '',
				phoneNumber: profile?.phoneNumber ?? user.phoneNumber ?? undefined,
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

	const pending = joinWaitlist.isPending || leaveWaitlist.isPending;

	const dialog =
		confirmAction === 'join' ? (
			<ConfirmDialog
				open
				title='Potwierdź dołączenie do listy'
				cancelLabel='Anuluj'
				confirmLabel='Dołącz'
				confirmColor='primary'
				loading={pending}
				onCancel={() => setConfirmAction(null)}
				onConfirm={() => joinWaitlist.mutate()}
			>
				{`Czy na pewno chcesz dołączyć do listy oczekujących na „${course.name}”?`}
			</ConfirmDialog>
		) : confirmAction === 'leave' ? (
			<ConfirmDialog
				open
				title='Potwierdź opuszczenie listy'
				cancelLabel='Anuluj'
				confirmLabel='Opuść listę'
				loading={pending}
				onCancel={() => setConfirmAction(null)}
				onConfirm={() => leaveWaitlist.mutate()}
			>
				{`Czy na pewno chcesz opuścić listę oczekujących na „${course.name}”?`}
			</ConfirmDialog>
		) : null;

	if (!user) {
		return (
			<Button component={NextLink} href={Paths.login} variant='outlined'>
				Zaloguj się, by dołączyć do listy
			</Button>
		);
	}

	if (onWaitingList) {
		return (
			<>
				<Stack spacing={0.5}>
					<Typography color='warning.main' sx={{ fontWeight: 600 }}>
						Jesteś na liście oczekujących
					</Typography>
					<Button
						variant='outlined'
						color='inherit'
						size='small'
						disabled={pending}
						onClick={() => setConfirmAction('leave')}
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
				disabled={pending}
				onClick={() => setConfirmAction('join')}
			>
				Dołącz do listy oczekujących
			</Button>
			{dialog}
		</>
	);
};
