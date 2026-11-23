'use client';

import { Paths } from '@constants/paths';
import { useAuthUser, useCourseEligibility } from '@hooks';
import {
	addGuestToWaitingList,
	addToWaitingList,
	ALREADY_ON_WAITING_LIST,
	GUEST_ALREADY_ON_WAITING_LIST,
	getUserWaitingListEntries,
	removeFromWaitingList,
} from '@services/courseWaitingList';
import { getUserProfile } from '@services/users';
import type { Course } from '@/types/course';
import { invalidateCourseQueries } from '@/utils/invalidateCourseQueries';
import {
	type GuestWaitingListFormValues,
	guestWaitingListSchema,
} from '@/utils/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	Button,
	Checkbox,
	ConfirmDialog,
	FormControlLabel,
	Link,
	Stack,
	TextField,
	Typography,
} from '@ui';
import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import NextLink from 'next/link';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

type Props = {
	readonly course: Course;
	readonly onError?: (message: string) => void;
	readonly onSuccess?: (message?: string) => void;
};

type ConfirmAction = 'join' | 'leave';

const bumpCourseWaitingListCount = (
	queryClient: QueryClient,
	slug: string,
	delta: number
): void => {
	queryClient.setQueryData<Course | null>(['course', slug], (prev) => {
		if (!prev) return prev;
		return {
			...prev,
			waitingListCount: Math.max(0, (prev.waitingListCount ?? 0) + delta),
		};
	});
	void invalidateCourseQueries(queryClient);
};

const GuestWaitingListForm = ({ course, onError, onSuccess }: Props) => {
	const queryClient = useQueryClient();
	const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
	const [localError, setLocalError] = useState<string | null>(null);
	const {
		control,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<GuestWaitingListFormValues>({
		resolver: zodResolver(guestWaitingListSchema),
		defaultValues: { email: '', consent: false },
	});

	const onSubmit = async (values: GuestWaitingListFormValues) => {
		setLocalError(null);
		try {
			const result = await addGuestToWaitingList({
				courseId: course.id,
				courseName: course.name,
				courseSlug: course.slug,
				email: values.email,
			});
			if (result === 'exists') {
				setLocalError(GUEST_ALREADY_ON_WAITING_LIST);
				onError?.(GUEST_ALREADY_ON_WAITING_LIST);
				return;
			}
			setSubmittedEmail(values.email.trim());
			bumpCourseWaitingListCount(queryClient, course.slug, 1);
			onSuccess?.(
				`Dziękujemy — powiadomimy Cię na ${values.email.trim()}, gdy pojawi się nowy termin.`
			);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : 'Nie udało się zapisać na listę oczekujących.';
			setLocalError(message);
			onError?.(message);
		}
	};

	if (submittedEmail) {
		return (
			<Stack spacing={1.5}>
				<Typography color='success.main' sx={{ fontWeight: 600 }}>
					Dziękujemy — powiadomimy Cię na {submittedEmail}, gdy pojawi się nowy termin.
				</Typography>
				<Typography variant='body2' color='text.secondary'>
					Załóż konto, żeby łatwiej zarządzać zapisami i kontaktem przy kolejnych
					szkoleniach.{' '}
					<Link component={NextLink} href={Paths.register} underline='hover'>
						Utwórz konto
					</Link>
				</Typography>
			</Stack>
		);
	}

	return (
		<Stack
			component='form'
			spacing={1.5}
			onSubmit={handleSubmit(onSubmit)}
			noValidate
			sx={{ maxWidth: 420 }}
		>
			{localError ? (
				<Typography color='error' sx={{ fontSize: '0.875rem' }}>
					{localError}
				</Typography>
			) : null}
			<Controller
				name='email'
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						label='E-mail'
						type='email'
						fullWidth
						required
						autoComplete='email'
						disabled={isSubmitting}
						error={Boolean(errors.email)}
						helperText={errors.email?.message}
					/>
				)}
			/>
			<Controller
				name='consent'
				control={control}
				render={({ field }) => (
					<FormControlLabel
						control={
							<Checkbox
								checked={field.value === true}
								onChange={(e) => field.onChange(e.target.checked ? true : undefined)}
								disabled={isSubmitting}
							/>
						}
						label='Chcę dostać e-mail, gdy pojawi się nowy termin tego szkolenia.'
					/>
				)}
			/>
			{errors.consent ? (
				<Typography color='error' sx={{ fontSize: '0.8125rem' }}>
					{errors.consent.message}
				</Typography>
			) : null}
			<Button type='submit' variant='contained' disabled={isSubmitting}>
				Zapisz na listę oczekujących
			</Button>
			<Typography variant='body2' color='text.secondary'>
				Polecamy{' '}
				<Link component={NextLink} href={Paths.register} underline='hover'>
					założenie konta
				</Link>{' '}
				— łatwiejszy kontakt i zarządzanie zapisami. Masz już konto?{' '}
				<Link component={NextLink} href={Paths.login} underline='hover'>
					Zaloguj się
				</Link>
				.
			</Typography>
		</Stack>
	);
};

