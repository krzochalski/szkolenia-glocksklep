'use client';

import { Paths } from '@constants/paths';
import {
	DEFAULT_ENROLLMENT_CONFIRMATION,
	getEnrollmentConfirmationTemplate,
	saveEnrollmentConfirmationTemplate,
	seedEnrollmentConfirmationTemplateIfMissing,
} from '@services/emailTemplates';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
	Box,
	Button,
	CircularProgress,
	ConfirmDialog,
	ContentSwap,
	MotionAlert,
	Stack,
	TextField,
	Typography,
} from '@ui';
import { OpenInNewIcon } from '@ui/icons';
import { useEffect, useState } from 'react';
import type { EnrollmentConfirmationWritable } from '@/types/emailTemplate';
import { ENROLLMENT_EMAIL_PLACEHOLDERS } from '@/types/emailTemplate';

const serialize = (doc: EnrollmentConfirmationWritable) => JSON.stringify(doc);

export const AdminEnrollmentEmailView = () => <EnrollmentEmailInner />;

const EnrollmentEmailInner = () => {
	const queryClient = useQueryClient();
	const { data, isLoading } = useQuery({
		queryKey: ['emailTemplates', 'enrollmentConfirmation'],
		queryFn: async () => {
			await seedEnrollmentConfirmationTemplateIfMissing();
			return getEnrollmentConfirmationTemplate();
		},
	});

	const [form, setForm] = useState<EnrollmentConfirmationWritable>({
		...DEFAULT_ENROLLMENT_CONFIRMATION,
	});
	const [savedSnapshot, setSavedSnapshot] = useState('');
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [saveOpen, setSaveOpen] = useState(false);
	const [resetOpen, setResetOpen] = useState(false);

	useEffect(() => {
		if (data) {
			const next: EnrollmentConfirmationWritable = {
				subject: data.subject,
				headline: data.headline,
				body: data.body,
			};
			setForm(next);
			setSavedSnapshot(serialize(next));
		}
	}, [data]);

	const isDirty = serialize(form) !== savedSnapshot;

	const patch = (partial: Partial<EnrollmentConfirmationWritable>) => {
		setForm((prev) => ({ ...prev, ...partial }));
	};

	return (
		<ContentSwap state={isLoading ? 'loading' : 'content'}>
			{isLoading ? (
				<CircularProgress />
			) : (
				<Box sx={{ maxWidth: 720 }}>
			<Stack
				direction={{ xs: 'column', sm: 'row' }}
				spacing={1}
				sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', mb: 2 }}
			>
				<Typography variant='h5'>E-mail po zapisie</Typography>
				<Button
					component='a'
					href={Paths.najblizszeSzkolenia}
					target='_blank'
					rel='noopener noreferrer'
					variant='outlined'
					size='small'
					endIcon={<OpenInNewIcon />}
				>
					Najbliższe szkolenia
				</Button>
			</Stack>

			<Typography color='text.secondary' sx={{ mb: 2 }}>
				Treść potwierdzenia wysyłanego po zapisie na termin. Placeholdery:
			</Typography>
			<Typography
				component='pre'
				variant='body2'
				sx={{
					fontFamily: 'Space Mono, monospace',
					bgcolor: 'surface.muted',
					p: 1.5,
					mb: 3,
					whiteSpace: 'pre-wrap',
				}}
			>
				{ENROLLMENT_EMAIL_PLACEHOLDERS.map((p) => `{{${p}}}`).join('  ')}
			</Typography>

			<Stack spacing={2} sx={{ mb: 3 }}>
				<TextField
					label='Temat'
					fullWidth
					value={form.subject}
					onChange={(e) => patch({ subject: e.target.value })}
					helperText='Np. Potwierdzenie zapisu — {{courseName}}'
				/>
				<TextField
					label='Nagłówek w mailu'
					fullWidth
					value={form.headline}
					onChange={(e) => patch({ headline: e.target.value })}
				/>
				<TextField
					label='Treść'
					fullWidth
					multiline
					minRows={10}
					value={form.body}
					onChange={(e) => patch({ body: e.target.value })}
					helperText='Zwykły tekst. Puste linie dzielą akapity.'
				/>
			</Stack>

			<MotionAlert show={Boolean(message)} severity='success' sx={{ mb: 1 }}>
				{message}
			</MotionAlert>
			<Stack direction='row' spacing={1}>
				<Button variant='contained' disabled={saving || !isDirty} onClick={() => setSaveOpen(true)}>
					Zapisz
				</Button>
				<Button variant='outlined' disabled={saving} onClick={() => setResetOpen(true)}>
					Przywróć domyślny
				</Button>
			</Stack>

			<ConfirmDialog
				open={saveOpen}
				title='Potwierdź zapis szablonu e-mail'
				cancelLabel='Anuluj'
				confirmLabel='Zapisz'
				confirmColor='primary'
				loading={saving}
				onCancel={() => setSaveOpen(false)}
				onConfirm={() => {
					setSaving(true);
					setMessage(null);
					const payload: EnrollmentConfirmationWritable = {
						subject: form.subject.trim() || DEFAULT_ENROLLMENT_CONFIRMATION.subject,
						headline: form.headline.trim() || DEFAULT_ENROLLMENT_CONFIRMATION.headline,
						body: form.body.trim() || DEFAULT_ENROLLMENT_CONFIRMATION.body,
					};
					void saveEnrollmentConfirmationTemplate(payload)
						.then(async () => {
							setForm(payload);
							setSavedSnapshot(serialize(payload));
							setMessage('Zapisano.');
							setSaveOpen(false);
							await queryClient.invalidateQueries({
								queryKey: ['emailTemplates', 'enrollmentConfirmation'],
							});
						})
						.finally(() => setSaving(false));
				}}
			>
				Czy na pewno chcesz opublikować nową treść e-maila potwierdzającego zapis?
			</ConfirmDialog>

			<ConfirmDialog
				open={resetOpen}
				title='Potwierdź przywrócenie domyślnego'
				cancelLabel='Anuluj'
				confirmLabel='Przywróć'
				confirmColor='warning'
				onCancel={() => setResetOpen(false)}
				onConfirm={() => {
					setForm({ ...DEFAULT_ENROLLMENT_CONFIRMATION });
					setResetOpen(false);
				}}
			>
				Czy na pewno chcesz zastąpić bieżącą treść domyślną? Zmiany nie zostaną zapisane, dopóki nie
				klikniesz „Zapisz”.
			</ConfirmDialog>
		</Box>
			)}
		</ContentSwap>
	);
};
