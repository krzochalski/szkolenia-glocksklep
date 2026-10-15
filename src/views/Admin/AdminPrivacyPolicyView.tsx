'use client';

import { AdminStickyActions } from '@components';
import { Paths } from '@constants/paths';
import {
	getPrivacyPolicy,
	savePrivacyPolicy,
	seedPrivacyPolicyIfMissing,
} from '@services/privacyPolicy';
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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

const DEFAULT_MARKDOWN = `# Polityka prywatności

Treść polityki prywatności zostanie uzupełniona.
`;

export const AdminPrivacyPolicyView = () => <PrivacyPolicyInner />;

const PrivacyPolicyInner = () => {
	const queryClient = useQueryClient();
	const { data, isLoading } = useQuery({
		queryKey: ['privacyPolicy'],
		queryFn: async () => {
			await seedPrivacyPolicyIfMissing();
			return getPrivacyPolicy();
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

	const isDirty = content !== savedContent;

	return (
		<ContentSwap state={isLoading ? 'loading' : 'content'}>
			{isLoading ? (
				<CircularProgress />
			) : (
				<Box sx={{ maxWidth: 960 }}>
					<Stack
						direction={{ xs: 'column', sm: 'row' }}
						sx={{ mb: 2, alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 1 }}
					>
						<Typography variant='h5'>Polityka prywatności</Typography>
						<Button
							component='a'
							href={Paths.politykaPrywatnosci}
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
						<Button
							variant='outlined'
							onClick={() => setResetOpen(true)}
							disabled={saving}
						>
							Przywróć domyślny
						</Button>
					</AdminStickyActions>

					<ConfirmDialog
						open={saveOpen}
						title='Potwierdź zapis polityki prywatności'
						cancelLabel='Anuluj'
						confirmLabel='Zapisz'
						confirmColor='primary'
						loading={saving}
						onCancel={() => setSaveOpen(false)}
						onConfirm={() => {
							setSaving(true);
							setMessage(null);
							void savePrivacyPolicy(content)
								.then(async () => {
									setSavedContent(content);
									setMessage('Zapisano.');
									setSaveOpen(false);
									await queryClient.invalidateQueries({ queryKey: ['privacyPolicy'] });
								})
								.finally(() => setSaving(false));
						}}
					>
						Czy na pewno chcesz opublikować nową treść polityki prywatności?
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
			)}
		</ContentSwap>
	);
};
