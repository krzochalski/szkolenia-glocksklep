'use client';

import {
	Box,
	Button,
	CircularProgress,
	DialogActions,
	DialogContent,
	DialogTitle,
	HardShadowDialog,
	hardShadowDialogActionsSx,
	hardShadowDialogContentSx,
	hardShadowDialogTitleSx,
	MotionAlert,
	Price,
	TextField,
	Typography,
} from '@ui';
import { useEffect, useState } from 'react';
import { NettoBruttoHint } from '@/components/NettoBruttoHint';
import type { Participant } from '@/types/course';
import { bruttoFromNetto, parseParticipantCustomPriceNetto, roundMoney } from '@/utils/pricing';

type Props = {
	readonly open: boolean;
	readonly participant: Participant | null;
	/** Catalog / date list price (netto) shown as reference. */
	readonly listNetto: number;
	readonly loading: boolean;
	readonly onClose: () => void;
	readonly onSave: (payload: { customPrice: number; note?: string }) => void;
	readonly onClear: () => void;
};

export const ParticipantCustomPriceDialog = ({
	open,
	participant,
	listNetto,
	loading,
	onClose,
	onSave,
	onClear,
}: Props) => {
	const [priceInput, setPriceInput] = useState('');
	const [note, setNote] = useState('');
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!open || !participant) return;
		setPriceInput(
			participant.customPrice != null ? String(participant.customPrice) : ''
		);
		setNote(participant.customPriceNote ?? '');
		setError(null);
	}, [open, participant]);

	const previewNetto = (() => {
		try {
			const parsed = parseParticipantCustomPriceNetto(priceInput);
			return parsed;
		} catch {
			return null;
		}
	})();

	const handleSave = () => {
		try {
			const parsed = parseParticipantCustomPriceNetto(priceInput);
			if (parsed === null) {
				setError('Podaj kwotę netto albo użyj „Wyczyść”.');
				return;
			}
			setError(null);
			onSave({ customPrice: parsed, note: note.trim() || undefined });
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Nieprawidłowa kwota.');
		}
	};

	const hasCustom = participant?.customPrice != null;
	const titleName = participant?.name ?? 'uczestnika';

	return (
		<HardShadowDialog open={open} onClose={loading ? undefined : onClose} maxWidth='sm' fullWidth>
			<DialogTitle sx={hardShadowDialogTitleSx}>Cena indywidualna — {titleName}</DialogTitle>
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
				<Box>
					<TextField
						label='Cena indywidualna netto (PLN)'
						type='number'
						fullWidth
						size='small'
						value={priceInput}
						onChange={(e) => setPriceInput(e.target.value)}
						disabled={loading}
						slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
						helperText='Puste pole + „Wyczyść” wraca do ceny z listy. 0 zł jest dozwolone.'
					/>
					{previewNetto != null ? <NettoBruttoHint netto={previewNetto} /> : null}
				</Box>
				<TextField
					label='Notatka (opcjonalnie)'
					fullWidth
					size='small'
					multiline
					minRows={2}
					value={note}
					onChange={(e) => setNote(e.target.value)}
					disabled={loading}
					placeholder='np. rabat partnerski, pakiet'
				/>
				<MotionAlert show={Boolean(error)} severity='error'>
					{error}
				</MotionAlert>
			</DialogContent>
			<DialogActions sx={hardShadowDialogActionsSx}>
				<Button onClick={onClose} disabled={loading}>
					Anuluj
				</Button>
				{hasCustom ? (
					<Button color='warning' onClick={onClear} disabled={loading}>
						Wyczyść
					</Button>
				) : null}
				<Button variant='contained' onClick={handleSave} disabled={loading}>
					{loading ? <CircularProgress size={14} /> : 'Zapisz'}
				</Button>
			</DialogActions>
		</HardShadowDialog>
	);
};
