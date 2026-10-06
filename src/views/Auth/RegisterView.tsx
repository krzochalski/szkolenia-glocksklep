'use client';

import { Paths } from '@constants/paths';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerWithEmail } from '@services/auth';
import {
	Box,
	Button,
	Checkbox,
	FormControlLabel,
	Link,
	MotionAlert,
	Stack,
	TextField,
	Typography,
} from '@ui';
import NextLink from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { AuthEnrollmentSummary } from '@/components/AuthEnrollmentSummary';
import { AuthModeSwitch } from '@/components/AuthModeSwitch';
import { safeRedirectPath, withAuthReturnQuery } from '@/utils/paths';
import { type RegisterFormValues, registerSchema } from '@/utils/schemas';

export const RegisterView = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const redirectParam = searchParams.get('redirect');
	const termin = searchParams.get('termin');
	const authRedirect = safeRedirectPath(redirectParam, Paths.profil);
	const hasEnrollment = Boolean(termin);
	const [error, setError] = useState<string | null>(null);

	const {
		control,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<RegisterFormValues>({
		resolver: zodResolver(registerSchema),
		mode: 'onBlur',
		defaultValues: { fullName: '', email: '', phone: '', terms: false },
	});

	const onSubmit = async (values: RegisterFormValues) => {
		setError(null);
		try {
			await registerWithEmail(values.email, values.fullName, values.phone);
			router.push(withAuthReturnQuery(Paths.kontoUtworzone, { redirect: authRedirect, termin }));
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Błąd rejestracji.');
		}
	};

	return (
		<Box sx={{ px: 2, py: 6, maxWidth: 420, mx: 'auto' }}>
			{hasEnrollment ? (
				<AuthModeSwitch active='register' redirect={authRedirect} termin={termin} />
			) : null}
			<Typography variant='h4' component='h1' gutterBottom>
				Rejestracja
			</Typography>
			<Typography color='text.secondary' sx={{ mb: 2 }}>
				Wyślemy Ci link do ustawienia hasła na e-mail.
			</Typography>
			<AuthEnrollmentSummary />
			<Stack component='form' spacing={2} onSubmit={handleSubmit(onSubmit)}>
				<Controller
					name='fullName'
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							label='Imię i nazwisko *'
							fullWidth
							required
							error={Boolean(errors.fullName)}
							helperText={errors.fullName?.message}
						/>
					)}
				/>
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
				<Controller
					name='phone'
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							label='Telefon *'
							fullWidth
							required
							error={Boolean(errors.phone)}
							helperText={errors.phone?.message ?? 'do kontaktu w dniu szkolenia'}
						/>
					)}
				/>
				<Controller
					name='terms'
					control={control}
					render={({ field }) => (
						<FormControlLabel
							control={<Checkbox checked={field.value} onChange={field.onChange} />}
							label={
								<>
									Akceptuję{' '}
									<Link component={NextLink} href={Paths.regulamin}>
										regulamin
									</Link>{' '}
									*
								</>
							}
						/>
					)}
				/>
				{errors.terms ? (
					<Typography color='error' variant='caption'>
						{errors.terms.message}
					</Typography>
				) : null}
				<MotionAlert show={Boolean(error)} severity='error'>
					{error}
				</MotionAlert>
				<Button type='submit' variant='contained' fullWidth disabled={isSubmitting}>
					Utwórz konto
				</Button>
			</Stack>
			{hasEnrollment ? null : (
				<Typography
					variant='body2'
					component='p'
					sx={{ mt: 4, mb: 0, textAlign: 'center', color: 'text.secondary' }}
				>
					Masz już konto?
					<Link
						component={NextLink}
						href={withAuthReturnQuery(Paths.login, { redirect: authRedirect, termin })}
						underline='always'
						sx={{
							display: 'inline-block',
							ml: 1,
							fontWeight: 700,
							color: 'primary.main',
							fontSize: '1rem',
						}}
					>
						Zaloguj się
					</Link>
				</Typography>
			)}
		</Box>
	);
};
