'use client';

import { Paths } from '@constants/paths';
import {
	applyEmailActionCode,
	inspectActionCode,
	verifyPasswordResetOobCode,
} from '@services/auth';
import { Box, CircularProgress, Typography } from '@ui';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Firebase custom email action handler.
 * Configure Console → Authentication → Templates → Customize action URL to:
 *   https://szkolenia.glocksklep.pl/auth/action
 */
export const AuthActionView = () => {
	const params = useSearchParams();
	const router = useRouter();
	const mode = params.get('mode');
	const oobCode = params.get('oobCode') ?? '';
	const continueUrl = params.get('continueUrl');
	const [message, setMessage] = useState('Przetwarzanie…');
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!oobCode) {
			setError('Brak kodu akcji w adresie URL.');
			return;
		}

		const run = async () => {
			try {
				if (mode === 'resetPassword') {
					await verifyPasswordResetOobCode(oobCode);
					const target = new URLSearchParams({ oobCode, mode: 'resetPassword' });
					router.replace(`${Paths.resetHasla}?${target.toString()}`);
					return;
				}

				if (mode === 'signIn') {
					const target = new URLSearchParams(window.location.search);
					router.replace(`${Paths.emailLink}?${target.toString()}`);
					return;
				}

				if (mode === 'verifyEmail' || mode === 'recoverEmail') {
					await inspectActionCode(oobCode);
					await applyEmailActionCode(oobCode);
					setMessage(
						mode === 'verifyEmail'
							? 'Adres e-mail został potwierdzony.'
							: 'Zmiana e-maila została cofnięta.'
					);
					window.setTimeout(() => {
						router.replace(continueUrl || Paths.login);
					}, 1500);
					return;
				}

				setError(`Nieobsługiwany tryb akcji: ${mode ?? 'brak'}.`);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Nie udało się wykonać akcji.');
			}
		};

		void run();
	}, [continueUrl, mode, oobCode, router]);

	return (
		<Box sx={{ px: 2, py: 6, maxWidth: 480, mx: 'auto', textAlign: 'center' }}>
			{error ? (
				<Typography color='error'>{error}</Typography>
			) : (
				<>
					<CircularProgress sx={{ mb: 2 }} />
					<Typography>{message}</Typography>
				</>
			)}
		</Box>
	);
};
