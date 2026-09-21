'use client';

import { Paths } from '@constants/paths';
import { useAuthUser } from '@hooks';
import {
	sendEmailSignInLink,
	signInWithEmail,
	signInWithGoogle,
} from '@services/auth';
import { type LoginFormValues, loginSchema } from '@/utils/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Link, Stack, TextField, Typography } from '@ui';
import NextLink from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

export const LoginView = () => {
	const user = useAuthUser();
	const router = useRouter();
	const searchParams = useSearchParams();
	const redirectTo = searchParams.get('redirect') || Paths.profil;
	const justReset = searchParams.get('reset') === '1';
	const [error, setError] = useState<string | null>(null);
	const [linkSent, setLinkSent] = useState(false);
	const [linkEmail, setLinkEmail] = useState('');

	const {
		control,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<LoginFormValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: { email: '', password: '' },
	});

	useEffect(() => {
		if (user) router.replace(Paths.profil);
	}, [user, router]);

	if (user) return null;

	const onSubmit = async ({ email, password }: LoginFormValues) => {
		setError(null);
		try {
			await signInWithEmail(email, password);
			router.push(redirectTo);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Błąd logowania.');
		}
	};

	return (
		<Box sx={{ px: 2, py: 6, maxWidth: 420, mx: 'auto' }}>
			<Typography variant='h4' component='h1' gutterBottom>
				Logowanie
			</Typography>
			{justReset ? (
				<Typography color='success.main' sx={{ mb: 2 }}>
					Hasło zostało ustawione. Możesz się zalogować.
				</Typography>
			) : null}

			<Box
				component='form'
				onSubmit={handleSubmit(onSubmit)}
				autoComplete='off'
				sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
			>
				<Controller
					name='email'
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							label='E-mail'
							type='email'
							fullWidth
							error={Boolean(errors.email)}
							helperText={errors.email?.message}
						/>
					)}
				/>
				<Controller
					name='password'
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							label='Hasło'
							type='password'
							fullWidth
							error={Boolean(errors.password)}
							helperText={errors.password?.message}
						/>
					)}
				/>
				<Box sx={{ textAlign: 'right' }}>
					<Link component={NextLink} href={Paths.przypomnijHaslo} underline='hover'>
						Zapomniałeś hasła?
					</Link>
				</Box>
				{error ? (
					<Typography color='error' variant='body2'>
						{error}
					</Typography>
				) : null}
				<Button type='submit' variant='contained' fullWidth disabled={isSubmitting}>
					Zaloguj się
				</Button>
			</Box>

			<Button
				sx={{ mt: 2 }}
				fullWidth
				variant='outlined'
				onClick={async () => {
					setError(null);
					try {
						await signInWithGoogle();
						router.push(redirectTo);
					} catch (err) {
						setError(err instanceof Error ? err.message : 'Błąd logowania Google.');
					}
				}}
			>
				Zaloguj przez Google
			</Button>

			<Box sx={{ mt: 4 }}>
				<Typography variant='subtitle2' gutterBottom>
					Link magiczny (e-mail)
				</Typography>
				<Stack direction='row' spacing={1}>
					<TextField
						size='small'
						fullWidth
						label='E-mail'
						value={linkEmail}
						onChange={(e) => setLinkEmail(e.target.value)}
					/>
					<Button
						variant='outlined'
						onClick={async () => {
							setError(null);
							try {
								await sendEmailSignInLink(linkEmail);
								setLinkSent(true);
							} catch (err) {
								setError(err instanceof Error ? err.message : 'Nie udało się wysłać linku.');
							}
						}}
					>
						Wyślij
					</Button>
				</Stack>
				{linkSent ? (
					<Typography variant='caption' color='success.main' sx={{ mt: 1, display: 'block' }}>
						Sprawdź skrzynkę — wysłaliśmy link do logowania.
					</Typography>
				) : null}
			</Box>

			<Typography variant='body2' sx={{ mt: 3, textAlign: 'center' }}>
				Nie masz konta?{' '}
				<Link component={NextLink} href={Paths.register}>
					Zarejestruj się
				</Link>
			</Typography>
		</Box>
	);
};
