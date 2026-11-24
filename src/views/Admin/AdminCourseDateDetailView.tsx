'use client';

import { adminCourseDateParticipantParagonPath, Paths } from '@constants/paths';
import {
	adminGetUserCourseCompletions,
	adminRemoveCourseCompletion,
	adminSetCourseCompletion,
} from '@services/courseCompletions';
import { getCourseDescriptionBySlug } from '@services/courseDescriptions';
import {
	createFakturowniaReceiptForRegistration,
	resendFakturowniaReceiptEmail,
} from '@services/invoicingApi';
import {
	adminResendProforma,
	getCourse,
	setCourseDateCanceled,
	setCourseDateRunConfirmed,
	setParticipantCustomPrice,
	setParticipantPaysByCash,
	toggleParticipantPaid,
	unenrollFromCourse,
} from '@services/courses';
import {
	adminGetWaitingListEntries,
	adminNotifyWaitlistForTerm,
} from '@services/courseWaitingList';
import { adminNotifyDateParticipants } from '@services/dateNotify';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	Alert,
	Box,
	Button,
	Checkbox,
	Chip,
	CircularProgress,
	ConfirmDialog,
	ContentSwap,
	FormControlLabel,
	Price,
	Stack,
	Tooltip,
	Stagger,
	StaggerItem,
	Switch,
	Typography,
} from '@ui';
import { ArrowBack } from '@ui/icons';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { adminParticipantRowActionsSx } from '@components/adminResponsive';
import { PlaceNameLink } from '@/components/PlaceNameLink';
import type { Participant } from '@/types/course';
import { warsawToday } from '@/utils/adminDashboard';
import { invalidateCourseQueries } from '@/utils/invalidateCourseQueries';
import {
	formatMinParticipantsMeta,
	isBelowMinStatus,
	resolveDateMinDecisionBy,
	resolveDateMinParticipants,
	resolveSessionStatus,
	signedUpCount,
} from '@/utils/minParticipants';
import { fillPath } from '@/utils/paths';
import { getCourseKind } from '@/utils/courseKind';
import { expandEnrollmentReceiptPositions } from '@/utils/enrollmentReceiptPositions';
import {
	buildRegistrationServiceLine,
	paragonChipColor,
	paragonIssueBlockReason,
	paragonIssueBlockTooltip,
	PARAGON_PANEL_CHIP_LABEL,
	receiptEmailStatusLabel,
	resolveParagonPanelChip,
} from '@/utils/paragonAdmin';
import { effectiveEnrollmentNetto } from '@/utils/pricing';
import { isParticipantPaymentOverdue } from '@/utils/proformaDue';
import { prepareExternalTab } from '@/utils/externalTab';
import { redirectAfterFakturowniaCreate } from '@/utils/fiscalPrint';
import { salesDocumentLabel } from '@/utils/salesDocument';
import {
	SESSION_STATUS_LABEL,
	sessionStatusChipColor,
} from './dashboard/sessionStatusLabel';
import {
	DateNotifyDialog,
	type DateNotifyComposePayload,
} from './dateNotify/DateNotifyDialog';
import { DateMessagesLog } from './dateNotify/DateMessagesLog';
import { CourseDateEditForm } from './forms/CourseDateEditForm';
import { removeCourseDate } from './forms/dateMutations';
import { ParticipantCustomPriceDialog } from './ParticipantCustomPriceDialog';

type Props = {
	readonly courseId: string;
	readonly dateId: string;
};

export const AdminCourseDateDetailView = ({ courseId, dateId }: Props) => (
	<DetailInner courseId={courseId} dateId={dateId} />
);

