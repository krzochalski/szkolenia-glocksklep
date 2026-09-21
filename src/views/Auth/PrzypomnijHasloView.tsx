'use client';

import { Paths } from '@constants/paths';
import { sendPasswordReset } from '@services/auth';
import { Box, Button, Link, Stack, TextField, Typography } from '@ui';
import NextLink from 'next/link';
import { useState } from 'react';

export const PrzypomnijHasloView = () => {
	const [email, setEmail] = useState('');
	const [sent, setSent] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	return (
		<Box sx={{ px: 2, py: 6, maxWidth: 420, mx: 'auto' }}>
			<Typography variant='h4' component='h1' gutterBottom>
				Przypomnij hasło
			</Typography>
			{sent ? (
				<Typography color='success.main'>
					Jeśli konto istnieje, wysłaliśmy link do resetu hasła.
				</Typography>
			) : (
				<Stack
					component='form'
					spacing={2}
					onSubmit={async (e) => {
						e.preventDefault();
						setLoading(true);
						setError(null);
						try {
							await sendPasswordReset(email);
							setSent(true);
						} catch (err) {
							setError(err instanceof Error ? err.message : 'Błąd wysyłki.');
						} finally {
							setLoading(false);
						}
					}}
				>
					<TextField
						label='E-mail'
						type='email'
						fullWidth
						required
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>
					{error ? (
						<Typography color='error' variant='body2'>
							{error}
						</Typography>
					) : null}
					<Button type='submit' variant='contained' disabled={loading}>
						Wyślij link
					</Button>
				</Stack>
			)}
			<Typography variant='body2' sx={{ mt: 3 }}>
				<Link component={NextLink} href={Paths.login}>
					Wróć do logowania
				</Link>
			</Typography>
		</Box>
	);
};