/** Join / leave course-level waitlist when there are no open seats (or no dates). */
export const CourseWaitingListActions = ({ course, onError, onSuccess }: Props) => {
	const user = useAuthUser();
	const queryClient = useQueryClient();
	const uid = user?.uid;
	const eligibility = useCourseEligibility(course);
	const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
	const [joinSuccess, setJoinSuccess] = useState(false);

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
			return addToWaitingList({
				courseId: course.id,
				courseName: course.name,
				courseSlug: course.slug,
				userId: user.uid,
				userName: profile?.displayName || user.displayName || user.email || 'Uczestnik',
				email: profile?.email || user.email || '',
				phoneNumber: profile?.phoneNumber ?? user.phoneNumber ?? undefined,
			});
		},
		onSuccess: async (result) => {
			setConfirmAction(null);
			if (result === 'exists') {
				onError?.(ALREADY_ON_WAITING_LIST);
				await queryClient.invalidateQueries({ queryKey: ['waitingList', uid] });
				return;
			}
			setJoinSuccess(true);
			bumpCourseWaitingListCount(queryClient, course.slug, 1);
			onSuccess?.('Dołączono do listy oczekujących. Powiadomimy Cię o nowym terminie.');
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
			setJoinSuccess(false);
			bumpCourseWaitingListCount(queryClient, course.slug, -1);
			onSuccess?.('Opuszczono listę oczekujących.');
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
				{`Czy na pewno chcesz dołączyć do listy oczekujących na „${course.name}”? Powiadomimy Cię e-mailem, gdy pojawi się nowy termin.`}
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

	const prereqNote =
		eligibility.hasPrerequisites && !eligibility.loading && !eligibility.eligible ? (
			<Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
				Uwaga: zapis na termin nadal wymaga ukończenia:{' '}
				{(eligibility.missingNames.length > 0
					? eligibility.missingNames
					: eligibility.prerequisiteNames
				).join(', ')}
				.
			</Typography>
		) : null;

	if (!user) {
		return (
			<>
				<GuestWaitingListForm course={course} onError={onError} onSuccess={onSuccess} />
				{prereqNote}
			</>
		);
	}

	if (onWaitingList || joinSuccess) {
		return (
			<>
				<Stack spacing={0.5}>
					<Typography color='warning.main' sx={{ fontWeight: 600 }}>
						Jesteś na liście oczekujących
					</Typography>
					<Typography variant='body2' color='text.secondary'>
						Powiadomimy Cię e-mailem, gdy pojawi się nowy termin.
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
				variant='contained'
				disabled={pending || eligibility.loading}
				onClick={() => setConfirmAction('join')}
			>
				Dołącz do listy oczekujących
			</Button>
			{prereqNote}
			{dialog}
		</>
	);
};