const DetailInner = ({ courseId, dateId }: Props) => {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { data: course, isLoading } = useQuery({
		queryKey: ['course', courseId],
		queryFn: () => getCourse(courseId),
	});
	const [cancelOpen, setCancelOpen] = useState(false);
	const [restoreOpen, setRestoreOpen] = useState(false);
	const [confirmRunOpen, setConfirmRunOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const today = warsawToday();
	const [paidTarget, setPaidTarget] = useState<Participant | null>(null);
	const [cashTarget, setCashTarget] = useState<{
		participant: Participant;
		paysByCash: boolean;
	} | null>(null);
	const [completionTarget, setCompletionTarget] = useState<{
		participant: Participant;
		completed: boolean;
	} | null>(null);
	const [removeTarget, setRemoveTarget] = useState<Participant | null>(null);
	const [priceTarget, setPriceTarget] = useState<Participant | null>(null);
	const [proformaTarget, setProformaTarget] = useState<Participant | null>(null);
	const [proformaMsg, setProformaMsg] = useState<{
		severity: 'success' | 'error';
		text: string;
	} | null>(null);
	const [composeOpen, setComposeOpen] = useState(false);
	const [confirmDraft, setConfirmDraft] = useState<DateNotifyComposePayload | null>(null);
	const [notifyResult, setNotifyResult] = useState<string | null>(null);
	const [waitlistResendMsg, setWaitlistResendMsg] = useState<string | null>(null);
	const [paragonTarget, setParagonTarget] = useState<Participant | null>(null);
	const [paragonSendEmail, setParagonSendEmail] = useState(true);
	const [paragonResendTarget, setParagonResendTarget] = useState<Participant | null>(null);

	const date = course?.dates?.find((d) => d.id === dateId);
	const participants = date?.participants ?? [];
	const participantIds = useMemo(() => participants.map((p) => p.id), [participants]);
	const listNetto =
		course && date ? effectiveEnrollmentNetto(course, date) : course?.price ?? 0;

	const { data: waitlistAll = [] } = useQuery({
		queryKey: ['adminWaitingList'],
		queryFn: adminGetWaitingListEntries,
	});
	const waitlistForCourse = useMemo(
		() => waitlistAll.filter((e) => e.courseId === courseId),
		[waitlistAll, courseId]
	);

	const resendWaitlist = useMutation({
		mutationFn: () =>
			adminNotifyWaitlistForTerm({ courseId, dateId, force: true }),
		onSuccess: async (result) => {
			setWaitlistResendMsg(
				`Powiadomienie listy: wysłano ${result.sent}/${result.recipientCount}` +
					(result.failed > 0 ? `, błędów: ${result.failed}` : '') +
					(result.skipped > 0 ? `, pominięto: ${result.skipped}` : '') +
					'.'
			);
			await invalidateCourseQueries(queryClient);
			await queryClient.invalidateQueries({ queryKey: ['course', courseId] });
		},
		onError: (err: Error) => {
			setWaitlistResendMsg(err.message);
		},
	});

	const courseSlug = course?.slug ?? '';
	const { data: courseDescription } = useQuery({
		queryKey: ['courseDescription', courseSlug],
		queryFn: () => getCourseDescriptionBySlug(courseSlug),
		enabled: Boolean(composeOpen && courseSlug),
	});

	const notifyDate = useMutation({
		mutationFn: adminNotifyDateParticipants,
		onSuccess: async (result, variables) => {
			setConfirmDraft(null);
			setComposeOpen(false);
			setNotifyResult(
				variables.isTest
					? `Wysłano test (${result.sent} e-mail).`
					: `Wysłano ${result.sent}/${result.recipientCount}` +
							(result.failed > 0 ? `, błędów: ${result.failed}` : '') +
							(result.idempotentReplay ? ' (ponowione żądanie — bez duplikatu).' : '.')
			);
			await queryClient.invalidateQueries({
				queryKey: ['dateMessages', courseId, dateId],
			});
		},
	});

	const completionQueries = useQueries({
		queries: participantIds.map((uid) => ({
			queryKey: ['adminUserCompletions', uid] as const,
			queryFn: () => adminGetUserCourseCompletions(uid),
			enabled: Boolean(uid),
		})),
	});

	const completedByUid = new Map<string, boolean>();
	for (let i = 0; i < participantIds.length; i++) {
		const uid = participantIds[i];
		const list = completionQueries[i]?.data ?? [];
		completedByUid.set(
			uid,
			list.some((c) => c.courseId === courseId)
		);
	}

	const invalidate = () => invalidateCourseQueries(queryClient);

	const invalidateCompletions = async (uid: string) => {
		await queryClient.invalidateQueries({ queryKey: ['adminUserCompletions', uid] });
		await queryClient.invalidateQueries({ queryKey: ['myCourseCompletions'] });
		await queryClient.invalidateQueries({ queryKey: ['myCourseDebriefings'] });
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
		onSuccess: async () => {
			setCashTarget(null);
			await invalidate();
		},
	});

	const toggleCompletion = useMutation({
		mutationFn: async ({
			participant,
			completed,
		}: {
			participant: Participant;
			completed: boolean;
		}) => {
			if (!course) throw new Error('Brak kursu');
			if (completed) {
				await adminSetCourseCompletion({
					uid: participant.id,
					course: { id: course.id, slug: course.slug, name: course.name },
					completedAt: date?.date,
				});
			} else {
				await adminRemoveCourseCompletion(participant.id, course.id);
			}
		},
		onSuccess: async (_data, vars) => {
			setCompletionTarget(null);
			await invalidateCompletions(vars.participant.id);
		},
	});

	const toggleCanceled = useMutation({
		mutationFn: (canceled: boolean) => setCourseDateCanceled(courseId, dateId, canceled),
		onSuccess: async () => {
			setCancelOpen(false);
			setRestoreOpen(false);
			await invalidate();
		},
	});

	const confirmRun = useMutation({
		mutationFn: (runConfirmed: boolean) =>
			setCourseDateRunConfirmed(courseId, dateId, runConfirmed),
		onSuccess: async () => {
			setConfirmRunOpen(false);
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

	const setCustomPrice = useMutation({
		mutationFn: ({
			participantId,
			adjustment,
			reason,
			note,
			confirmPaidAdjustment,
		}: {
			participantId: string;
			adjustment: { type: 'finalPrice' | 'percent' | 'fixed'; value: number } | null;
			reason?: string;
			note?: string;
			confirmPaidAdjustment?: boolean;
		}) =>
			setParticipantCustomPrice(courseId, dateId, participantId, {
				adjustment,
				reason,
				note,
				confirmPaidAdjustment,
				priceChangeId: uuidv4(),
			}),
		onSuccess: async () => {
			setPriceTarget(null);
			setProformaMsg({
				severity: 'success',
				text: 'Cena zapisana. Zaktualizowana proforma została wysłana (jeśli wymagana).',
			});
			await invalidate();
		},
		onError: (err: Error) => {
			setProformaMsg({
				severity: 'error',
				text: err.message || 'Nie udało się zmienić ceny.',
			});
		},
	});

	const resendProforma = useMutation({
		mutationFn: (participantId: string) =>
			adminResendProforma(courseId, dateId, participantId),
		onSuccess: async () => {
			setProformaTarget(null);
			setProformaMsg({
				severity: 'success',
				text: 'Proforma została wysłana ponownie.',
			});
			await invalidate();
		},
		onError: (err: Error) => {
			setProformaMsg({
				severity: 'error',
				text: err.message || 'Nie udało się wysłać proformy.',
			});
		},
	});

	const issueParagon = useMutation({
		mutationFn: async ({
			participantId,
			sendEmail,
		}: {
			participantId: string;
			sendEmail: boolean;
		}) => {
			const tab = prepareExternalTab();
			const result = await createFakturowniaReceiptForRegistration({
				courseId,
				dateId,
				participantId,
				sendEmail,
			});
			const viewUrl = result.receipt.viewUrl;
			if (viewUrl && tab) tab.navigate(viewUrl);
			return { participantId, alreadyExists: result.alreadyExists, email: result.email };
		},
		onSuccess: async ({ participantId, alreadyExists, email }) => {
			setParagonTarget(null);
			await invalidate();
			const emailNote =
				email?.sent === true
					? ' Wysłano e-mail do uczestnika.'
					: email && email.sent === false
						? ' Nie wysłano e-maila z paragonem.'
						: '';
			setProformaMsg({
				severity: 'success',
				text: alreadyExists
					? 'Paragon już istnieje w Fakturowni.'
					: `Paragon wystawiony w Fakturowni.${emailNote}`,
			});
			if (!alreadyExists) {
				redirectAfterFakturowniaCreate(
					(href) => router.push(href),
					courseId,
					dateId,
					participantId
				);
			}
		},
		onError: (err: Error) => {
			setParagonTarget(null);
			setProformaMsg({
				severity: 'error',
				text: err.message || 'Nie udało się wystawić paragonu.',
			});
		},
	});

	const resendParagonEmail = useMutation({
		mutationFn: (participantId: string) =>
			resendFakturowniaReceiptEmail({ courseId, dateId, participantId }),
		onSuccess: async (result) => {
			setParagonResendTarget(null);
			await invalidate();
			setProformaMsg({
				severity: result.email.sent ? 'success' : 'error',
				text: result.email.sent
					? 'Wysłano ponownie e-mail z paragonem.'
					: 'Nie udało się wysłać e-maila z paragonem.',
			});
		},
		onError: (err: Error) => {
			setParagonResendTarget(null);
			setProformaMsg({
				severity: 'error',
				text: err.message || 'Nie udało się wysłać e-maila z paragonem.',
			});
		},
	});

	const paragonPreviewLine = useMemo(() => {
		if (!paragonTarget || !course || !date) return null;
		const net = effectiveEnrollmentNetto(course, date, paragonTarget);
		const finalNet = paragonTarget.priceSnapshot?.finalPrice ?? net;
		const serviceLine = buildRegistrationServiceLine(course.name, getCourseKind(course), date);
		const [line] = expandEnrollmentReceiptPositions({
			serviceLine,
			amountNet: finalNet,
			baseAmountNet: paragonTarget.priceSnapshot?.basePrice,
			discountTotal: paragonTarget.priceSnapshot?.discountTotal,
			discountReason: paragonTarget.priceSnapshot?.manualAdjustment?.reason,
			vatRatePercent: 23,
		});
		return line ?? null;
	}, [paragonTarget, course, date]);

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

	return (
		<ContentSwap state={isLoading ? 'loading' : !course || !date ? 'empty' : 'content'}>
			{isLoading ? (
				<CircularProgress />
			) : !course || !date ? (
				<Typography>Nie znaleziono terminu.</Typography>
			) : (
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, maxWidth: '100%' }}>
					<Button
						component={NextLink}
						href={fillPath(Paths.adminCourseAllDates, { courseId })}
						startIcon={<ArrowBack />}
						sx={{ alignSelf: 'flex-start' }}
					>
						Powrót
					</Button>
					<Stack direction='row' spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
						<Typography variant='h5'>
							{course.name} — {date.date} {date.timeStart}
						</Typography>
						{(() => {
							const status = resolveSessionStatus({ date, course, today });
							return (
								<Chip
									label={SESSION_STATUS_LABEL[status]}
									size='small'
									color={sessionStatusChipColor(status)}
								/>
							);
						})()}
					</Stack>
					<Typography color='text.secondary'>
						<PlaceNameLink place={date.place} /> · {date.instructor?.name}
					</Typography>
					{(() => {
						const signedUp = signedUpCount(date);
						const min = resolveDateMinParticipants(course, date);
						const deadline = resolveDateMinDecisionBy(course, date);
						const status = resolveSessionStatus({ date, course, today });
						return (
							<Typography variant='body2' color='text.secondary'>
								Zapisy: {signedUp}/{date.slotsMax} · {formatMinParticipantsMeta(signedUp, min)} ·
								decyzja do {deadline}
								{date.runConfirmedDespiteMin
									? ' · potwierdzono prowadzenie mimo min.'
									: ''}
								{isBelowMinStatus(status)
									? ' — minimum liczy każdy zapis (także nieopłacony); anulowanie tylko ręczne.'
									: ''}
							</Typography>
						);
					})()}
					<Typography variant='body2' color='text.secondary'>
						Lista oczekujących kursu: {waitlistForCourse.length}
						{date.waitlistNotifiedAt
							? ` · powiadomienie o terminie: ${date.waitlistNotifiedAt.slice(0, 19).replace('T', ' ')}`
							: ' · brak automatycznego powiadomienia o tym terminie'}
						{' · '}
						<Button
							component={NextLink}
							href={Paths.adminWaitingList}
							size='small'
							sx={{ verticalAlign: 'baseline', minWidth: 0, p: 0 }}
						>
							zobacz listę
						</Button>
					</Typography>
					{waitlistResendMsg ? (
						<Alert
							severity={waitlistResendMsg.startsWith('Powiadomienie') ? 'success' : 'error'}
							onClose={() => setWaitlistResendMsg(null)}
						>
							{waitlistResendMsg}
						</Alert>
					) : null}

					<CourseDateEditForm courseId={courseId} courseDate={date} onSaved={invalidate} />

					<Stack
						direction={{ xs: 'column', sm: 'row' }}
						spacing={1}
						sx={{ flexWrap: 'wrap', '& .MuiButton-root': { minHeight: 44 } }}
					>
						<Button variant='contained' onClick={() => setComposeOpen(true)}>
							Wyślij wiadomość do uczestników
						</Button>
						<Button
							variant='outlined'
							disabled={resendWaitlist.isPending || waitlistForCourse.length === 0}
							onClick={() => resendWaitlist.mutate()}
						>
							Wyślij powiadomienie ponownie (lista oczekujących)
						</Button>
						{date.canceled ? (
							<Button
								variant='outlined'
								color='success'
								disabled={toggleCanceled.isPending}
								onClick={() => setRestoreOpen(true)}
							>
								Przywróć termin
							</Button>
						) : (
							<>
								{isBelowMinStatus(resolveSessionStatus({ date, course, today })) &&
								!date.runConfirmedDespiteMin ? (
									<Button
										variant='outlined'
										color='warning'
										disabled={confirmRun.isPending}
										onClick={() => setConfirmRunOpen(true)}
									>
										Potwierdź prowadzenie mimo min.
									</Button>
								) : null}
								{date.runConfirmedDespiteMin ? (
									<Button
										variant='outlined'
										disabled={confirmRun.isPending}
										onClick={() => confirmRun.mutate(false)}
									>
										Cofnij potwierdzenie mimo min.
									</Button>
								) : null}
								<Button
									variant='outlined'
									color='error'
									disabled={toggleCanceled.isPending}
									onClick={() => setCancelOpen(true)}
								>
									Odwołaj termin
								</Button>
							</>
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

					{notifyResult ? (
						<Alert severity='success' onClose={() => setNotifyResult(null)}>
							{notifyResult}
						</Alert>
					) : null}
					{notifyDate.isError ? (
						<Alert severity='error' onClose={() => notifyDate.reset()}>
							{(notifyDate.error as Error).message}
						</Alert>
					) : null}

					<Typography variant='h6'>Wysłane wiadomości</Typography>
					<DateMessagesLog courseId={courseId} dateId={dateId} />

					<Typography variant='h6'>
						Uczestnicy ({participants.length}/{date.slotsMax} ·{' '}
						{formatMinParticipantsMeta(
							signedUpCount(date),
							resolveDateMinParticipants(course, date)
						)}
						)
					</Typography>
					{proformaMsg ? (
						<Alert
							severity={proformaMsg.severity}
							onClose={() => setProformaMsg(null)}
						>
							{proformaMsg.text}
						</Alert>
					) : null}
					<Stagger sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
						{participants.map((p) => {
							const isCompleted = completedByUid.get(p.id) ?? false;
							const overdue = isParticipantPaymentOverdue(p.paid, date.date);
							const rowBg = p.paid ? 'success.light' : overdue ? 'error.light' : undefined;
							const payable = effectiveEnrollmentNetto(course, date, p);
							const hasCustom = p.customPrice != null;
							const paragonChip =
								p.documentType !== 'invoice'
									? resolveParagonPanelChip(p, p.fiscalStatus ?? null)
									: null;
							const paragonBlock = paragonIssueBlockReason(p, payable);
							const paragonEmailStatus = receiptEmailStatusLabel(p);
							return (
								<StaggerItem key={p.id}>
									<Stack
										direction={{ xs: 'column', sm: 'row' }}
										spacing={1}
										sx={[
											{
												borderBottom: 1,
												borderColor: 'divider',
												px: 1.5,
												py: 1,
												mx: { xs: 0, sm: -1.5 },
												alignItems: { sm: 'center' },
												bgcolor: rowBg,
											},
											adminParticipantRowActionsSx,
										]}
									>
										<Box sx={{ flex: 1 }}>
											<Typography sx={{ fontWeight: 600 }}>{p.name}</Typography>
											<Typography variant='body2' color='text.secondary'>
												{p.email} {p.phoneNumber ? `· ${p.phoneNumber}` : ''}
												{p.documentType
													? ` · Dokument: ${salesDocumentLabel(p.documentType)}${p.invoiceNip ? ` (NIP ${p.invoiceNip})` : ''}`
													: ''}
											</Typography>
											<Box sx={{ mt: 0.75, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
												<Price amount={payable} basis='netto' size='inline' />
												{hasCustom ? (
													<Typography
														variant='caption'
														sx={{
															fontFamily: '"Space Mono", monospace',
															fontWeight: 700,
															letterSpacing: 0.04,
															textTransform: 'uppercase',
															color: 'primary.main',
														}}
													>
														Cena indywidualna
													</Typography>
												) : null}
												{p.customPriceNote ? (
													<Typography variant='caption' color='text.secondary'>
														{p.customPriceNote}
													</Typography>
												) : null}
												{p.proforma ? (
													<Typography
														variant='caption'
														color={
															p.proforma.status === 'failed'
																? 'error'
																: p.proforma.status === 'sent'
																	? 'success.dark'
																	: 'text.secondary'
														}
														sx={{ display: 'block', width: '100%' }}
													>
														{p.proforma.status === 'sent'
															? `Proforma: ${p.proforma.number}${p.proforma.version && p.proforma.version > 1 ? ` (v${p.proforma.version})` : ''}${p.proforma.sentAt ? ` · ${p.proforma.sentAt.slice(0, 10)}` : ''}`
															: p.proforma.status === 'pending'
																? 'Proforma: wysyłanie…'
																: p.proforma.status === 'replaced'
																	? `Proforma zastąpiona: ${p.proforma.number}`
																	: `Proforma: błąd${p.proforma.error ? ` (${p.proforma.error})` : ''}${p.proforma.number && p.proforma.number !== '—' ? ` · ${p.proforma.number}` : ''}`}
													</Typography>
												) : null}
												{(p.proformaVersions?.length ?? 0) > 0 ? (
													<Typography
														variant='caption'
														color='text.secondary'
														sx={{ display: 'block', width: '100%' }}
													>
														Wcześniejsze proformy:{' '}
														{p.proformaVersions
															?.map(
																(v) =>
																	`${v.number} (${v.status}${v.amountNet != null ? `, ${v.amountNet.toFixed(2)} zł n.` : ''})`
															)
															.join(' · ')}
													</Typography>
												) : null}
												{(p.priceHistory?.length ?? 0) > 0 ? (
													<Typography
														variant='caption'
														color='text.secondary'
														sx={{ display: 'block', width: '100%' }}
													>
														Historia cen:{' '}
														{[...(p.priceHistory ?? [])]
															.slice(-3)
															.reverse()
															.map(
																(h) =>
																	`${h.oldFinalPrice.toFixed(2)}→${h.newFinalPrice.toFixed(2)} (${h.reason})`
															)
															.join(' · ')}
													</Typography>
												) : null}
												{paragonChip ? (
													<Chip
														size='small'
														label={PARAGON_PANEL_CHIP_LABEL[paragonChip]}
														color={paragonChipColor(paragonChip)}
														variant={paragonChip === 'none' ? 'outlined' : 'filled'}
													/>
												) : null}
												{p.fiscalError ? (
													<Typography variant='caption' color='error' sx={{ width: '100%' }}>
														Paragon: {p.fiscalError}
													</Typography>
												) : null}
												{paragonEmailStatus ? (
													<Typography
														variant='caption'
														color={
															p.receiptEmail?.sentAt
																? 'success.dark'
																: p.receiptEmail?.error
																	? 'error'
																	: 'text.secondary'
														}
														sx={{ width: '100%' }}
													>
														{paragonEmailStatus}
													</Typography>
												) : null}
											</Box>
										</Box>
										<Button
											size='small'
											variant='outlined'
											disabled={setCustomPrice.isPending}
											onClick={() => setPriceTarget(p)}
										>
											Zmień cenę
										</Button>
										{!p.paysByCash && payable > 0 ? (
											<Button
												size='small'
												variant='outlined'
												disabled={resendProforma.isPending}
												onClick={() => {
													setProformaMsg(null);
													setProformaTarget(p);
												}}
											>
												Wyślij ponownie proformę
											</Button>
										) : null}
										{p.documentType !== 'invoice' ? (
											p.fakturownia?.receiptId ? (
												<>
													<Typography variant='caption' color='text.secondary'>
														{p.fakturownia.number ?? 'Paragon'}
													</Typography>
													<Button
														size='small'
														variant='outlined'
														component={NextLink}
														href={adminCourseDateParticipantParagonPath(
															courseId,
															dateId,
															p.id
														)}
													>
														Druk paragonu
													</Button>
													{p.fakturownia.viewUrl ? (
														<Button
															size='small'
															variant='text'
															component='a'
															href={p.fakturownia.viewUrl}
															target='_blank'
															rel='noopener noreferrer'
														>
															Fakturownia
														</Button>
													) : null}
													<Button
														size='small'
														variant='outlined'
														disabled={resendParagonEmail.isPending}
														onClick={() => {
															setProformaMsg(null);
															setParagonResendTarget(p);
														}}
													>
														Wyślij ponownie e-mail
													</Button>
												</>
											) : (
												<Tooltip
													title={
														paragonBlock
															? paragonIssueBlockTooltip(paragonBlock)
															: 'Wystaw paragon w Fakturowni'
													}
												>
													<span>
														<Button
															size='small'
															variant='outlined'
															disabled={
																Boolean(paragonBlock) ||
																issueParagon.isPending ||
																paragonChip === 'issuing'
															}
															onClick={() => {
																setProformaMsg(null);
																setParagonSendEmail(true);
																setParagonTarget(p);
															}}
														>
															Wystaw paragon
														</Button>
													</span>
												</Tooltip>
											)
										) : null}
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
														setCashTarget({ participant: p, paysByCash: checked })
													}
												/>
											}
											label='Gotówka'
										/>
										<FormControlLabel
											control={
												<Switch
													checked={isCompleted}
													disabled={toggleCompletion.isPending}
													onChange={(_, checked) =>
														setCompletionTarget({
															participant: p,
															completed: checked,
														})
													}
												/>
											}
											label='Ukończone'
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
								</StaggerItem>
							);
						})}
						{participants.length === 0 ? (
							<Typography color='text.secondary'>Brak uczestników.</Typography>
						) : null}
					</Stagger>

					<ConfirmDialog
						open={confirmRunOpen}
						title='Potwierdź prowadzenie mimo minimum'
						cancelLabel='Wróć'
						confirmLabel='Potwierdź'
						confirmColor='warning'
						loading={confirmRun.isPending}
						onCancel={() => setConfirmRunOpen(false)}
						onConfirm={() => confirmRun.mutate(true)}
					>
						<Typography>
							Termin <strong>{date.date}</strong> ma{' '}
							{formatMinParticipantsMeta(
								signedUpCount(date),
								resolveDateMinParticipants(course, date)
							)}{' '}
							zapisów. Potwierdź, że prowadzisz mimo braku minimum. To nie anuluje terminu —
							uczestnicy pozostają zapisani.
						</Typography>
					</ConfirmDialog>

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
							{participants.length > 0 ? (
								<Typography component='span' color='warning.main' sx={{ display: 'block', mt: 1 }}>
									Ten termin ma {participants.length} zapisanych uczestników.
								</Typography>
							) : null}
						</Typography>
					</ConfirmDialog>

					<ConfirmDialog
						open={restoreOpen}
						title='Potwierdź przywrócenie terminu'
						cancelLabel='Anuluj'
						confirmLabel='Przywróć'
						confirmColor='primary'
						loading={toggleCanceled.isPending}
						onCancel={() => setRestoreOpen(false)}
						onConfirm={() => toggleCanceled.mutate(false)}
					>
						<Typography>
							Czy na pewno chcesz przywrócić termin <strong>{date.date}</strong>?
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
							{participants.length > 0 ? (
								<Typography component='span' color='error' sx={{ display: 'block', mt: 1 }}>
									Ten termin ma {participants.length} zapisanych uczestników!
								</Typography>
							) : null}
						</Typography>
					</ConfirmDialog>

					<ConfirmDialog
						open={Boolean(paragonTarget)}
						title='Wystaw paragon w Fakturowni'
						cancelLabel='Anuluj'
						confirmLabel='Wystaw paragon'
						confirmColor='primary'
						loading={issueParagon.isPending}
						onCancel={() => setParagonTarget(null)}
						onConfirm={() => {
							if (!paragonTarget) return;
							issueParagon.mutate({
								participantId: paragonTarget.id,
								sendEmail: paragonSendEmail,
							});
						}}
					>
						<Stack spacing={1.5}>
							<Typography>
								Uczestnik: <strong>{paragonTarget?.name}</strong>
							</Typography>
							{paragonPreviewLine ? (
								<Typography variant='body2' color='text.secondary'>
									Pozycja: {paragonPreviewLine.title}
									<br />
									Kwota brutto: {paragonPreviewLine.brutto.toFixed(2)} zł
								</Typography>
							) : null}
							<FormControlLabel
								control={
									<Checkbox
										checked={paragonSendEmail}
										onChange={(_, checked) => setParagonSendEmail(checked)}
									/>
								}
								label='Wyślij paragon e-mailem do uczestnika'
							/>
						</Stack>
					</ConfirmDialog>

					<ConfirmDialog
						open={Boolean(paragonResendTarget)}
						title='Wyślij ponownie e-mail z paragonem'
						cancelLabel='Anuluj'
						confirmLabel='Wyślij'
						confirmColor='primary'
						loading={resendParagonEmail.isPending}
						onCancel={() => setParagonResendTarget(null)}
						onConfirm={() => {
							if (paragonResendTarget) resendParagonEmail.mutate(paragonResendTarget.id);
						}}
					>
						<Typography>
							Wysłać ponownie link do paragonu na adres{' '}
							<strong>{paragonResendTarget?.email}</strong> (
							{paragonResendTarget?.fakturownia?.number ?? 'paragon'})?
						</Typography>
					</ConfirmDialog>

					<ConfirmDialog
						open={Boolean(proformaTarget)}
						title='Wyślij ponownie proformę'
						cancelLabel='Anuluj'
						confirmLabel='Wyślij'
						confirmColor='primary'
						loading={resendProforma.isPending}
						onCancel={() => setProformaTarget(null)}
						onConfirm={() => {
							if (proformaTarget) resendProforma.mutate(proformaTarget.id);
						}}
					>
						<Typography>
							Wysłać ponownie proformę do{' '}
							<strong>{proformaTarget?.name}</strong> ({proformaTarget?.email})?
							{proformaTarget?.proforma?.number
								? ` Numer: ${proformaTarget.proforma.number}.`
								: ''}
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
						open={Boolean(cashTarget)}
						title='Potwierdź zmianę formy płatności'
						cancelLabel='Anuluj'
						confirmLabel='Potwierdź'
						confirmColor='primary'
						loading={toggleCash.isPending}
						onCancel={() => setCashTarget(null)}
						onConfirm={() => {
							if (cashTarget) {
								toggleCash.mutate({
									id: cashTarget.participant.id,
									paysByCash: cashTarget.paysByCash,
								});
							}
						}}
					>
						<Typography>
							{cashTarget?.paysByCash
								? `Czy na pewno chcesz oznaczyć płatność uczestnika ${cashTarget.participant.name} jako gotówkową?`
								: `Czy na pewno chcesz wyłączyć płatność gotówką dla uczestnika ${cashTarget?.participant.name}?`}
						</Typography>
					</ConfirmDialog>

					<ConfirmDialog
						open={Boolean(completionTarget)}
						title='Potwierdź ukończenie szkolenia'
						cancelLabel='Anuluj'
						confirmLabel='Potwierdź'
						confirmColor='primary'
						loading={toggleCompletion.isPending}
						onCancel={() => setCompletionTarget(null)}
						onConfirm={() => {
							if (completionTarget) toggleCompletion.mutate(completionTarget);
						}}
					>
						<Typography>
							{completionTarget?.completed
								? `Oznaczyć ${completionTarget.participant.name} jako absolwenta „${course.name}”? Odblokuje to debriefing i ścieżkę rozwoju oraz wyśle e-mail z podziękowaniem i dostępem do materiałów. Data ukończenia: ${date.date}.`
								: `Usunąć oznaczenie ukończenia „${course.name}” dla ${completionTarget?.participant.name}?`}
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

					<ParticipantCustomPriceDialog
						open={Boolean(priceTarget)}
						participant={priceTarget}
						listNetto={listNetto}
						loading={setCustomPrice.isPending}
						onClose={() => setPriceTarget(null)}
						onSave={(payload) => {
							if (!priceTarget) return;
							setCustomPrice.mutate({
								participantId: priceTarget.id,
								...payload,
							});
						}}
					/>

					<DateNotifyDialog
						open={composeOpen && !confirmDraft}
						course={course}
						date={date}
						waitlistEntries={waitlistForCourse}
						requirements={courseDescription?.requirements}
						loading={notifyDate.isPending}
						onClose={() => setComposeOpen(false)}
						onSubmit={(payload) => setConfirmDraft(payload)}
						onTestSend={(payload) => {
							notifyDate.mutate({
								courseId,
								dateId,
								subject: payload.subject,
								bodyMarkdown: payload.bodyMarkdown,
								recipientMode: payload.recipientMode,
								manualParticipantIds: payload.manualParticipantIds,
								idempotencyKey: uuidv4(),
								isTest: true,
							});
						}}
					/>

					<ConfirmDialog
						open={Boolean(confirmDraft)}
						title='Potwierdź wysyłkę'
						cancelLabel='Anuluj'
						confirmLabel='Wyślij'
						loading={notifyDate.isPending}
						onCancel={() => setConfirmDraft(null)}
						onConfirm={() => {
							if (!confirmDraft) return;
							notifyDate.mutate({
								courseId,
								dateId,
								subject: confirmDraft.subject,
								bodyMarkdown: confirmDraft.bodyMarkdown,
								recipientMode: confirmDraft.recipientMode,
								manualParticipantIds: confirmDraft.manualParticipantIds,
								idempotencyKey: uuidv4(),
							});
						}}
					>
						<Typography>
							Wyślesz e-mail do <strong>{confirmDraft?.recipientCount ?? 0}</strong>{' '}
							odbiorców.
							{confirmDraft?.subject ? (
								<>
									{' '}
									Temat: <strong>{confirmDraft.subject}</strong>.
								</>
							) : null}{' '}
							Operacja jest nieodwracalna. Kontynuować?
						</Typography>
					</ConfirmDialog>
				</Box>
			)}
		</ContentSwap>
	);
};
