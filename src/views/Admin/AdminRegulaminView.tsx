'use client';

import { Paths } from '@constants/paths';
import {
	getRegulamin,
	saveRegulamin,
	seedRegulaminIfMissing,
} from '@services/regulamin';
import { Box, Button, CircularProgress, ConfirmDialog, Stack, TextField, Typography } from '@ui';
import { OpenInNewIcon } from '@ui/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { AdminGate } from './AdminGate';

const DEFAULT_MARKDOWN = `# Regulamin

Treść regulaminu zostanie uzupełniona.
`;

export const AdminRegulaminView = () => (
	<AdminGate>
		<RegulaminInner />
	</AdminGate>
);

const RegulaminInner = () => {
	const queryClient = useQueryClient();
	const { data, isLoading } = useQuery({
		queryKey: ['regulamin'],
		queryFn: async () => {
			await seedRegulaminIfMissing();
			return getRegulamin();
		},
	});
	const [content, setContent] = useState('');
	const [savedContent, setSavedContent] = useState('');
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [saveOpen, setSaveOpen] = useState(false);
	const [resetOpen, setResetOpen] = useState(false);

	useEffect(() => {
		if (data) {
			setContent(data.content);
			setSavedContent(data.content);
		}
	}, [data]);

	if (isLoading) return <CircularProgress />;

	const isDirty = content !== savedContent;

	return (
		<Box sx={{ maxWidth: 960 }}>
			<Stack
				direction={{ xs: 'column', sm: 'row' }}
				sx={{ mb: 2, alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 1 }}
			>
				<Typography variant='h5'>Regulamin</Typography>
				<Button
					component='a'
					href={Paths.regulamin}
					target='_blank'
					rel='noopener noreferrer'
					startIcon={<OpenInNewIcon />}
					size='small'
				>
					Podgląd strony
				</Button>
			</Stack>
			{data?.updatedAt ? (
				<Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1 }}>
					Ostatnia aktualizacja: {new Date(data.updatedAt).toLocaleString('pl-PL')}
				</Typography>
			) : null}
			<TextField
				fullWidth
				multiline
				minRows={20}
				value={content}
				onChange={(e) => setContent(e.target.value)}
				sx={{ mb: 2, '& textarea': { fontFamily: 'var(--font-mono, monospace)' } }}
			/>
			{message ? (
				<Typography color='success.main' variant='body2' sx={{ mb: 1 }}>
					{message}
				</Typography>
			) : null}
			<Stack direction='row' spacing={1}>
				<Button
					variant='contained'
					disabled={saving || !isDirty}
					onClick={() => setSaveOpen(true)}
				>
					Zapisz
				</Button>
				<Button
					variant='outlined'
					onClick={() => setResetOpen(true)}
					disabled={saving}
				>
					Przywróć domyślny
				</Button>
			</Stack>

			<ConfirmDialog
				open={saveOpen}
				title='Potwierdź zapis regulaminu'
				cancelLabel='Anuluj'
				confirmLabel='Zapisz'
				confirmColor='primary'
				loading={saving}
				onCancel={() => setSaveOpen(false)}
				onConfirm={() => {
					setSaving(true);
					setMessage(null);
					void saveRegulamin(content)
						.then(async () => {
							setSavedContent(content);
							setMessage('Zapisano.');
							setSaveOpen(false);
							await queryClient.invalidateQueries({ queryKey: ['regulamin'] });
						})
						.finally(() => setSaving(false));
				}}
			>
				Czy na pewno chcesz opublikować nową treść regulaminu?
			</ConfirmDialog>

			<ConfirmDialog
				open={resetOpen}
				title='Potwierdź przywrócenie domyślnego'
				cancelLabel='Anuluj'
				confirmLabel='Przywróć'
				confirmColor='warning'
				onCancel={() => setResetOpen(false)}
				onConfirm={() => {
					setContent(DEFAULT_MARKDOWN);
					setResetOpen(false);
				}}
			>
				Czy na pewno chcesz zastąpić bieżącą treść domyślnym szablonem? Zmiany nie zostaną
				zapisane, dopóki nie klikniesz „Zapisz”.
			</ConfirmDialog>
		</Box>
	);
};
