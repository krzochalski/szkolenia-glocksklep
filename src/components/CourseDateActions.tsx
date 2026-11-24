'use client';

import { Paths } from '@constants/paths';
import { WAITLIST_SECTION_ID } from '@constants/waitlist';
import { useAuthUser, useCourseEligibility, useWaitlist } from '@hooks';
import { enrollInCourse } from '@services/courses';
import { getUserProfile } from '@services/users';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
	Button,
	ConfirmDialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	hardShadowDialogActionsSx,
	hardShadowDialogContentSx,
	hardShadowDialogTitleSx,
	MotionAlert,
	Price,
	Stack,
	Switch,
	TextField,
	Typography,
} from '@ui';
import NextLink from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { PaymentDocumentInfo } from '@/components/PaymentDocumentInfo';
import { PlaceNameLink } from '@/components/PlaceNameLink';
import { PublicDialog } from '@/components/PublicDialog';
import { publicDialogActionsStackSx, publicTouchTargetSx } from '@/components/publicResponsive';
import type { Course, CourseClass, Participant } from '@/types/course';
import { getSlotsLeft } from '@/utils/courseDates';
import { formatCourseDatePl } from '@/utils/formatEnrollment';
import { invalidateCourseQueries } from '@/utils/invalidateCourseQueries';
import { normalizeNip } from '@/utils/nip';
import { fillPath, withAuthReturnQuery } from '@/utils/paths';
import { formatPlnNettoBrutto } from '@/utils/pricing';
import { enrollInvoiceSchema, type EnrollInvoiceFormValues } from '@/utils/schemas';
import { deriveDocumentType } from '@/utils/salesDocument';

type Props = {
	readonly course: Course;
	readonly date: CourseClass;
	readonly size?: 'small' | 'medium' | 'large';
	readonly autoPromptEnroll?: boolean;
	readonly onError?: (message: string) => void;
	readonly onSuccess?: () => void;
};

type ConfirmAction = 'enroll' | 'joinWaitlist' | 'leaveWaitlist';

const defaultInvoiceForm: EnrollInvoiceFormValues = {
	wantInvoice: false,
	nip: '',
	companyName: '',
	companyAddress: '',
};

const ENROLL_PAYMENT_HINT =
	'Po zapisie wyślemy potwierdzenie e-mailem. Proformę i dane do przelewu znajdziesz w Moje szkolenia.';

