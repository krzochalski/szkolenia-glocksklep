'use client';

import { Paths } from '@constants/paths';
import { registerWithEmail } from '@services/auth';
import { type RegisterFormValues, registerSchema } from '@/utils/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	Box,
	Button,
	Checkbox,
	FormControlLabel,
	Link,
	Stack,
	TextField,
	Typography,
} from '@ui';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

export const RegisterView = () => {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);

	const {
		control,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<RegisterFormValues>({
		resolver: zodResolver(registerSchema),
		defaultValues: { fullName: '', email: '', phone: '', terms: false },
	});

	const onSubmit = async (values: RegisterFormValues) => {
		setError(null);
		try {
			await registerWithEmail(values.email, values.fullName, values.phone);
			router.push(Paths.kontoUtworzone);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Błąd rejestracji.');
		}
	};

	return (
		<Box sx={{ px: 2, py: 6, maxWidth: 420, mx: 'auto' }}>
			<Typography variant='h4' component='h1' gutterBottom>
				Rejestracja
			</Typography>
			<Stack component='form' spacing={2} onSubmit={handleSubmit(onSubmit)}>
				<Controller
					name='fullName'
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							label='Imię i nazwisko'
							fullWidth
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
							label='E-mail'
							type='email'
							fullWidth
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
							label='Telefon'
							fullWidth
							error={Boolean(errors.phone)}
							helperText={errors.phone?.message}
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
									</Link>
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
				{error ? (
					<Typography color='error' variant='body2'>
						{error}
					</Typography>
				) : null}
				<Button type='submit' variant='contained' fullWidth disabled={isSubmitting}>
					Utwórz konto
				</Button>
			</Stack>
			<Typography variant='body2' sx={{ mt: 3, textAlign: 'center' }}>
				Masz już konto?{' '}
				<Link component={NextLink} href={Paths.login}>
					Zaloguj się
				</Link>
			</Typography>
		</Box>
	);
};
