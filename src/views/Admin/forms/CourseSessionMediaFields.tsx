'use client';

import { sessionImageSelectOptions } from '@constants/catalogueImages';
import { Box, Button, MenuItem, TextField, Typography } from '@ui';
import { Add, Delete } from '@ui/icons';
import { useState } from 'react';

const NONE_VALUE = '';
const MAX_GALLERY = 3;

type GallerySlot = {
	id: string;
	src: string;
};

type CourseSessionMediaFieldsProps = {
	readonly gallery: string[];
	readonly onGalleryChange: (gallery: string[]) => void;
	readonly sessionVideoUrl: string;
	readonly onSessionVideoUrlChange: (url: string) => void;
	readonly videoError?: string;
};

const newSlotId = (): string =>
	typeof crypto !== 'undefined' && 'randomUUID' in crypto
		? crypto.randomUUID()
		: `slot-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const toSlots = (gallery: string[]): GallerySlot[] => {
	if (gallery.length === 0) return [{ id: newSlotId(), src: NONE_VALUE }];
	return gallery.map((src) => ({ id: newSlotId(), src }));
};

const pathsFromSlots = (slots: GallerySlot[]): string[] => slots.map((slot) => slot.src);

export const CourseSessionMediaFields = ({
	gallery,
	onGalleryChange,
	sessionVideoUrl,
	onSessionVideoUrlChange,
	videoError,
}: CourseSessionMediaFieldsProps) => {
	const [slots, setSlots] = useState<GallerySlot[]>(() => toSlots(gallery));

	const commit = (next: GallerySlot[]) => {
		setSlots(next);
		onGalleryChange(pathsFromSlots(next));
	};

	const updateSlot = (id: string, value: string) => {
		commit(slots.map((slot) => (slot.id === id ? { ...slot, src: value } : slot)));
	};

	const addSlot = () => {
		if (slots.length >= MAX_GALLERY) return;
		commit([...slots, { id: newSlotId(), src: NONE_VALUE }]);
	};

	const removeSlot = (id: string) => {
		commit(slots.filter((slot) => slot.id !== id));
	};

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
			<Typography variant='body2' color='text.secondary'>
				2–3 zdjęcia z prawdziwych zajęć (katalog /sessions; fallback: hero/miniatury) oraz
				opcjonalny krótki film YouTube.
			</Typography>
			{slots.map((slot) => {
				const options = sessionImageSelectOptions(slot.src);
				const label = `Zdjęcie ${slots.findIndex((s) => s.id === slot.id) + 1}`;
				return (
					<Box key={slot.id} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
						<TextField
							select
							label={label}
							fullWidth
							size='small'
							value={slot.src}
							onChange={(e) => updateSlot(slot.id, e.target.value)}
						>
							<MenuItem value={NONE_VALUE}>— brak —</MenuItem>
							{options.map((option) => (
								<MenuItem key={option} value={option}>
									{option}
								</MenuItem>
							))}
						</TextField>
						{slots.length > 1 ? (
							<Button
								variant='outlined'
								color='error'
								onClick={() => removeSlot(slot.id)}
								aria-label='Usuń zdjęcie'
								sx={{ minWidth: 48, px: 1 }}
							>
								<Delete />
							</Button>
						) : null}
					</Box>
				);
			})}
			{slots.length < MAX_GALLERY ? (
				<Button
					variant='outlined'
					startIcon={<Add />}
					onClick={addSlot}
					sx={{ alignSelf: 'flex-start' }}
				>
					Dodaj zdjęcie
				</Button>
			) : null}
			<TextField
				label='Film YouTube (opcjonalnie)'
				value={sessionVideoUrl}
				onChange={(e) => onSessionVideoUrlChange(e.target.value)}
				placeholder='https://www.youtube.com/watch?v=…'
				error={Boolean(videoError)}
				helperText={videoError ?? 'Link do krótkiego klipu z zajęć'}
				fullWidth
			/>
		</Box>
	);
};

/** Keep non-empty paths, max 3, for Firestore save. */
export const normalizeGalleryForSave = (gallery: string[]): string[] =>
	gallery.map((src) => src.trim()).filter(Boolean).slice(0, MAX_GALLERY);