export const CourseDateActions = ({
	course,
	date,
	size = 'medium',
	autoPromptEnroll = false,
	onError,
	onSuccess,
}: Props) => {
	const user = useAuthUser();
	const queryClient = useQueryClient();
	const slots = getSlotsLeft(date);
	const enrolled = date.participants?.some((p) => p.id === user?.uid) ?? false;
	const uid = user?.uid;
	const eligibility = useCourseEligibility(course);
	const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
	const [authGateOpen, setAuthGateOpen] = useState(false);
	const [invoiceForm, setInvoiceForm] = useState<EnrollInvoiceFormValues>(defaultInvoiceForm);
	const [invoiceErrors, setInvoiceErrors] = useState<Partial<Record<keyof EnrollInvoiceFormValues, string>>>(
		{}
	);
	const autoPromptedRef = useRef(false);

	const courseUrl = fillPath(Paths.coursePage, { slug: course.slug });
	const loginHref = withAuthReturnQuery(Paths.login, {
		redirect: courseUrl,
		termin: date.id,
	});
	const registerHref = withAuthReturnQuery(Paths.register, {
		redirect: courseUrl,
		termin: date.id,
	});

	const bookingPrice = date.customPrice ?? course.price;
	const priceLabel = formatPlnNettoBrutto(bookingPrice);
	const bookingSummary = (
		<>
			{course.name}, {formatCourseDatePl(date.date)}, {date.timeStart},{' '}
			<PlaceNameLink place={date.place} />, {priceLabel}
		</>
	);

	const resetInvoiceForm = () => {
		setInvoiceForm(defaultInvoiceForm);
		setInvoiceErrors({});
	};

	const closeEnrollDialog = () => {
		setConfirmAction(null);
		resetInvoiceForm();
	};

	useEffect(() => {
		if (
			!autoPromptEnroll ||
			autoPromptedRef.current ||
			!user ||
			enrolled ||
			slots <= 0 ||
			!eligibility.eligible ||
			eligibility.loading
		) {
			return;
		}
		autoPromptedRef.current = true;
		setConfirmAction('enroll');
	}, [autoPromptEnroll, user, enrolled, slots, eligibility.eligible, eligibility.loading]);

	const waitlist = useWaitlist(course, {
		onError,
		onJoined: () => {
			setConfirmAction(null);
			onSuccess?.();
		},
		onLeft: () => {
			setConfirmAction(null);
			onSuccess?.();
		},
	});
	const onWaitingList = waitlist.isJoined;

	const resolveParticipant = async (): Promise<Participant> => {
		if (!user) throw new Error('Zaloguj się, aby zapisać się na szkolenie.');
		const profile = await getUserProfile();
		const base: Participant = {
			id: user.uid,
			name: profile?.displayName || user.displayName || user.email || 'Uczestnik',
			email: profile?.email || user.email || '',
			phoneNumber: profile?.phoneNumber ?? user.phoneNumber ?? undefined,
		};
		if (!invoiceForm.wantInvoice) {
			return { ...base, documentType: 'receipt' };
		}
		const nip = normalizeNip(invoiceForm.nip);
		return {
			...base,
			documentType: deriveDocumentType(nip),
			invoiceNip: nip,
			invoiceCompanyName: invoiceForm.companyName.trim(),
			invoiceCompanyAddress: invoiceForm.companyAddress.trim(),
		};
	};

	const enroll = useMutation({
		mutationFn: async () => {
			const parsed = enrollInvoiceSchema.safeParse(invoiceForm);
			if (!parsed.success) {
				const fieldErrors: Partial<Record<keyof EnrollInvoiceFormValues, string>> = {};
				for (const issue of parsed.error.issues) {
					const key = issue.path[0];
					if (typeof key === 'string') {
						fieldErrors[key as keyof EnrollInvoiceFormValues] = issue.message;
					}
				}
				setInvoiceErrors(fieldErrors);
				throw new Error('Uzupełnij poprawnie dane faktury lub wyłącz sekcję „Faktura na firmę”.');
			}
			setInvoiceErrors({});
			const participant = await resolveParticipant();
			await enrollInCourse(course.id, date.id, participant);
		},
		onSuccess: async () => {
			closeEnrollDialog();
			onSuccess?.();
			await Promise.all([
				invalidateCourseQueries(queryClient),
				queryClient.invalidateQueries({ queryKey: ['waitingList', uid] }),
			]);
		},
		onError: (err: Error) => onError?.(err.message),
	});

	const pending = enroll.isPending || waitlist.isPending;

	const waitlistConfirmCopy: Record<
		Exclude<ConfirmAction, 'enroll'>,
		{ title: string; confirmLabel: string; confirmColor: 'primary' | 'error'; message: string }
	> = {
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

	const enrollDialog =
		confirmAction === 'enroll' ? (
			<PublicDialog open onClose={pending ? undefined : closeEnrollDialog}>
				<DialogTitle sx={hardShadowDialogTitleSx}>Potwierdź zapis</DialogTitle>
				<DialogContent sx={hardShadowDialogContentSx}>
					<Stack spacing={1.5}>
						<Typography sx={{ fontWeight: 600 }}>{bookingSummary}</Typography>
						<Typography color='text.secondary'>{ENROLL_PAYMENT_HINT}</Typography>
						<PaymentDocumentInfo compact />
						<FormControlLabel
							control={
								<Switch
									checked={invoiceForm.wantInvoice}
									onChange={(_, checked) => {
										setInvoiceForm((prev) => ({ ...prev, wantInvoice: checked }));
										setInvoiceErrors({});
									}}
									size='small'
								/>
							}
							label='Faktura na firmę (opcjonalnie)'
						/>
						{invoiceForm.wantInvoice ? (
							<Stack spacing={1.5}>
								<TextField
									label='NIP'
									value={invoiceForm.nip}
									onChange={(e) => setInvoiceForm((prev) => ({ ...prev, nip: e.target.value }))}
									error={Boolean(invoiceErrors.nip)}
									helperText={invoiceErrors.nip}
									slotProps={{ input: { inputMode: 'numeric' } }}
									fullWidth
								/>
								<TextField
									label='Nazwa firmy'
									value={invoiceForm.companyName}
									onChange={(e) =>
										setInvoiceForm((prev) => ({ ...prev, companyName: e.target.value }))
									}
									error={Boolean(invoiceErrors.companyName)}
									helperText={invoiceErrors.companyName}
									fullWidth
								/>
								<TextField
									label='Adres firmy'
									value={invoiceForm.companyAddress}
									onChange={(e) =>
										setInvoiceForm((prev) => ({ ...prev, companyAddress: e.target.value }))
									}
									error={Boolean(invoiceErrors.companyAddress)}
									helperText={invoiceErrors.companyAddress}
									fullWidth
									multiline
									minRows={2}
								/>
							</Stack>
						) : null}
						<MotionAlert show={Boolean(enroll.error)} severity='error'>
							{enroll.error instanceof Error ? enroll.error.message : ''}
						</MotionAlert>
					</Stack>
				</DialogContent>
				<DialogActions
					sx={{
						...hardShadowDialogActionsSx,
						...publicDialogActionsStackSx,
						justifyContent: { xs: 'flex-start', sm: 'space-between' },
					}}
				>
					<Price
						amount={bookingPrice}
						basis='netto'
						size='inline'
						sx={{ mr: { sm: 'auto' }, width: { xs: '100%', sm: 'auto' } }}
					/>
					<Button
						onClick={closeEnrollDialog}
						disabled={pending}
						variant='outlined'
						sx={publicTouchTargetSx}
					>
						Anuluj
					</Button>
					<Button
						variant='contained'
						color='primary'
						disabled={pending}
						onClick={() => enroll.mutate()}
						sx={publicTouchTargetSx}
					>
						Zapisz się
					</Button>
				</DialogActions>
			</PublicDialog>
		) : null;

	const waitlistDialog =
		confirmAction && confirmAction !== 'enroll' ? (
			<ConfirmDialog
				open
				title={waitlistConfirmCopy[confirmAction].title}
				cancelLabel='Anuluj'
				confirmLabel={waitlistConfirmCopy[confirmAction].confirmLabel}
				confirmColor={waitlistConfirmCopy[confirmAction].confirmColor}
				loading={pending}
				onCancel={() => setConfirmAction(null)}
				onConfirm={() => {
					if (confirmAction === 'joinWaitlist') waitlist.join();
					else waitlist.leave();
				}}
			>
				{waitlistConfirmCopy[confirmAction].message}
			</ConfirmDialog>
		) : null;

	const dialog = (
		<>
			{enrollDialog}
			{waitlistDialog}
		</>
	);

	const authGate = (
		<PublicDialog open={authGateOpen} onClose={() => setAuthGateOpen(false)}>
			<DialogTitle sx={hardShadowDialogTitleSx}>Zapisz się na szkolenie</DialogTitle>
			<DialogContent sx={hardShadowDialogContentSx}>
				<Stack spacing={1.5}>
					<Typography>
						Żeby zająć miejsce na {bookingSummary}, zaloguj się albo załóż konto. Potem wrócisz na
						stronę szkolenia i dokończysz zapis.
					</Typography>
					<PaymentDocumentInfo compact />
				</Stack>
			</DialogContent>
			<DialogActions sx={{ ...hardShadowDialogActionsSx, ...publicDialogActionsStackSx }}>
				<Button onClick={() => setAuthGateOpen(false)} variant='outlined' sx={publicTouchTargetSx}>
					Anuluj
				</Button>
				<Button
					component={NextLink}
					href={loginHref}
					variant='outlined'
					sx={publicTouchTargetSx}
				>
					Zaloguj się
				</Button>
				<Button component={NextLink} href={registerHref} variant='contained' sx={publicTouchTargetSx}>
					Załóż konto
				</Button>
			</DialogActions>
		</PublicDialog>
	);

	if (enrolled) {
		return (
			<Typography color='success.main' sx={{ fontWeight: 600 }}>
				Zapisano
			</Typography>
		);
	}

	if (!user) {
		if (slots <= 0) {
			return (
				<Button
					component={NextLink}
					href={`${courseUrl}#${WAITLIST_SECTION_ID}`}
					variant='outlined'
					size={size}
					sx={publicTouchTargetSx}
					fullWidth
				>
					Lista oczekujących
				</Button>
			);
		}

		return (
			<>
				<Button
					variant='contained'
					size={size}
					onClick={() => setAuthGateOpen(true)}
					sx={publicTouchTargetSx}
					fullWidth
				>
					Zapisz się
				</Button>
				{authGate}
			</>
		);
	}

	if (slots > 0) {
		if (eligibility.hasPrerequisites && !eligibility.loading && !eligibility.eligible) {
			const missing =
				eligibility.missingNames.length > 0
					? eligibility.missingNames.join(', ')
					: eligibility.prerequisiteNames.join(', ');
			return (
				<Typography color='text.secondary' sx={{ fontSize: '0.8125rem', maxWidth: 280 }}>
					Wymaga ukończenia: {missing}
				</Typography>
			);
		}
		return (
			<>
				<Button
					variant='contained'
					size={size}
					disabled={pending || eligibility.loading}
					onClick={() => setConfirmAction('enroll')}
					sx={publicTouchTargetSx}
					fullWidth
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
						disabled={pending}
						onClick={() => setConfirmAction('leaveWaitlist')}
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
				variant='outlined'
				size={size}
				disabled={pending || eligibility.loading}
				onClick={() => setConfirmAction('joinWaitlist')}
				sx={publicTouchTargetSx}
				fullWidth
			>
				Lista oczekujących
			</Button>
			{dialog}
		</>
	);
};