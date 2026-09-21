'use client';

import { Paths } from '@constants/paths';
import { confirmPasswordResetWithCode, verifyPasswordResetOobCode } from '@services/auth';
import { Box, Button, Stack, TextField, Typography } from '@ui';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export const ResetHaslaView = () => {
	const searchParams = useSearchParams();
	const oobCode = searchParams.get('oobCode') ?? '';
	const router = useRouter();
	const [email, setEmail] = useState<string | null>(null);
	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [verifying, setVerifying] = useState(Boolean(oobCode));

	useEffect(() => {
		if (!oobCode) {
			router.replace(`${Paths.login}?reset=1`);
			return;
		}
		let cancelled = false;
		void verifyPasswordResetOobCode(oobCode)
			.then((resolvedEmail) => {
				if (!cancelled) {
					setEmail(resolvedEmail);
					setVerifying(false);
				}
			})
			.catch((err) => {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : 'Link resetu jest nieprawidłowy lub wygasł.');
					setVerifying(false);
				}
			});
		return () => {
			cancelled = true;
		};
	}, [oobCode, router]);

	if (!oobCode) {
		return null;
	}

	return (
		<Box sx={{ px: 2, py: 6, maxWidth: 420, mx: 'auto' }}>
			<Typography variant='h4' component='h1' gutterBottom>
				Ustaw nowe hasło
			</Typography>
			{email ? (
				<Typography color='text.secondary' sx={{ mb: 2 }}>
					Konto: {email}
				</Typography>
			) : null}
			{verifying ? (
				<Typography color='text.secondary'>Sprawdzanie linku…</Typography>
			) : error && !email ? (
				<Typography color='error'>{error}</Typography>
			) : (
				<Stack
					component='form'
					spacing={2}
					onSubmit={async (e) => {
						e.preventDefault();
						if (password.length < 8) {
							setError('Hasło musi mieć co najmniej 8 znaków.');
							return;
						}
						if (password !== confirm) {
							setError('Hasła nie są identyczne.');
							return;
						}
						setLoading(true);
						setError(null);
						try {
							await confirmPasswordResetWithCode(oobCode, password);
							router.push(`${Paths.login}?reset=1`);
						} catch (err) {
							setError(err instanceof Error ? err.message : 'Nie udało się zmienić hasła.');
						} finally {
							setLoading(false);
						}
					}}
				>
					<TextField
						label='Nowe hasło'
						type='password'
						fullWidth
						required
						autoComplete='new-password'
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						helperText='Minimum 8 znaków'
					/>
					<TextField
						label='Powtórz hasło'
						type='password'
						fullWidth
						required
						autoComplete='new-password'
						value={confirm}
						onChange={(e) => setConfirm(e.target.value)}
					/>
					{error ? (
						<Typography color='error' variant='body2'>
							{error}
						</Typography>
					) : null}
					<Button type='submit' variant='contained' disabled={loading}>
						Zapisz hasło
					</Button>
				</Stack>
			)}
		</Box>
	);
};
