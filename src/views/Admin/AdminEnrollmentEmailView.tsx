'use client';

import { AdminStickyActions } from '@components';
import { Paths } from '@constants/paths';
import {
	getEmailTemplate,
	getEmailTemplateDefault,
	saveEmailTemplate,
	seedAllEmailTemplatesIfMissing,
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
import type { EmailTemplateId, EmailTemplateWritable } from '@/types/emailTemplate';
import { EMAIL_TEMPLATE_META } from '@/types/emailTemplate';

const serialize = (doc: EmailTemplateWritable) => JSON.stringify(doc);

const TEMPLATE_IDS = Object.keys(EMAIL_TEMPLATE_META) as EmailTemplateId[];

export const AdminEnrollmentEmailView = () => <EnrollmentEmailInner />;

const EnrollmentEmailInner = () => {
	const queryClient = useQueryClient();
	const [templateId, setTemplateId] = useState<EmailTemplateId>('enrollmentConfirmation');
	const meta = EMAIL_TEMPLATE_META[templateId];
	const defaults = getEmailTemplateDefault(templateId);

	const { data, isLoading } = useQuery({
		queryKey: ['emailTemplates', templateId],
		queryFn: async () => {
			await seedAllEmailTemplatesIfMissing();
			return getEmailTemplate(templateId);
		},
	});

	const [form, setForm] = useState<EmailTemplateWritable>(() => ({ ...defaults }));
	const [savedSnapshot, setSavedSnapshot] = useState('');
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [saveOpen, setSaveOpen] = useState(false);
	const [resetOpen, setResetOpen] = useState(false);
	const [pendingTemplateId, setPendingTemplateId] = useState<EmailTemplateId | null>(null);

	useEffect(() => {
		if (data) {
			const next: EmailTemplateWritable = {
				subject: data.subject,
				headline: data.headline,
				body: data.body,
			};
			setForm(next);
			setSavedSnapshot(serialize(next));
			setMessage(null);
		}
	}, [data]);

	const isDirty = serialize(form) !== savedSnapshot;

	const patch = (partial: Partial<EmailTemplateWritable>) => {
		setForm((prev) => ({ ...prev, ...partial }));
	};

	const switchTemplate = (nextId: EmailTemplateId) => {
		if (nextId === templateId) return;
		if (isDirty) {
			setPendingTemplateId(nextId);
			return;
		}
		setTemplateId(nextId);
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
						<Typography variant='h5'>Szablony e-mail</Typography>
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

					<Stack direction='row' spacing={1} sx={{ mb: 3, flexWrap: 'wrap' }}>
						{TEMPLATE_IDS.map((id) => (
							<Button
								key={id}
								size='small'
								variant={id === templateId ? 'contained' : 'outlined'}
								onClick={() => switchTemplate(id)}
							>
								{EMAIL_TEMPLATE_META[id].label}
							</Button>
						))}
					</Stack>

					<Typography color='text.secondary' sx={{ mb: 2 }}>
						{meta.description}
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
						{meta.placeholders.map((p) => `{{${p}}}`).join('  ')}
					</Typography>

					<Stack spacing={2} sx={{ mb: 3 }}>
						<TextField
							label='Temat'
							fullWidth
							value={form.subject}
							onChange={(e) => patch({ subject: e.target.value })}
							helperText={
								templateId === 'enrollmentConfirmation'
									? 'Np. Potwierdzenie zapisu — {{courseName}}'
									: 'Np. Dziękujemy — {{courseName}} ukończone'
							}
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
					<AdminStickyActions>
						<Button
							variant='contained'
							disabled={saving || !isDirty}
							onClick={() => setSaveOpen(true)}
						>
							Zapisz
						</Button>
						<Button variant='outlined' disabled={saving} onClick={() => setResetOpen(true)}>
							Przywróć domyślny
						</Button>
					</AdminStickyActions>

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
							const payload: EmailTemplateWritable = {
								subject: form.subject.trim() || defaults.subject,
								headline: form.headline.trim() || defaults.headline,
								body: form.body.trim() || defaults.body,
							};
							void saveEmailTemplate(templateId, payload)
								.then(async () => {
									setForm(payload);
									setSavedSnapshot(serialize(payload));
									setMessage('Zapisano.');
									setSaveOpen(false);
									await queryClient.invalidateQueries({
										queryKey: ['emailTemplates', templateId],
									});
								})
								.finally(() => setSaving(false));
						}}
					>
						Czy na pewno chcesz opublikować nową treść szablonu „{meta.label}”?
					</ConfirmDialog>

					<ConfirmDialog
						open={resetOpen}
						title='Potwierdź przywrócenie domyślnego'
						cancelLabel='Anuluj'
						confirmLabel='Przywróć'
						confirmColor='warning'
						onCancel={() => setResetOpen(false)}
						onConfirm={() => {
							setForm({ ...getEmailTemplateDefault(templateId) });
							setResetOpen(false);
						}}
					>
						Czy na pewno chcesz zastąpić bieżącą treść domyślną? Zmiany nie zostaną zapisane,
						dopóki nie klikniesz „Zapisz”.
					</ConfirmDialog>

					<ConfirmDialog
						open={Boolean(pendingTemplateId)}
						title='Niezapisane zmiany'
						cancelLabel='Zostań'
						confirmLabel='Porzuć zmiany'
						confirmColor='warning'
						onCancel={() => setPendingTemplateId(null)}
						onConfirm={() => {
							if (pendingTemplateId) {
								setTemplateId(pendingTemplateId);
								setPendingTemplateId(null);
							}
						}}
					>
						Masz niezapisane zmiany w tym szablonie. Przełączenie je porzuci.
					</ConfirmDialog>
				</Box>
			)}
		</ContentSwap>
	);
};
