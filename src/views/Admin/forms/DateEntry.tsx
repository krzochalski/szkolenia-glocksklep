'use client';

import type { Instructor, Place } from '@/types/course';
import { Box, IconButton, Paper, Tooltip, Typography } from '@ui';
import { ContentCopy, Delete } from '@ui/icons';
import { useFormContext } from 'react-hook-form';
import { FormDatePicker } from './FormDatePicker';
import { FormSelect } from './FormSelect';
import { FormTextField } from './FormTextField';
import { FormTimePicker } from './FormTimePicker';

type DateEntryProps = {
	readonly index: number;
	readonly onRemove: () => void;
	readonly onClone: () => void;
	readonly isAdmin?: boolean;
	readonly places: Place[];
	readonly instructors: Instructor[];
};

export const DateEntry = ({
	index,
	onRemove,
	onClone,
	isAdmin,
	places,
	instructors,
}: DateEntryProps) => {
	const { setValue } = useFormContext();

	const handlePlaceChange = (placeId: string) => {
		const p = places.find((x) => x.id === placeId);
		if (p) {
			setValue(`dates.${index}.place.name`, p.name);
			setValue(`dates.${index}.place.link`, p.googleMapsLink ?? p.link ?? '');
		}
	};

	const handleInstructorChange = (instructorId: string) => {
		const i = instructors.find((x) => x.id === instructorId);
		if (i) {
			setValue(`dates.${index}.instructor.name`, i.name);
			setValue(`dates.${index}.instructor.slug`, i.slug);
		}
	};

	const placeOptions = places.map((p) => ({ value: p.id, label: p.name }));
	const instructorOptions = instructors.map((i) => ({ value: i.id, label: i.name }));

	return (
		<Paper variant='outlined' sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<Typography variant='subtitle2' color='text.secondary'>
					Termin #{index + 1}
				</Typography>
				<Box>
					<Tooltip title='Klonuj termin'>
						<IconButton size='small' onClick={onClone} aria-label='Klonuj termin'>
							<ContentCopy fontSize='small' />
						</IconButton>
					</Tooltip>
					<Tooltip title='Usuń termin'>
						<IconButton size='small' color='error' onClick={onRemove} aria-label='Usuń termin'>
							<Delete fontSize='small' />
						</IconButton>
					</Tooltip>
				</Box>
			</Box>

			<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
				<FormDatePicker name={`dates.${index}.date`} label='Data' />
				<FormTimePicker name={`dates.${index}.timeStart`} label='Godzina' />
				<FormTextField
					name={`dates.${index}.slotsMax`}
					label='Maks. miejsc'
					placeholder='12'
					type='number'
				/>
			</Box>

			<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
				<FormSelect
					name={`dates.${index}._instructorId`}
					label='Instruktor'
					options={instructorOptions}
					onChange={handleInstructorChange}
				/>
				<FormTextField
					name={`dates.${index}.instructor.name`}
					label='Instruktor — nazwa'
					placeholder='Piotr Krzoska'
				/>
			</Box>

			<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
				<FormSelect
					name={`dates.${index}._placeId`}
					label='Miejsce'
					options={placeOptions}
					onChange={handlePlaceChange}
				/>
				<FormTextField
					name={`dates.${index}.place.name`}
					label='Nazwa miejsca'
					placeholder='Strzelnica'
				/>
			</Box>

			<FormTextField
				name={`dates.${index}.place.link`}
				label='Link Google Maps (opcjonalnie)'
				placeholder='https://maps.google.com/...'
			/>

			{isAdmin ? (
				<FormTextField
					name={`dates.${index}.customPrice`}
					label='Cena indywidualna netto (PLN)'
					placeholder='Zostaw puste = cena szkolenia'
					type='number'
				/>
			) : null}
		</Paper>
	);
};
