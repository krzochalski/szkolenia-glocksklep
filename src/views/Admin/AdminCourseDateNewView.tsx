'use client';

import { Paths } from '@constants/paths';
import { getCourse, updateCourseDates } from '@services/courses';
import { getInstructors } from '@services/instructors';
import { getPlaces } from '@services/places';
import { fillPath } from '@/utils/paths';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Box, Button, CircularProgress, Paper, Typography } from '@ui';
import { ArrowBack } from '@ui/icons';
import { useQuery } from '@tanstack/react-query';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { type Control, FormProvider, type Resolver, useForm, useWatch } from 'react-hook-form';
import { v4 as uuid } from 'uuid';
import { AdminGate } from './AdminGate';
import { cleanDateForFirestore } from './forms/cleanDateForFirestore';
import { type DateEntryValues, dateEntrySchema } from './forms/dateEntrySchema';
import { FormDatePicker } from './forms/FormDatePicker';
import { FormSelect } from './forms/FormSelect';
import { FormTextField } from './forms/FormTextField';
import { FormTimePicker } from './forms/FormTimePicker';
import { SectionTitle } from './forms/SectionTitle';

type Props = {
	readonly courseId: string;
};

const BruttoInfo = ({ control }: { control: Control<DateEntryValues> }) => {
	const customPrice = useWatch({ control, name: 'customPrice' });
	const netto = Number(customPrice) || 0;
	if (netto <= 0) return null;
	return (
		<Typography variant='caption' color='text.secondary' sx={{ mt: 0.5, ml: 0.5 }}>
			Brutto: {(netto * 1.23).toFixed(2)} PLN
		</Typography>
	);
};

export const AdminCourseDateNewView = ({ courseId }: Props) => (
	<AdminGate>
		<NewDateInner courseId={courseId} />
	</AdminGate>
);

const NewDateInner = ({ courseId }: Props) => {
	const router = useRouter();
	const { data: course, isLoading: courseLoading } = useQuery({
		queryKey: ['course', courseId],
		queryFn: () => getCourse(courseId),
	});
	const { data: places = [] } = useQuery({ queryKey: ['places'], queryFn: getPlaces });
	const { data: instructors = [] } = useQuery({
		queryKey: ['instructors'],
		queryFn: getInstructors,
	});
	const [error, setError] = useState<string | null>(null);

	const methods = useForm<DateEntryValues>({
		resolver: zodResolver(dateEntrySchema) as Resolver<DateEntryValues>,
		defaultValues: {
			date: '',
			timeStart: '09:00',
			slotsMax: 12,
			_instructorId: '',
			_placeId: '',
			customPrice: undefined,
		},
	});

	const placeOptions = useMemo(
		() => places.map((p) => ({ value: p.id, label: p.name })),
		[places]
	);
	const instructorOptions = useMemo(
		() => instructors.map((i) => ({ value: i.id, label: i.name })),
		[instructors]
	);

	if (courseLoading) return <CircularProgress />;

	return (
		<Box sx={{ maxWidth: 960 }}>
			<Button
				component={NextLink}
				href={fillPath(Paths.adminCourseAllDates, { courseId })}
				startIcon={<ArrowBack />}
				sx={{ mb: 2 }}
			>
				Powrót do terminów
			</Button>
			<Typography variant='h5' gutterBottom>
				Dodaj nowy termin
			</Typography>
			<Paper variant='outlined' sx={{ p: 3 }}>
				<FormProvider {...methods}>
					<Box
						component='form'
						autoComplete='off'
						onSubmit={methods.handleSubmit(async (data) => {
							setError(null);
							try {
								const selectedInstructor = instructors.find((i) => i.id === data._instructorId);
								const selectedPlace = places.find((p) => p.id === data._placeId);
								if (!selectedInstructor) throw new Error('Wybrany instruktor nie istnieje.');
								if (!selectedPlace) throw new Error('Wybrane miejsce nie istnieje.');
								if (!course) throw new Error('Kurs nie istnieje.');

								const newDate = {
									id: uuid(),
									date: data.date,
									timeStart: data.timeStart,
									slotsMax: data.slotsMax,
									participants: [],
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
									...(data.customPrice ? { customPrice: data.customPrice } : {}),
								};
								const existingDates = (course.dates ?? []).map((d) => cleanDateForFirestore(d));
								await updateCourseDates(courseId, [...existingDates, newDate]);
								router.push(fillPath(Paths.adminCourseAllDates, { courseId }));
							} catch (err) {
								setError(err instanceof Error ? err.message : 'Błąd zapisu.');
							}
						})}
						sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
					>
						<SectionTitle>Dane terminu</SectionTitle>
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
								<FormTextField
									name='customPrice'
									label='Cena indywidualna netto (PLN)'
									type='number'
								/>
								<BruttoInfo control={methods.control} />
							</Box>
						</Box>
						<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
							<FormSelect name='_instructorId' label='Instruktor' options={instructorOptions} />
							<FormSelect name='_placeId' label='Miejsce' options={placeOptions} />
						</Box>
						{error ? <Alert severity='error'>{error}</Alert> : null}
						<Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
							<Button type='submit' variant='contained' disabled={methods.formState.isSubmitting}>
								DODAJ TERMIN
							</Button>
						</Box>
					</Box>
				</FormProvider>
			</Paper>
		</Box>
	);
};
