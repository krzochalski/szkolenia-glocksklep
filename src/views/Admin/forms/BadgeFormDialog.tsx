'use client';

import { badgeImageSelectOptions } from '@constants/catalogueImages';
import { createBadge, updateBadge } from '@services/badges';
import type { Badge } from '@/types/badge';
import {
	Box,
	Button,
	CircularProgress,
	DialogActions,
	DialogContent,
	DialogTitle,
	HardShadowDialog,
	hardShadowDialogActionsSx,
	hardShadowDialogContentSx,
	hardShadowDialogTitleSx,
	MenuItem,
	MotionAlert,
	Stack,
	TextField,
	Typography,
} from '@ui';
import { useEffect, useMemo, useState } from 'react';
import { toSlug } from './toSlug';

type BadgeFormDialogProps = {
	readonly open: boolean;
	readonly badge: Badge | null;
	readonly onClose: () => void;
	readonly onSaved: () => void;
};

export const BadgeFormDialog = ({ open, badge, onClose, onSaved }: BadgeFormDialogProps) => {
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [image, setImage] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		setName(badge?.name ?? '');
		setDescription(badge?.description ?? '');
		setImage(badge?.image ?? '');
		setError(null);
	}, [badge]);

	const imageOptions = useMemo(() => badgeImageSelectOptions(image), [image]);

	const handleSave = async () => {
		if (!name.trim()) {
			setError('Nazwa jest wymagana');
			return;
		}
		if (!image.trim()) {
			setError('Wybierz grafikę odznaki');
			return;
		}
		setSaving(true);
		setError(null);
		const data = {
			name: name.trim(),
			slug: toSlug(name),
			description: description.trim() || undefined,
			image: image.trim(),
		};
		try {
			if (badge) await updateBadge(badge.id, data);
			else await createBadge(data);
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
			<DialogTitle sx={hardShadowDialogTitleSx}>
				{badge ? 'Edytuj odznakę' : 'Dodaj odznakę'}
			</DialogTitle>
			<DialogContent sx={[hardShadowDialogContentSx, { gap: 2 }]}>
				<Stack spacing={2.5}>
					<TextField
						label='Nazwa'
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
						fullWidth
						helperText={name.trim() ? `Slug: ${toSlug(name)}` : undefined}
					/>
					<TextField
						label='Opis (opcjonalny)'
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						fullWidth
						multiline
						minRows={2}
					/>
					<TextField
						select
						label='Grafika'
						value={image}
						onChange={(e) => setImage(e.target.value)}
						required
						fullWidth
						helperText='Katalog /badges (preferowany) lub /thumbnails'
					>
						<MenuItem value=''>— wybierz —</MenuItem>
						{imageOptions.map((src) => (
							<MenuItem key={src} value={src}>
								{src}
							</MenuItem>
						))}
					</TextField>
					{image ? (
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
							<Box
								component='img'
								src={image}
								alt=''
								sx={{
									width: 64,
									height: 64,
									borderRadius: '50%',
									border: '2px solid',
									borderColor: 'ink.main',
									objectFit: 'cover',
									bgcolor: 'surface.muted',
								}}
							/>
							<Typography variant='body2' color='text.secondary'>
								Podgląd odznaki
							</Typography>
						</Box>
					) : null}
					<MotionAlert show={Boolean(error)} severity='error'>
						{error}
					</MotionAlert>
				</Stack>
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
