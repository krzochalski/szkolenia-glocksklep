'use client';

import { Paths } from '@constants/paths';
import { completeEmailLinkSignIn, EMAIL_LINK_STORAGE_KEY } from '@services/auth';
import { Box, Button, Stack, TextField, Typography } from '@ui';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export const EmailLinkView = () => {
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const stored = window.localStorage.getItem(EMAIL_LINK_STORAGE_KEY);
		if (stored) {
			setEmail(stored);
			void completeEmailLinkSignIn(stored)
				.then(() => router.replace(Paths.profil))
				.catch(() => {
					/* użytkownik musi podać e-mail ręcznie */
				});
		}
	}, [router]);

	const complete = async () => {
		setLoading(true);
		setError(null);
		try {
			await completeEmailLinkSignIn(email || undefined);
			router.replace(Paths.profil);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Nie udało się dokończyć logowania.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Box sx={{ px: 2, py: 6, maxWidth: 420, mx: 'auto' }}>
			<Typography variant='h4' component='h1' gutterBottom>
				Dokończ logowanie
			</Typography>
			<Typography color='text.secondary' sx={{ mb: 2 }}>
				Potwierdź e-mail użyty do wysłania linku.
			</Typography>
			<Stack spacing={2}>
				<TextField
					label='E-mail'
					type='email'
					fullWidth
					value={email}
					onChange={(e) => setEmail(e.target.value)}
				/>
				{error ? (
					<Typography color='error' variant='body2'>
						{error}
					</Typography>
				) : null}
				<Button variant='contained' disabled={loading || !email} onClick={() => void complete()}>
					Zaloguj
				</Button>
			</Stack>
		</Box>
	);
};
