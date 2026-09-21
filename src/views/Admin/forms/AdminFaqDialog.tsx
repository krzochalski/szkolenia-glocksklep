'use client';

import {
	Button,
	CircularProgress,
	DialogActions,
	DialogContent,
	DialogTitle,
	HardShadowDialog,
	hardShadowDialogActionsSx,
	hardShadowDialogContentSx,
	hardShadowDialogTitleSx,
	MenuItem,
	TextField,
	Typography,
} from '@ui';
import { useEffect, useState } from 'react';

export const FAQ_CATEGORY_OPTIONS = [
	{ value: 'rekrutacja', label: 'Rekrutacja i Zapisy' },
	{ value: 'sprzet', label: 'Sprzęt i Wyposażenie' },
	{ value: 'bezpieczenstwo', label: 'Bezpieczeństwo' },
	{ value: 'logistyka', label: 'Logistyka i Dojazd' },
] as const;

export type FaqFormData = {
	question: string;
	answer: string;
	linkHref: string;
	linkLabel: string;
	category: string;
};

export const emptyFaqForm: FaqFormData = {
	question: '',
	answer: '',
	linkHref: '',
	linkLabel: '',
	category: 'rekrutacja',
};

type AdminFaqDialogProps = {
	readonly open: boolean;
	readonly title: string;
	readonly initial: FaqFormData;
	readonly onClose: () => void;
	readonly onSubmit: (data: FaqFormData) => Promise<void>;
};

export const AdminFaqDialog = ({
	open,
	title,
	initial,
	onClose,
	onSubmit,
}: AdminFaqDialogProps) => {
	const [form, setForm] = useState<FaqFormData>(initial);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		setForm(initial);
	}, [initial]);

	const handleSubmit = async () => {
		setSubmitting(true);
		try {
			await onSubmit(form);
			onClose();
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<HardShadowDialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
			<DialogTitle sx={hardShadowDialogTitleSx}>{title}</DialogTitle>
			<DialogContent sx={[hardShadowDialogContentSx, { gap: 2 }]}>
				<Typography variant='body2' color='text.secondary'>
					Pytania FAQ wyświetlają się na publicznej stronie FAQ.
				</Typography>
				<TextField
					label='Pytanie'
					value={form.question}
					onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
					fullWidth
					required
				/>
				<TextField
					label='Odpowiedź'
					value={form.answer}
					onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
					fullWidth
					multiline
					minRows={3}
					required
				/>
				<TextField
					label='Kategoria'
					value={form.category}
					onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
					fullWidth
					select
					required
				>
					{FAQ_CATEGORY_OPTIONS.map((opt) => (
						<MenuItem key={opt.value} value={opt.value}>
							{opt.label}
						</MenuItem>
					))}
				</TextField>
				<TextField
					label='Link URL (opcjonalny)'
					value={form.linkHref}
					onChange={(e) => setForm((f) => ({ ...f, linkHref: e.target.value }))}
					fullWidth
					placeholder='https://...'
				/>
				<TextField
					label='Etykieta linku (opcjonalna)'
					value={form.linkLabel}
					onChange={(e) => setForm((f) => ({ ...f, linkLabel: e.target.value }))}
					fullWidth
					placeholder='Dowiedz się więcej →'
				/>
			</DialogContent>
			<DialogActions sx={hardShadowDialogActionsSx}>
				<Button onClick={onClose} disabled={submitting}>
					Anuluj
				</Button>
				<Button
					variant='contained'
					onClick={handleSubmit}
					disabled={submitting || !form.question.trim() || !form.answer.trim()}
				>
					{submitting ? <CircularProgress size={16} color='inherit' /> : 'Zapisz'}
				</Button>
			</DialogActions>
		</HardShadowDialog>
	);
};
