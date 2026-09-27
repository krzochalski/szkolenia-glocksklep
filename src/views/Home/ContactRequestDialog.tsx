'use client';

import {
	CONTACT_REQUEST_DEFAULT_MESSAGES,
	CONTACT_REQUEST_FORMAT_LABELS,
} from '@constants/contactRequest';
import { submitContactRequest } from '@services/contactRequests';
import type { ContactRequestFormat } from '@/types/contactRequest';
import {
	type ContactRequestFormValues,
	contactRequestSchema,
} from '@/utils/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	Button,
	CircularProgress,
	DialogActions,
	DialogContent,
	DialogTitle,
	HardShadowDialog,
	Stack,
	TextField,
	Typography,
	hardShadowDialogActionsSx,
	hardShadowDialogContentSx,
	hardShadowDialogTitleSx,
} from '@ui';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

type ContactRequestDialogProps = {
	readonly open: boolean;
	readonly format: ContactRequestFormat | null;
	readonly onClose: () => void;
	readonly onSuccess?: () => void;
};

export const ContactRequestDialog = ({
	open,
	format,
	onClose,
	onSuccess,
}: ContactRequestDialogProps) => {
	const [error, setError] = useState<string | null>(null);

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<ContactRequestFormValues>({
		resolver: zodResolver(contactRequestSchema),
		defaultValues: {
			email: '',
			phone: '',
			message: '',
		},
	});

	useEffect(() => {
		if (open && format) {
			setError(null);
			reset({
				email: '',
				phone: '',
				message: CONTACT_REQUEST_DEFAULT_MESSAGES[format],
			});
		}
	}, [open, format, reset]);

	const onSubmit = async (values: ContactRequestFormValues) => {
		if (!format) return;
		setError(null);
		try {
			const phone = values.phone?.trim();
			await submitContactRequest({
				format,
				email: values.email,
				...(phone ? { phone } : {}),
				message: values.message,
			});
			onSuccess?.();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Nie udało się wysłać zgłoszenia.');
		}
	};

	const title = format
		? `Zostaw kontakt — ${CONTACT_REQUEST_FORMAT_LABELS[format]}`
		: 'Zostaw kontakt';

	return (
		<HardShadowDialog
			open={open}
			onClose={isSubmitting ? undefined : onClose}
			fullWidth
			maxWidth='sm'
		>
			<DialogTitle sx={hardShadowDialogTitleSx}>{title}</DialogTitle>
			<DialogContent sx={hardShadowDialogContentSx}>
				<Stack
					component='form'
					id='contact-request-form'
					spacing={2}
					onSubmit={handleSubmit(onSubmit)}
					sx={{ pt: 1 }}
				>
					<Typography color='text.secondary' variant='body2'>
						Podaj e-mail i opcjonalnie telefon — odezwiemy się w sprawie terminu.
					</Typography>
					<Controller
						name='email'
						control={control}
						render={({ field }) => (
							<TextField
								{...field}
								label='E-mail'
								type='email'
								fullWidth
								required
								autoComplete='email'
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
								label='Telefon (opcjonalnie)'
								type='tel'
								fullWidth
								autoComplete='tel'
								error={Boolean(errors.phone)}
								helperText={errors.phone?.message}
							/>
						)}
					/>
					<Controller
						name='message'
						control={control}
						render={({ field }) => (
							<TextField
								{...field}
								label='Wiadomość'
								fullWidth
								multiline
								minRows={3}
								error={Boolean(errors.message)}
								helperText={errors.message?.message}
							/>
						)}
					/>
					{error ? (
						<Typography color='error' variant='body2'>
							{error}
						</Typography>
					) : null}
				</Stack>
			</DialogContent>
			<DialogActions sx={hardShadowDialogActionsSx}>
				<Button onClick={onClose} disabled={isSubmitting} variant='outlined'>
					Anuluj
				</Button>
				<Button
					type='submit'
					form='contact-request-form'
					variant='contained'
					disabled={isSubmitting || !format}
				>
					{isSubmitting ? <CircularProgress size={16} color='inherit' /> : 'Wyślij'}
				</Button>
			</DialogActions>
		</HardShadowDialog>
	);
};
