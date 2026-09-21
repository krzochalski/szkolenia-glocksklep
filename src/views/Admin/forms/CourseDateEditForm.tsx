'use client';

import { getCourse, updateCourseDates } from '@services/courses';
import { getInstructors } from '@services/instructors';
import { getPlaces } from '@services/places';
import type { CourseClass, Instructor, Place } from '@/types/course';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Box, Button, Paper, Typography } from '@ui';
import { useEffect, useState } from 'react';
import { type Control, FormProvider, type Resolver, useForm, useWatch } from 'react-hook-form';
import { cleanDateForFirestore } from './cleanDateForFirestore';
import { type DateEntryValues, dateEntrySchema } from './dateEntrySchema';
import { FormDatePicker } from './FormDatePicker';
import { FormSelect } from './FormSelect';
import { FormTextField } from './FormTextField';
import { FormTimePicker } from './FormTimePicker';
import { SectionTitle } from './SectionTitle';

const BruttoInfo = ({ control }: { control: Control<DateEntryValues> }) => {
	const customPrice = useWatch({ control, name: 'customPrice' });
	const netto = Number(customPrice) || 0;
	if (netto <= 0) return null;
	const brutto = (netto * 1.23).toFixed(2);
	return (
		<Typography variant='caption' color='text.secondary' sx={{ mt: 0.5, ml: 0.5 }}>
			Brutto: {brutto} PLN
		</Typography>
	);
};

type CourseDateEditFormProps = {
	readonly courseId: string;
	readonly courseDate: CourseClass;
	readonly onSaved: () => void;
};

export const CourseDateEditForm = ({
	courseId,
	courseDate,
	onSaved,
}: CourseDateEditFormProps) => {
	const [places, setPlaces] = useState<Place[]>([]);
	const [instructors, setInstructors] = useState<Instructor[]>([]);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		void getPlaces().then(setPlaces);
		void getInstructors().then(setInstructors);
	}, []);

	const methods = useForm<DateEntryValues>({
		resolver: zodResolver(dateEntrySchema) as Resolver<DateEntryValues>,
		defaultValues: {
			date: courseDate.date,
			timeStart: courseDate.timeStart,
			slotsMax: courseDate.slotsMax,
			_instructorId: '',
			_placeId: '',
			customPrice: courseDate.customPrice ?? undefined,
		},
	});

	useEffect(() => {
		if (instructors.length > 0 && !methods.getValues('_instructorId')) {
			const match = instructors.find(
				(i) =>
					i.id === courseDate.instructor?.id ||
					i.slug === courseDate.instructor?.slug ||
					i.name === courseDate.instructor?.name
			);
			if (match) methods.setValue('_instructorId', match.id);
		}
	}, [instructors, courseDate.instructor, methods]);

	useEffect(() => {
		if (places.length > 0 && !methods.getValues('_placeId')) {
			const match = places.find(
				(p) =>
					p.id === courseDate.place?.id ||
					p.slug === courseDate.place?.slug ||
					p.name === courseDate.place?.name
			);
			if (match) methods.setValue('_placeId', match.id);
		}
	}, [places, courseDate.place, methods]);

	const handleSubmit = async (data: DateEntryValues) => {
		setError(null);
		setSuccess(false);
		try {
			const selectedInstructor = instructors.find((i) => i.id === data._instructorId);
			const selectedPlace = places.find((p) => p.id === data._placeId);
			if (!selectedInstructor) throw new Error('Wybrany instruktor nie istnieje.');
			if (!selectedPlace) throw new Error('Wybrane miejsce nie istnieje.');

			const course = await getCourse(courseId);
			if (!course) throw new Error('Kurs nie istnieje.');

			const dates = (course.dates ?? []).map((d) => {
				if (d.id !== courseDate.id) return cleanDateForFirestore(d);
				const updated: Record<string, unknown> = {
					id: d.id,
					date: data.date,
					timeStart: data.timeStart,
					slotsMax: data.slotsMax,
					participants: d.participants ?? [],
					instructor: {
						id: selectedInstructor.id,
						name: selectedInstructor.name,
						slug: selectedInstructor.slug,
						bio: selectedInstructor.bio,
						...(selectedInstructor.email ? { email: selectedInstructor.email } : {}),
					},
					place: {
						id: selectedPlace.id,
						name: selectedPlace.name,
						slug: selectedPlace.slug,
						googleMapsLink: selectedPlace.googleMapsLink,
						...(selectedPlace.link ? { link: selectedPlace.link } : {}),
					},
				};
				if (data.customPrice) updated.customPrice = data.customPrice;
				if (d.canceled) updated.canceled = true;
				return updated;
			});

			await updateCourseDates(courseId, dates);
			setSuccess(true);
			onSaved();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Błąd zapisu.');
		}
	};

	const placeOptions = places.map((p) => ({ value: p.id, label: p.name }));
	const instructorOptions = instructors.map((i) => ({ value: i.id, label: i.name }));

	return (
		<Paper variant='outlined' sx={{ p: 3 }}>
			<FormProvider {...methods}>
				<Box
					component='form'
					autoComplete='off'
					onSubmit={methods.handleSubmit(handleSubmit)}
					sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
				>
					<SectionTitle>Edytuj termin</SectionTitle>
					<Box
						sx={{
							display: 'grid',
							gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr 1fr' },
							gap: 2,
						}}
					>
						<FormDatePicker name='date' label='Data' />
						<FormTimePicker name='timeStart' label='Godzina' />
						<FormTextField name='slotsMax' label='Maks. miejsc' type='number' />
						<Box sx={{ display: 'flex', flexDirection: 'column' }}>
							<FormTextField name='customPrice' label='Cena indywidualna netto (PLN)' type='number' />
							<BruttoInfo control={methods.control} />
						</Box>
					</Box>
					<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
						<FormSelect name='_instructorId' label='Instruktor' options={instructorOptions} />
						<FormSelect name='_placeId' label='Miejsce' options={placeOptions} />
					</Box>
					{error ? <Alert severity='error'>{error}</Alert> : null}
					{success ? <Alert severity='success'>Zapisano pomyślnie.</Alert> : null}
					<Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
						<Button type='submit' variant='contained' disabled={methods.formState.isSubmitting}>
							ZAPISZ TERMIN
						</Button>
					</Box>
				</Box>
			</FormProvider>
		</Paper>
	);
};
