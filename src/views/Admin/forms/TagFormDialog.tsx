'use client';

import { createTag, updateTag } from '@services/tags';
import type { Tag } from '@/types/course';
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
} from '@ui';
import { useEffect, useState } from 'react';
import { toSlug } from './toSlug';

type TagFormDialogProps = {
	readonly open: boolean;
	readonly tag: Tag | null;
	readonly onClose: () => void;
	readonly onSaved: () => void;
};

export const TagFormDialog = ({ open, tag, onClose, onSaved }: TagFormDialogProps) => {
	const [name, setName] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		setName(tag?.name ?? '');
		setError(null);
	}, [tag]);

	const handleSave = async () => {
		if (!name.trim()) {
			setError('Nazwa jest wymagana');
			return;
		}
		setSaving(true);
		setError(null);
		const data = { name: name.trim(), slug: toSlug(name) };
		try {
			if (tag) await updateTag(tag.id, data);
			else await createTag(data);
			onSaved();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Błąd zapisu.');
		} finally {
			setSaving(false);
		}
	};

	return (
		<HardShadowDialog open={open} onClose={onClose} maxWidth='xs' fullWidth>
			<DialogTitle sx={hardShadowDialogTitleSx}>{tag ? 'Edytuj tag' : 'Dodaj tag'}</DialogTitle>
			<DialogContent sx={[hardShadowDialogContentSx, { gap: 2 }]}>
				<TextField
					label='Nazwa'
					value={name}
					onChange={(e) => setName(e.target.value)}
					required
					fullWidth
					helperText={name.trim() ? `Slug: ${toSlug(name)}` : undefined}
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
