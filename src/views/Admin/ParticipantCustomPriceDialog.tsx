'use client';
import { AdminDialog } from '@components';

import {
	Box,
	Button,
	Checkbox,
	CircularProgress,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	hardShadowDialogActionsSx,
	hardShadowDialogContentSx,
	hardShadowDialogTitleSx,
	MenuItem,
	MotionAlert,
	Price,
	TextField,
	Typography,
} from '@ui';
import { useEffect, useMemo, useState } from 'react';
import { NettoBruttoHint } from '@/components/NettoBruttoHint';
import type { ManualPriceAdjustmentType, Participant } from '@/types/course';
import {
	computeManualPrice,
	parseAdjustmentValue,
} from '@/utils/computeManualPrice';
import { bruttoFromNetto, roundMoney } from '@/utils/pricing';

export type ParticipantPriceSavePayload = {
	adjustment: { type: ManualPriceAdjustmentType; value: number } | null;
	reason?: string;
	note?: string;
	confirmPaidAdjustment?: boolean;
};

type Props = {
	readonly open: boolean;
	readonly participant: Participant | null;
	/** Catalog / date list price (netto) shown as reference. */
	readonly listNetto: number;
	readonly loading: boolean;
	readonly onClose: () => void;
	readonly onSave: (payload: ParticipantPriceSavePayload) => void;
};

const TYPE_LABELS: Record<ManualPriceAdjustmentType, string> = {
	finalPrice: 'Nowa cena końcowa (PLN netto)',
	percent: 'Rabat procentowy (%)',
	fixed: 'Rabat kwotowy (PLN netto)',
};

