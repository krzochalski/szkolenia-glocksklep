'use client';

import { Paths } from '@constants/paths';
import {
	adminGetUserCourseCompletions,
	adminRemoveCourseCompletion,
	adminSetCourseCompletion,
} from '@services/courseCompletions';
import {
	getCourse,
	setCourseDateCanceled,
	setCourseDateRunConfirmed,
	setParticipantCustomPrice,
	setParticipantPaysByCash,
	toggleParticipantPaid,
	unenrollFromCourse,
} from '@services/courses';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	Box,
	Button,
	Chip,
	CircularProgress,
	ConfirmDialog,
	ContentSwap,
	FormControlLabel,
	Price,
	Stack,
	Stagger,
	StaggerItem,
	Switch,
	Typography,
} from '@ui';
import { ArrowBack } from '@ui/icons';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
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
import { bruttoFromNetto, effectiveEnrollmentNetto } from '@/utils/pricing';
import { isParticipantPaymentOverdue } from '@/utils/proformaDue';
import {
	SESSION_STATUS_LABEL,
	sessionStatusChipColor,
} from './dashboard/sessionStatusLabel';
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

	const date = course?.dates?.find((d) => d.id === dateId);
	const participants = date?.participants ?? [];
	const participantIds = useMemo(() => participants.map((p) => p.id), [participants]);
	const listNetto =
		course && date ? effectiveEnrollmentNetto(course, date) : course?.price ?? 0;

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
			customPrice,
			note,
		}: {
			participantId: string;
			customPrice: number | null;
			note?: string;
		}) => setParticipantCustomPrice(courseId, dateId, participantId, { customPrice, note }),
		onSuccess: async () => {
			setPriceTarget(null);
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

	return (
		<ContentSwap state={isLoading ? 'loading' : !course || !date ? 'empty' : 'content'}>
			{isLoading ? (
				<CircularProgress />
			) : !course || !date ? (
				<Typography>Nie znaleziono terminu.</Typography>
			) : (
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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

					<CourseDateEditForm courseId={courseId} courseDate={date} onSaved={invalidate} />

					<Stack direction='row' spacing={1} sx={{ flexWrap: 'wrap' }}>
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

					<Typography variant='h6'>
						Uczestnicy ({participants.length}/{date.slotsMax} ·{' '}
						{formatMinParticipantsMeta(
							signedUpCount(date),
							resolveDateMinParticipants(course, date)
						)}
						)
					</Typography>
					<Stagger sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
						{participants.map((p) => {
							const isCompleted = completedByUid.get(p.id) ?? false;
							const overdue = isParticipantPaymentOverdue(p.paid, date.date);
							const rowBg = p.paid ? 'success.light' : overdue ? 'error.light' : undefined;
							const payable = effectiveEnrollmentNetto(course, date, p);
							const hasCustom = p.customPrice != null;
							return (
								<StaggerItem key={p.id}>
									<Stack
										direction={{ xs: 'column', sm: 'row' }}
										spacing={1}
										sx={{
											borderBottom: 1,
											borderColor: 'divider',
											px: 1.5,
											py: 1,
											mx: -1.5,
											alignItems: { sm: 'center' },
											bgcolor: rowBg,
										}}
									>
										<Box sx={{ flex: 1 }}>
											<Typography sx={{ fontWeight: 600 }}>{p.name}</Typography>
											<Typography variant='body2' color='text.secondary'>
												{p.email} {p.phoneNumber ? `· ${p.phoneNumber}` : ''}
											</Typography>
											<Box sx={{ mt: 0.75, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
												<Price
													gross={bruttoFromNetto(payable)}
													net={payable}
													size='sm'
												/>
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
											</Box>
										</Box>
										<Button
											size='small'
											variant='outlined'
											disabled={setCustomPrice.isPending}
											onClick={() => setPriceTarget(p)}
										>
											Cena
										</Button>
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
						onSave={({ customPrice, note }) => {
							if (!priceTarget) return;
							setCustomPrice.mutate({
								participantId: priceTarget.id,
								customPrice,
								note,
							});
						}}
						onClear={() => {
							if (!priceTarget) return;
							setCustomPrice.mutate({
								participantId: priceTarget.id,
								customPrice: null,
							});
						}}
					/>
				</Box>
			)}
		</ContentSwap>
	);
};
