'use client';

import { createPlace, updatePlace } from '@services/places';
import type { Place } from '@/types/course';
import {
	Alert,
	Button,
	CircularProgress,
	DialogActions,
	DialogContent,
	DialogTitle,
	HardShadowDialog,
	hardShadowDialogActionsSx,
	hardShadowDialogContentSx,
	hardShadowDialogTitleSx,
	TextField,
	Typography,
} from '@ui';
import { useEffect, useState } from 'react';
import { toSlug } from './toSlug';

type PlaceFormDialogProps = {
	readonly open: boolean;
	readonly place: Place | null;
	readonly onClose: () => void;
	readonly onSaved: () => void;
};

export const PlaceFormDialog = ({ open, place, onClose, onSaved }: PlaceFormDialogProps) => {
	const [name, setName] = useState('');
	const [googleMapsLink, setGoogleMapsLink] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [nameError, setNameError] = useState<string | undefined>();
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (place) {
			setName(place.name);
			setGoogleMapsLink(place.googleMapsLink ?? place.link ?? '');
		} else {
			setName('');
			setGoogleMapsLink('');
		}
		setError(null);
		setNameError(undefined);
	}, [place]);

	const handleSave = async () => {
		if (!name.trim()) {
			setNameError('Nazwa jest wymagana');
			setError('Uzupełnij wymagane pola');
			return;
		}
		setSaving(true);
		setError(null);
		setNameError(undefined);
		const data = {
			name: name.trim(),
			slug: toSlug(name),
			googleMapsLink: googleMapsLink.trim(),
			link: googleMapsLink.trim(),
		};
		try {
			if (place) await updatePlace(place.id, data);
			else await createPlace(data);
			onSaved();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Błąd zapisu.');
		} finally {
			setSaving(false);
		}
	};

	return (
		<HardShadowDialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
			<DialogTitle sx={hardShadowDialogTitleSx}>{place ? 'Edytuj obiekt' : 'Dodaj obiekt'}</DialogTitle>
			<DialogContent sx={[hardShadowDialogContentSx, { gap: 2 }]}>
				<Typography variant='body2' color='text.secondary'>
					Obiekt będzie dostępny przy tworzeniu terminów szkoleń.
				</Typography>
				<TextField
					label='Nazwa obiektu'
					value={name}
					onChange={(e) => {
						setName(e.target.value);
						if (nameError) setNameError(undefined);
					}}
					required
					fullWidth
					error={Boolean(nameError)}
					helperText={nameError}
				/>
				<TextField
					label='Link Google Maps'
					value={googleMapsLink}
					onChange={(e) => setGoogleMapsLink(e.target.value)}
					fullWidth
					placeholder='https://maps.google.com/...'
				/>
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
