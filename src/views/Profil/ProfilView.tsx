'use client';

import { useAuthUser } from '@hooks';
import { getUserProfile, saveUserProfile } from '@services/users';
import { type ProfileFormValues, profileSchema } from '@/utils/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, CircularProgress, Stack, TextField, Typography } from '@ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

export const ProfilView = () => {
	const user = useAuthUser();
	const queryClient = useQueryClient();
	const [saved, setSaved] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const { data: profile, isLoading } = useQuery({
		queryKey: ['userProfile', user?.uid],
		queryFn: getUserProfile,
		enabled: Boolean(user),
	});

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<ProfileFormValues>({
		resolver: zodResolver(profileSchema),
		defaultValues: { displayName: '', phone: '', nip: '' },
	});

	useEffect(() => {
		if (profile) {
			reset({
				displayName: profile.displayName || user?.displayName || '',
				phone: profile.phoneNumber || '',
				nip: profile.nip || '',
			});
		} else if (user) {
			reset({
				displayName: user.displayName || '',
				phone: user.phoneNumber || '',
				nip: '',
			});
		}
	}, [profile, user, reset]);

	if (!user || isLoading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box sx={{ maxWidth: 480 }}>
			<Typography variant='h5' component='h1' gutterBottom>
				Mój profil
			</Typography>
			<Stack
				component='form'
				spacing={2}
				onSubmit={handleSubmit(async (values) => {
					setError(null);
					setSaved(false);
					try {
						await saveUserProfile({
							displayName: values.displayName,
							phoneNumber: values.phone || undefined,
							nip: values.nip || undefined,
						});
						setSaved(true);
						await queryClient.invalidateQueries({ queryKey: ['userProfile'] });
					} catch (err) {
						setError(err instanceof Error ? err.message : 'Nie udało się zapisać.');
					}
				})}
			>
				<Controller
					name='displayName'
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							label='Imię i nazwisko'
							fullWidth
							error={Boolean(errors.displayName)}
							helperText={errors.displayName?.message}
						/>
					)}
				/>
				<Controller
					name='phone'
					control={control}
					render={({ field }) => <TextField {...field} label='Telefon' fullWidth />}
				/>
				<Controller
					name='nip'
					control={control}
					render={({ field }) => <TextField {...field} label='NIP' fullWidth />}
				/>
				<Typography variant='body2' color='text.secondary'>
					E-mail: {user.email}
				</Typography>
				{error ? (
					<Typography color='error' variant='body2'>
						{error}
					</Typography>
				) : null}
				{saved ? (
					<Typography color='success.main' variant='body2'>
						Zapisano.
					</Typography>
				) : null}
				<Button type='submit' variant='contained' disabled={isSubmitting}>
					Zapisz
				</Button>
			</Stack>
		</Box>
	);
};
