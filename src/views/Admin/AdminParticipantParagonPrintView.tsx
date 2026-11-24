'use client';

import { Paths } from '@constants/paths';
import { getCourse, updateParticipantFiscalPrintState } from '@services/courses';
import {
	Alert,
	Box,
	Button,
	Chip,
	CircularProgress,
	ConfirmDialog,
	FormControlLabel,
	HardShadow,
	Price,
	Stack,
	Switch,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Typography,
} from '@ui';
import { formatProformaServiceName } from '@/utils/courseKind';
import { prepareExternalTab } from '@/utils/externalTab';
import {
	beginFiscalPrint,
	beginFiscalReprint,
	canReprint,
	canStartFiscalPrint,
	completeFiscalPrint,
	type FiscalPrintState,
	FISCAL_STATUS_LABELS,
	failFiscalPrint,
	openFakturowniaReceipt,
	PRINTER_UI_STATUS_LABELS,
	readAutoPrintPreference,
	resolveFiscalStatus,
	resolvePrinterUiStatus,
	writeAutoPrintPreference,
} from '@/utils/fiscalPrint';
import { expandEnrollmentReceiptPositions } from '@/utils/enrollmentReceiptPositions';
import { effectiveEnrollmentNetto, roundMoney } from '@/utils/pricing';
import type { Course, CourseClass, FiscalStatus, Participant } from '@/types/course';
import Link from 'next/link';
import { useEffect, useEffectEvent, useRef, useState } from 'react';

const POPUP_BLOCKED_MESSAGE =
	'Nie udało się otworzyć okna Fakturowni (blokada pop-up). Zezwól na wyskakujące okna dla tej strony lub kliknij ponownie.';

const formatDate = (iso: string | null | undefined): string => {
	if (!iso) return '—';
	try {
		return new Date(iso).toLocaleString('pl-PL');
	} catch {
		return iso;
	}
};

const formatMoney = (n: number): string => roundMoney(n).toFixed(2);

const toPrintState = (participant: Participant): FiscalPrintState => {
	const fiscalStatus = resolveFiscalStatus(participant.fiscalStatus, Boolean(participant.fakturownia));
	return {
		fiscalStatus: fiscalStatus ?? 'pending',
		fiscalPrintedAt: participant.fiscalPrintedAt ?? null,
		fiscalError: participant.fiscalError ?? null,
		printAttempts: participant.printAttempts ?? 0,
	};
};

type Props = {
	readonly courseId: string;
	readonly dateId: string;
	readonly participantId: string;
};

