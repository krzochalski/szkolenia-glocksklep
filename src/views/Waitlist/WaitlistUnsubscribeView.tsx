'use client';

import { Paths } from '@constants/paths';
import { Box, Button, CircularProgress, PageColumn, Typography } from '@ui';
import NextLink from 'next/link';
import { useEffect, useState } from 'react';

type Props = {
	readonly token: string;
};

type Status = 'idle' | 'loading' | 'ok' | 'error';

export const WaitlistUnsubscribeView = ({ token }: Props) => {
	const [status, setStatus] = useState<Status>(token ? 'loading' : 'error');
	const [message, setMessage] = useState(
		token ? 'Trwa wypisywanie…' : 'Brak tokenu wypisania w linku.'
	);

	useEffect(() => {
		if (!token) return;
		let cancelled = false;
		const run = async () => {
			try {
				const res = await fetch('/api/waitlist-unsubscribe', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ token }),
				});
				const data = (await res.json().catch(() => ({}))) as {
					error?: string;
					removed?: boolean;
				};
				if (cancelled) return;
				if (!res.ok) {
					setStatus('error');
					setMessage(data.error || 'Nie udało się wypisać z listy.');
					return;
				}
				setStatus('ok');
				setMessage(
					data.removed
						? 'Wypisano Cię z listy oczekujących.'
						: 'Nie było już wpisu na liście — nic więcej nie trzeba robić.'
				);
			} catch {
				if (cancelled) return;
				setStatus('error');
				setMessage('Nie udało się wypisać z listy. Spróbuj później.');
			}
		};
		void run();
		return () => {
			cancelled = true;
		};
	}, [token]);

	return (
		<PageColumn>
			<Box sx={{ maxWidth: 520, mx: 'auto', py: 4 }}>
				<Typography variant='h4' component='h1' gutterBottom>
					Lista oczekujących
				</Typography>
				{status === 'loading' ? <CircularProgress size={28} sx={{ mb: 2 }} /> : null}
				<Typography
					color={status === 'error' ? 'error' : status === 'ok' ? 'success.main' : 'text.primary'}
					sx={{ mb: 3 }}
				>
					{message}
				</Typography>
				<Button component={NextLink} href={Paths.courses} variant='contained'>
					Przeglądaj szkolenia
				</Button>
			</Box>
		</PageColumn>
	);
};
