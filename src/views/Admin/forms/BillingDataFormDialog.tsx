'use client';

import { createBillingData, updateBillingData } from '@services/billingData';
import type { BillingData } from '@/types/billingData';
import type { Instructor } from '@/types/course';
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	HardShadowDialog,
	hardShadowDialogActionsSx,
	hardShadowDialogContentSx,
	hardShadowDialogTitleSx,
	MenuItem,
	TextField,
	Typography,
} from '@ui';
import { useEffect, useState } from 'react';

type BillingDataFormDialogProps = {
	readonly open: boolean;
	readonly billingData: BillingData | null;
	readonly instructors: Instructor[];
	readonly onClose: () => void;
	readonly onSaved: () => void;
};

type FormState = {
	instructorId: string;
	name: string;
	address: string;
	city: string;
	nip: string;
	website: string;
	phone: string;
	bankName: string;
	bankAccount: string;
	paymentMethod: string;
	issuePlace: string;
	vatRate: string;
};

const emptyForm = (): FormState => ({
	instructorId: '',
	name: '',
	address: '',
	city: '',
	nip: '',
	website: '',
	phone: '',
	bankName: '',
	bankAccount: '',
	paymentMethod: 'Przelew',
	issuePlace: '',
	vatRate: '23',
});

const fromDoc = (bd: BillingData): FormState => ({
	instructorId: bd.instructorId,
	name: bd.name,
	address: bd.address,
	city: bd.city,
	nip: bd.nip,
	website: bd.website ?? '',
	phone: bd.phone ?? '',
	bankName: bd.bankName,
	bankAccount: bd.bankAccount,
	paymentMethod: bd.paymentMethod,
	issuePlace: bd.issuePlace,
	vatRate: String(bd.vatRate),
});

export const BillingDataFormDialog = ({
	open,
	billingData,
	instructors,
	onClose,
	onSaved,
}: BillingDataFormDialogProps) => {
	const [form, setForm] = useState<FormState>(emptyForm());
	const [error, setError] = useState<string | null>(null);
	const [errors, setErrors] = useState<{
		instructorId?: string;
		name?: string;
		nip?: string;
		bankAccount?: string;
	}>({});
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		setForm(billingData ? fromDoc(billingData) : emptyForm());
		setError(null);
		setErrors({});
	}, [billingData]);

	const set =
		(field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
			setForm((prev) => ({ ...prev, [field]: e.target.value }));
			if (errors[field as keyof typeof errors]) {
				setErrors((prev) => ({ ...prev, [field]: undefined }));
			}
		};

	const handleSave = async () => {
		const newErrors: typeof errors = {};
		if (!form.instructorId) newErrors.instructorId = 'Wybierz instruktora';
		if (!form.name.trim()) newErrors.name = 'Nazwa firmy jest wymagana';
		if (!form.nip.trim()) newErrors.nip = 'NIP jest wymagany';
		if (!form.bankAccount.trim()) newErrors.bankAccount = 'Numer konta jest wymagany';
		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			setError('Uzupełnij wymagane pola');
			return;
		}

		setSaving(true);
		setError(null);
		setErrors({});
		const payload: Omit<BillingData, 'id'> = {
			instructorId: form.instructorId,
			name: form.name.trim(),
			address: form.address.trim(),
			city: form.city.trim(),
			nip: form.nip.trim(),
			website: form.website.trim() || '',
			phone: form.phone.trim() || '',
			bankName: form.bankName.trim(),
			bankAccount: form.bankAccount.trim(),
			paymentMethod: form.paymentMethod.trim(),
			issuePlace: form.issuePlace.trim(),
			vatRate: Number(form.vatRate),
		};
		try {
			if (billingData) await updateBillingData(billingData.id, payload);
			else await createBillingData(payload);
			onSaved();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Błąd zapisu');
		} finally {
			setSaving(false);
		}
	};

	return (
		<HardShadowDialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
			<DialogTitle sx={hardShadowDialogTitleSx}>
				{billingData ? 'Edytuj dane rozliczeniowe' : 'Nowy zestaw danych rozliczeniowych'}
			</DialogTitle>
			<DialogContent sx={[hardShadowDialogContentSx, { gap: 3 }]}>
				<TextField
					label='Instruktor'
					value={form.instructorId}
					onChange={set('instructorId')}
					select
					required
					fullWidth
					error={Boolean(errors.instructorId)}
					helperText={errors.instructorId}
				>
					{instructors.map((i) => (
						<MenuItem key={i.id} value={i.id}>
							{i.name}
						</MenuItem>
					))}
				</TextField>

				<Divider />
				<Typography variant='subtitle2' color='text.secondary'>
					Dane sprzedawcy
				</Typography>
				<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
					<TextField
						label='Nazwa firmy'
						value={form.name}
						onChange={set('name')}
						required
						sx={{ gridColumn: { sm: '1 / -1' } }}
						error={Boolean(errors.name)}
						helperText={errors.name}
					/>
					<TextField
						label='NIP'
						value={form.nip}
						onChange={set('nip')}
						required
						error={Boolean(errors.nip)}
						helperText={errors.nip}
					/>
					<TextField label='Adres' value={form.address} onChange={set('address')} />
					<TextField label='Miasto (z kodem)' value={form.city} onChange={set('city')} />
					<TextField label='Telefon' value={form.phone} onChange={set('phone')} />
					<TextField label='Strona www' value={form.website} onChange={set('website')} />
				</Box>

				<Divider />
				<Typography variant='subtitle2' color='text.secondary'>
					Dane bankowe
				</Typography>
				<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
					<TextField label='Nazwa banku' value={form.bankName} onChange={set('bankName')} />
					<TextField
						label='Numer konta (IBAN)'
						value={form.bankAccount}
						onChange={set('bankAccount')}
						required
						error={Boolean(errors.bankAccount)}
						helperText={errors.bankAccount}
					/>
				</Box>

				<Divider />
				<Typography variant='subtitle2' color='text.secondary'>
					Ustawienia proformy
				</Typography>
				<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
					<TextField
						label='Metoda płatności'
						value={form.paymentMethod}
						onChange={set('paymentMethod')}
					/>
					<TextField label='Miejsce wystawienia' value={form.issuePlace} onChange={set('issuePlace')} />
					<TextField label='Stawka VAT (%)' type='number' value={form.vatRate} onChange={set('vatRate')} />
				</Box>

				{error ? <Alert severity='error'>{error}</Alert> : null}
			</DialogContent>
			<DialogActions sx={hardShadowDialogActionsSx}>
				<Button onClick={onClose} disabled={saving}>
					Anuluj
				</Button>
				<Button variant='contained' onClick={handleSave} disabled={saving}>
					{saving ? <CircularProgress size={14} /> : 'Zapisz'}
				</Button>
			</DialogActions>
		</HardShadowDialog>
	);
};