export const ParticipantCustomPriceDialog = ({
	open,
	participant,
	listNetto,
	loading,
	onClose,
	onSave,
}: Props) => {
	const [type, setType] = useState<ManualPriceAdjustmentType>('finalPrice');
	const [valueInput, setValueInput] = useState('');
	const [reason, setReason] = useState('');
	const [note, setNote] = useState('');
	const [confirmPaid, setConfirmPaid] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const currentNetto = useMemo(() => {
		if (!participant) return listNetto;
		return roundMoney(participant.customPrice ?? listNetto);
	}, [participant, listNetto]);

	useEffect(() => {
		if (!open || !participant) return;
		const snap = participant.priceSnapshot?.manualAdjustment;
		if (snap) {
			setType(snap.type);
			setValueInput(String(snap.value));
			setReason(snap.reason ?? participant.customPriceNote ?? '');
			setNote(snap.note ?? '');
		} else if (participant.customPrice != null) {
			setType('finalPrice');
			setValueInput(String(participant.customPrice));
			setReason(participant.customPriceNote ?? '');
			setNote('');
		} else {
			setType('finalPrice');
			setValueInput('');
			setReason('');
			setNote('');
		}
		setConfirmPaid(false);
		setError(null);
	}, [open, participant]);

	const preview = useMemo(() => {
		try {
			const parsed = parseAdjustmentValue(valueInput);
			if (parsed === null) return null;
			return computeManualPrice(listNetto, { type, value: parsed });
		} catch {
			return null;
		}
	}, [valueInput, type, listNetto]);

	const paid = participant?.paid === true;
	const newPrice = preview?.finalPrice;
	const priceChanges =
		newPrice != null && roundMoney(newPrice) !== roundMoney(currentNetto);

	const handleSave = () => {
		try {
			const parsed = parseAdjustmentValue(valueInput);
			if (parsed === null) {
				setError('Podaj wartość albo użyj „Wyczyść”.');
				return;
			}
			const reasonTrim = reason.trim();
			if (!reasonTrim) {
				setError('Podaj powód widoczny dla uczestnika (np. rabat indywidualny).');
				return;
			}
			const computed = computeManualPrice(listNetto, { type, value: parsed });
			if (paid && roundMoney(computed.finalPrice) !== roundMoney(currentNetto) && !confirmPaid) {
				setError(
					'Uczestnik jest oznaczony jako opłacony — potwierdź świadomą zmianę ceny.'
				);
				return;
			}
			setError(null);
			onSave({
				adjustment: { type, value: parsed },
				reason: reasonTrim,
				note: note.trim() || undefined,
				confirmPaidAdjustment: confirmPaid,
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Nieprawidłowa wartość.');
		}
	};

	const handleClear = () => {
		if (paid && roundMoney(currentNetto) !== roundMoney(listNetto) && !confirmPaid) {
			setError(
				'Uczestnik jest oznaczony jako opłacony — potwierdź świadomą zmianę ceny.'
			);
			return;
		}
		setError(null);
		onSave({
			adjustment: null,
			reason: 'Przywrócenie ceny z listy',
			note: note.trim() || undefined,
			confirmPaidAdjustment: confirmPaid,
		});
	};

	const hasCustom = participant?.customPrice != null;
	const titleName = participant?.name ?? 'uczestnika';
	const diff =
		preview != null ? roundMoney(preview.finalPrice - currentNetto) : null;

	return (
		<AdminDialog open={open} onClose={loading ? undefined : onClose} maxWidth='sm' fullWidth>
			<DialogTitle sx={hardShadowDialogTitleSx}>Zmień cenę — {titleName}</DialogTitle>
			<DialogContent sx={[hardShadowDialogContentSx, { gap: 2 }]}>
				<Typography variant='body2' color='text.secondary'>
					Cena z listy (termin / kurs):
				</Typography>
				<Price
					gross={bruttoFromNetto(listNetto)}
					net={roundMoney(listNetto)}
					size='sm'
					sx={{ display: 'block' }}
				/>
				<Typography variant='body2' color='text.secondary'>
					Aktualna cena uczestnika:
				</Typography>
				<Price
					gross={bruttoFromNetto(currentNetto)}
					net={roundMoney(currentNetto)}
					size='sm'
					sx={{ display: 'block' }}
				/>

				<TextField
					select
					label='Rodzaj korekty'
					fullWidth
					value={type}
					onChange={(e) => setType(e.target.value as ManualPriceAdjustmentType)}
					disabled={loading}
					size='small'
				>
					{(Object.keys(TYPE_LABELS) as ManualPriceAdjustmentType[]).map((key) => (
						<MenuItem key={key} value={key}>
							{TYPE_LABELS[key]}
						</MenuItem>
					))}
				</TextField>

				<Box>
					<TextField
						label={TYPE_LABELS[type]}
						type='number'
						fullWidth
						size='small'
						value={valueInput}
						onChange={(e) => setValueInput(e.target.value)}
						disabled={loading}
						slotProps={{
							htmlInput: {
								min: 0,
								step: type === 'percent' ? '1' : '0.01',
								max: type === 'percent' ? 100 : undefined,
							},
						}}
					/>
					{preview != null ? <NettoBruttoHint netto={preview.finalPrice} /> : null}
				</Box>

				{preview != null ? (
					<Box
						sx={{
							display: 'grid',
							gap: 0.5,
							p: 1.5,
							border: 2,
							borderColor: 'ink.main',
							bgcolor: 'surface.muted',
						}}
					>
						<Typography variant='caption' color='text.secondary'>
							Podgląd
						</Typography>
						<Typography variant='body2'>
							Cena bazowa: {roundMoney(listNetto).toFixed(2)} zł netto
						</Typography>
						<Typography variant='body2'>
							Aktualna: {roundMoney(currentNetto).toFixed(2)} zł netto
						</Typography>
						<Typography variant='body2'>
							Nowa: {preview.finalPrice.toFixed(2)} zł netto
							{preview.discountTotal > 0
								? ` (rabat ${preview.discountTotal.toFixed(2)} zł)`
								: ''}
						</Typography>
						{diff != null ? (
							<Typography variant='body2' sx={{ fontWeight: 700 }}>
								Różnica: {diff >= 0 ? '+' : ''}
								{diff.toFixed(2)} zł netto
							</Typography>
						) : null}
					</Box>
				) : null}

				<TextField
					label='Powód (widoczny dla klienta)'
					fullWidth
					size='small'
					required
					value={reason}
					onChange={(e) => setReason(e.target.value)}
					disabled={loading}
					placeholder='np. Zniżka dla służb mundurowych'
					helperText='Trafi na proformę i do e-maila.'
				/>
				<TextField
					label='Notatka wewnętrzna (opcjonalnie)'
					fullWidth
					size='small'
					multiline
					minRows={2}
					value={note}
					onChange={(e) => setNote(e.target.value)}
					disabled={loading}
					placeholder='tylko dla admina'
				/>

				{paid ? (
					<Box sx={{ display: 'grid', gap: 1 }}>
						<MotionAlert show severity='warning'>
							Uczestnik jest oznaczony jako opłacony. Zmiana ceny nie uruchamia
							automatycznego zwrotu — nadpłatę rozliczasz ręcznie.
						</MotionAlert>
						<FormControlLabel
							control={
								<Checkbox
									checked={confirmPaid}
									onChange={(e) => setConfirmPaid(e.target.checked)}
									disabled={loading}
								/>
							}
							label='Potwierdzam zmianę ceny mimo statusu „opłacone”'
						/>
					</Box>
				) : null}

				<MotionAlert show={Boolean(error)} severity='error'>
					{error}
				</MotionAlert>
			</DialogContent>
			<DialogActions sx={hardShadowDialogActionsSx}>
				<Button onClick={onClose} disabled={loading}>
					Anuluj
				</Button>
				{hasCustom ? (
					<Button color='warning' onClick={handleClear} disabled={loading}>
						Wyczyść
					</Button>
				) : null}
				<Button
					variant='contained'
					onClick={handleSave}
					disabled={loading || (paid && priceChanges && !confirmPaid && preview != null)}
				>
					{loading ? <CircularProgress size={14} /> : 'Zapisz i wyślij proformę'}
				</Button>
			</DialogActions>
		</AdminDialog>
	);
};