export const AdminParticipantParagonPrintView = ({
	courseId,
	dateId,
	participantId,
}: Props) => {
	const [course, setCourse] = useState<Course | null>(null);
	const [loading, setLoading] = useState(true);
	const [busy, setBusy] = useState(false);
	const [openFailed, setOpenFailed] = useState(false);
	const [autoPrint, setAutoPrint] = useState(false);
	const [confirmReprintOpen, setConfirmReprintOpen] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const autoPrintRan = useRef(false);

	useEffect(() => {
		setAutoPrint(readAutoPrintPreference());
	}, []);

	useEffect(() => {
		let cancelled = false;
		void (async () => {
			setLoading(true);
			try {
				const data = await getCourse(courseId);
				if (!cancelled) setCourse(data ?? null);
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [courseId]);

	const date = (course?.dates ?? []).find((d) => d.id === dateId || d.date === dateId) as
		| CourseClass
		| undefined;
	const participant = (date?.participants ?? []).find((p) => p.id === participantId);

	const runPrint = useEffectEvent(async (mode: 'print' | 'reprint') => {
		if (!participant?.fakturownia) return;
		setBusy(true);
		setMessage(null);
		setOpenFailed(false);
		const tab = prepareExternalTab();
		const prev = toPrintState(participant);
		const next =
			mode === 'reprint' ? beginFiscalReprint(prev) : beginFiscalPrint(prev);
		if (!next) {
			setBusy(false);
			return;
		}
		try {
			await updateParticipantFiscalPrintState(courseId, dateId, participantId, next);
		} catch {
			setMessage('Nie udało się zapisać statusu druku.');
			setBusy(false);
			return;
		}
		const viewUrl = participant.fakturownia.viewUrl ?? null;
		if (!viewUrl) {
			const failed = failFiscalPrint(next, 'Brak linku do Fakturowni.');
			await updateParticipantFiscalPrintState(courseId, dateId, participantId, failed);
			setMessage(failed.fiscalError);
			setBusy(false);
			return;
		}
		const opened = openFakturowniaReceipt(viewUrl, tab);
		if (!opened) {
			setOpenFailed(true);
			const failed = failFiscalPrint(next, POPUP_BLOCKED_MESSAGE);
			await updateParticipantFiscalPrintState(courseId, dateId, participantId, failed);
			setMessage(POPUP_BLOCKED_MESSAGE);
			setBusy(false);
			return;
		}
		const printedAt = new Date().toISOString();
		const done = completeFiscalPrint(next, printedAt);
		await updateParticipantFiscalPrintState(courseId, dateId, participantId, done);
		setMessage('Paragon otwarty w Fakturowni — oznaczono jako wydrukowany.');
		setBusy(false);
		const data = await getCourse(courseId);
		setCourse(data ?? null);
	});

	useEffect(() => {
		if (!participant?.fakturownia || !autoPrint || autoPrintRan.current) return;
		const status = resolveFiscalStatus(participant.fiscalStatus, true);
		if (status === 'pending' && canStartFiscalPrint(status)) {
			autoPrintRan.current = true;
			void runPrint('print');
		}
	}, [participant, autoPrint]);

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
				<CircularProgress />
			</Box>
		);
	}

	if (!course || !date || !participant) {
		return (
			<Stack spacing={2}>
				<Typography color='error'>Nie znaleziono zapisu.</Typography>
				<Button
					component={Link}
					href={fillPath(Paths.adminCourseDates, { courseId, dateId })}
					variant='outlined'
				>
					Wróć do terminu
				</Button>
			</Stack>
		);
	}

	if (!participant.fakturownia) {
		return (
			<Stack spacing={2}>
				<Alert severity='warning'>
					Ten zapis nie ma jeszcze paragonu w Fakturowni. Wystaw paragon ręcznie na liście
					uczestników terminu (przycisk „Wystaw paragon” po oznaczeniu opłacenia).
				</Alert>
				<Button
					component={Link}
					href={fillPath(Paths.adminCourseDates, { courseId, dateId })}
					variant='contained'
				>
					Wróć do terminu
				</Button>
			</Stack>
		);
	}

	const fiscalStatus = resolveFiscalStatus(participant.fiscalStatus, true) as FiscalStatus;
	const printerStatus = resolvePrinterUiStatus(
		fiscalStatus,
		participant.fakturownia.viewUrl,
		openFailed
	);
	const serviceName = formatProformaServiceName(course);
	const timePart = date.timeStart?.trim() ? ` · ${date.timeStart.trim()}` : '';
	const serviceLine = `${serviceName} (${date.date}${timePart})`;
	const netto = participant.priceSnapshot?.finalPrice ?? effectiveEnrollmentNetto(course, date, participant);
	const positions = expandEnrollmentReceiptPositions({
		serviceLine,
		amountNet: netto,
		baseAmountNet: participant.priceSnapshot?.basePrice,
		discountTotal: participant.priceSnapshot?.discountTotal,
		discountReason: participant.priceSnapshot?.manualAdjustment?.reason,
		vatRatePercent: participant.proforma?.vatRate ?? 23,
	});
	const totalNetto = roundMoney(positions.reduce((sum, pos) => sum + pos.netto, 0));
	const totalBrutto = roundMoney(positions.reduce((sum, pos) => sum + pos.brutto, 0));
	const vatTotal = roundMoney(totalBrutto - totalNetto);
	const startAllowed = canStartFiscalPrint(fiscalStatus) && !busy;
	const reprintAllowed = canReprint(fiscalStatus) && !busy;
	const showErrorActions = fiscalStatus === 'failed' || openFailed;

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 720 }}>
			<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
				<Button
					component={Link}
					href={fillPath(Paths.adminCourseDates, { courseId, dateId })}
					size='small'
					variant='outlined'
				>
					← Termin
				</Button>
			</Box>

			<Typography variant='h3'>Druk paragonu fiskalnego</Typography>
			<Typography variant='body2' color='text.secondary'>
				{participant.name} · {participant.email}
			</Typography>

			<HardShadow sx={{ p: 2.5, bgcolor: 'background.paper' }}>
				<Stack spacing={1.5}>
					<Typography sx={{ fontWeight: 700 }}>
						{participant.fakturownia.number ?? participant.proforma?.number ?? 'Paragon'}
					</Typography>
					<Typography variant='body2' color='text.secondary'>
						Data: {formatDate(participant.fakturownia.createdAt)}
					</Typography>
					<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
						<Chip
							size='small'
							label={`Status: ${FISCAL_STATUS_LABELS[fiscalStatus]}`}
							color={
								fiscalStatus === 'printed'
									? 'success'
									: fiscalStatus === 'failed'
										? 'error'
										: 'default'
							}
						/>
						<Chip
							size='small'
							variant='outlined'
							label={`Drukarka: ${PRINTER_UI_STATUS_LABELS[printerStatus]}`}
							color={
								printerStatus === 'ready'
									? 'success'
									: printerStatus === 'busy'
										? 'warning'
										: 'error'
							}
						/>
					</Box>
				</Stack>
			</HardShadow>

			<HardShadow sx={{ p: 2.5, bgcolor: 'background.paper' }}>
				<Typography sx={{ fontWeight: 700, mb: 1.5 }}>Pozycje</Typography>
				<Table size='small'>
					<TableHead>
						<TableRow>
							<TableCell>Nazwa</TableCell>
							<TableCell align='right'>Ilość</TableCell>
							<TableCell align='right'>Netto</TableCell>
							<TableCell align='right'>VAT</TableCell>
							<TableCell align='right'>Brutto</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{positions.map((pos) => {
							const vat = roundMoney(pos.brutto - pos.netto);
							return (
								<TableRow key={pos.key}>
									<TableCell>{pos.title}</TableCell>
									<TableCell align='right'>{pos.qty}</TableCell>
									<TableCell align='right'>{formatMoney(pos.netto)}</TableCell>
									<TableCell align='right'>{formatMoney(vat)}</TableCell>
									<TableCell align='right'>{formatMoney(pos.brutto)}</TableCell>
								</TableRow>
							);
						})}
						<TableRow>
							<TableCell colSpan={2} sx={{ fontWeight: 700 }}>
								Razem
							</TableCell>
							<TableCell align='right' sx={{ fontWeight: 700 }}>
								{formatMoney(totalNetto)}
							</TableCell>
							<TableCell align='right' sx={{ fontWeight: 700 }}>
								{formatMoney(vatTotal)}
							</TableCell>
							<TableCell align='right'>
								<Price amount={totalNetto} basis='netto' size='inline' />
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</HardShadow>

			<FormControlLabel
				control={
					<Switch
						checked={autoPrint}
						onChange={(_, checked) => {
							setAutoPrint(checked);
							writeAutoPrintPreference(checked);
						}}
					/>
				}
				label='Drukuj automatycznie po otwarciu'
			/>

			{message ? (
				<Alert severity={fiscalStatus === 'failed' || openFailed ? 'error' : 'info'}>
					{message}
				</Alert>
			) : null}

			<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
				{startAllowed || showErrorActions ? (
					<Button variant='contained' disabled={!startAllowed} onClick={() => void runPrint('print')}>
						{busy ? 'Drukowanie…' : 'Drukuj paragon fiskalny'}
					</Button>
				) : null}
				{reprintAllowed ? (
					<Button variant='outlined' disabled={busy} onClick={() => setConfirmReprintOpen(true)}>
						Drukuj kopię
					</Button>
				) : null}
			</Box>

			<ConfirmDialog
				open={confirmReprintOpen}
				title='Wydrukować kopię paragonu?'
				cancelLabel='Anuluj'
				confirmLabel='Drukuj kopię'
				onCancel={() => setConfirmReprintOpen(false)}
				onConfirm={() => {
					setConfirmReprintOpen(false);
					void runPrint('reprint');
				}}
			>
				<Typography>
					Paragon był już oznaczony jako wydrukowany. Zostanie otwarty ten sam dokument w
					Fakturowni (kopia) — nie powstanie drugi paragon.
				</Typography>
			</ConfirmDialog>
		</Box>
	);
};

const fillPath = (template: string, params: Record<string, string>): string =>
	Object.entries(params).reduce((acc, [key, value]) => acc.replace(`$${key}`, value), template);