'use client';

import { Paths } from '@constants/paths';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthUser } from '@hooks';
import { sendEmailSignInLink, signInWithEmail, signInWithGoogle } from '@services/auth';
import { Box, Button, Link, MotionAlert, Stack, TextField, Typography } from '@ui';
import NextLink from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { AuthBusyButton } from '@/components/AuthBusyButton';
import { AuthEnrollmentSummary } from '@/components/AuthEnrollmentSummary';
import { AuthModeSwitch } from '@/components/AuthModeSwitch';
import {
	buildPostAuthPath,
	safeRedirectPath,
	storeAuthReturnPath,
	withAuthReturnQuery,
} from '@/utils/paths';
import { type LoginFormValues, loginSchema } from '@/utils/schemas';

type LoginMethod = 'password' | 'link';

export const LoginView = () => {
	const user = useAuthUser();
	const router = useRouter();
	const searchParams = useSearchParams();
	const redirectParam = searchParams.get('redirect');
	const termin = searchParams.get('termin');
	const redirectTo = buildPostAuthPath(redirectParam, termin, Paths.profil);
	const authRedirect = safeRedirectPath(redirectParam, Paths.profil);
	const justReset = searchParams.get('reset') === '1';
	const hasEnrollment = Boolean(termin);
	const [method, setMethod] = useState<LoginMethod>('password');
	const [error, setError] = useState<string | null>(null);
	const [linkSent, setLinkSent] = useState(false);
	const [linkLoading, setLinkLoading] = useState(false);
	const [googleLoading, setGoogleLoading] = useState(false);

	const {
		control,
		handleSubmit,
		getValues,
		trigger,
		formState: { errors, isSubmitting },
	} = useForm<LoginFormValues>({
		resolver: zodResolver(loginSchema),
		mode: 'onBlur',
		defaultValues: { email: '', password: '' },
	});

	useEffect(() => {
		if (user) router.replace(redirectTo);
	}, [user, router, redirectTo]);

	const busy = isSubmitting || linkLoading || googleLoading;

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

	const onSendLink = async () => {
		setError(null);
		setLinkSent(false);
		const emailOk = await trigger('email');
		if (!emailOk) return;
		setLinkLoading(true);
		try {
			const email = getValues('email');
			storeAuthReturnPath(redirectTo);
			await sendEmailSignInLink(email);
			setLinkSent(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Nie udało się wysłać linku.');
		} finally {
			setLinkLoading(false);
		}
	};

	return (
		<Box sx={{ px: 2, py: 6, maxWidth: 420, mx: 'auto' }}>
			{hasEnrollment ? (
				<AuthModeSwitch active='login' redirect={authRedirect} termin={termin} />
			) : null}
			<Typography variant='h4' component='h1' gutterBottom>
				Logowanie
			</Typography>
			<AuthEnrollmentSummary />
			{justReset ? (
				<Typography color='success.main' sx={{ mb: 2 }}>
					Hasło zostało ustawione. Możesz się zalogować.
				</Typography>
			) : null}

			<Box
				component='form'
				onSubmit={
					method === 'password'
						? handleSubmit(onSubmit)
						: (e) => {
								e.preventDefault();
								void onSendLink();
							}
				}
				autoComplete='off'
				sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
			>
				<Controller
					name='email'
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							label='E-mail *'
							type='email'
							fullWidth
							required
							error={Boolean(errors.email)}
							helperText={errors.email?.message}
						/>
					)}
				/>

				<Stack direction='row' spacing={1}>
					<Button
						type='button'
						fullWidth
						size='small'
						variant={method === 'password' ? 'contained' : 'outlined'}
						disabled={busy}
						onClick={() => setMethod('password')}
					>
						Zaloguj hasłem
					</Button>
					<Button
						type='button'
						fullWidth
						size='small'
						variant={method === 'link' ? 'contained' : 'outlined'}
						disabled={busy}
						onClick={() => setMethod('link')}
					>
						Wyślij link
					</Button>
				</Stack>

				{method === 'password' ? (
					<>
						<Controller
							name='password'
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label='Hasło *'
									type='password'
									fullWidth
									required
									error={Boolean(errors.password)}
									helperText={errors.password?.message}
								/>
							)}
						/>
						<Box sx={{ textAlign: 'right' }}>
							<Link
								component={NextLink}
								href={withAuthReturnQuery(Paths.przypomnijHaslo, {
									redirect: authRedirect,
									termin,
								})}
								underline='hover'
							>
								Nie pamiętasz hasła?
							</Link>
						</Box>
						<MotionAlert show={Boolean(error)} severity='error'>
							{error}
						</MotionAlert>
						<AuthBusyButton
							type='submit'
							variant='contained'
							fullWidth
							busy={isSubmitting}
							label='Zaloguj się'
							busyLabel='Logowanie…'
							slowHint='Trwa logowanie — pozostań na tej stronie.'
						/>
					</>
				) : (
					<>
						<MotionAlert show={Boolean(error)} severity='error'>
							{error}
						</MotionAlert>
						<AuthBusyButton
							type='button'
							variant='contained'
							fullWidth
							busy={linkLoading}
							label='Wyślij link do logowania'
							busyLabel='Wysyłanie…'
							slowHint='Wysyłamy link — pozostań na tej stronie.'
							onClick={() => void onSendLink()}
						/>
						{linkSent ? (
							<Typography variant='caption' color='success.main' sx={{ display: 'block' }}>
								Sprawdź skrzynkę — wysłaliśmy link do logowania.
							</Typography>
						) : null}
					</>
				)}
			</Box>

			<AuthBusyButton
				sx={{ mt: 2 }}
				fullWidth
				variant='outlined'
				busy={googleLoading}
				label='Zaloguj przez Google'
				busyLabel='Logowanie…'
				slowHint='Trwa logowanie — pozostań na tej stronie.'
				onClick={async () => {
					setError(null);
					setGoogleLoading(true);
					try {
						storeAuthReturnPath(redirectTo);
						await signInWithGoogle();
						router.push(redirectTo);
					} catch (err) {
						setError(err instanceof Error ? err.message : 'Błąd logowania Google.');
					} finally {
						setGoogleLoading(false);
					}
				}}
			/>

			{hasEnrollment ? null : (
				<Typography
					variant='body2'
					component='p'
					sx={{ mt: 4, mb: 0, textAlign: 'center', color: 'text.secondary' }}
				>
					Nie masz konta?
					<Link
						component={NextLink}
						href={withAuthReturnQuery(Paths.register, { redirect: authRedirect, termin })}
						underline='always'
						sx={{
							display: 'inline-block',
							ml: 1,
							fontWeight: 700,
							color: 'primary.main',
							fontSize: '1rem',
						}}
					>
						Zarejestruj się
					</Link>
				</Typography>
			)}
		</Box>
	);
};
