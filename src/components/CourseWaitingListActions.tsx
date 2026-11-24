'use client';

import { Paths } from '@constants/paths';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCourseEligibility, useWaitlist } from '@hooks';
import { addGuestToWaitingList } from '@services/courseWaitingList';
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
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
import NextLink from 'next/link';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { publicTouchTargetSx } from '@/components/publicResponsive';
import type { Course } from '@/types/course';
import { invalidateCourseQueries } from '@/utils/invalidateCourseQueries';
import { type GuestWaitingListFormValues, guestWaitingListSchema } from '@/utils/schemas';
import { mapWaitlistError, WAITLIST_JOIN_ERROR } from '@/utils/waitlistErrors';

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
			await addGuestToWaitingList({
				courseId: course.id,
				courseName: course.name,
				courseSlug: course.slug,
				email: values.email,
			});
			setSubmittedEmail(values.email.trim());
			bumpCourseWaitingListCount(queryClient, course.slug, 1);
			onSuccess?.(
				`Dziękujemy — powiadomimy Cię na ${values.email.trim()}, gdy pojawi się nowy termin.`
			);
		} catch (err) {
			const message = mapWaitlistError(err, WAITLIST_JOIN_ERROR);
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
					Załóż konto, żeby łatwiej zarządzać zapisami i kontaktem przy kolejnych szkoleniach.{' '}
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
			sx={{ maxWidth: 420, width: '100%', minWidth: 0 }}
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
			<Button type='submit' variant='contained' disabled={isSubmitting} sx={publicTouchTargetSx}>
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
	const eligibility = useCourseEligibility(course);
	const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
	const [joinSuccess, setJoinSuccess] = useState(false);

	const waitlist = useWaitlist(course, {
		onError,
		onJoined: (result) => {
			setConfirmAction(null);
			if (result === 'exists') return;
			setJoinSuccess(true);
			onSuccess?.('Dołączono do listy oczekujących. Powiadomimy Cię o nowym terminie.');
		},
		onLeft: () => {
			setConfirmAction(null);
			setJoinSuccess(false);
			onSuccess?.('Opuszczono listę oczekujących.');
		},
	});

	const pending = waitlist.isPending;

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
				onConfirm={() => waitlist.join()}
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
				onConfirm={() => waitlist.leave()}
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

	if (!waitlist.user) {
		return (
			<>
				<GuestWaitingListForm course={course} onError={onError} onSuccess={onSuccess} />
				{prereqNote}
			</>
		);
	}

	if (waitlist.isJoined || joinSuccess) {
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
						disabled={pending}
						onClick={() => setConfirmAction('leave')}
						sx={publicTouchTargetSx}
						fullWidth
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
				sx={publicTouchTargetSx}
				fullWidth
			>
				Dołącz do listy oczekujących
			</Button>
			{prereqNote}
			{dialog}
		</>
	);
};
