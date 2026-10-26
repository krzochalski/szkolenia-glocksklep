'use client';

import { AdminStickyActions } from '@components';
import { DEFAULT_COURSE_TIME_START, getCourseSlotsMax } from '@constants/courses';
import { Paths } from '@constants/paths';
import { zodResolver } from '@hookform/resolvers/zod';
import { getCourse, updateCourseDates } from '@services/courses';
import { getInstructors } from '@services/instructors';
import { getPlaces } from '@services/places';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
	defaultMinDecisionBy,
	getCourseMinDecisionDaysBefore,
	getCourseMinParticipants,
} from '@/utils/minParticipants';
import { invalidateCourseQueries } from '@/utils/invalidateCourseQueries';
import { fillPath } from '@/utils/paths';
import { Box, Button, CircularProgress, ContentSwap, MotionAlert, Paper, Typography } from '@ui';
import { ArrowBack } from '@ui/icons';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FormProvider, type Resolver, useForm, useWatch } from 'react-hook-form';
import { v4 as uuid } from 'uuid';
import { cleanDateForFirestore } from './forms/cleanDateForFirestore';
import { type DateEntryValues, dateEntrySchema } from './forms/dateEntrySchema';
import { FormDatePicker } from './forms/FormDatePicker';
import { FormSelect } from './forms/FormSelect';
import { FormTextField } from './forms/FormTextField';
import { FormTimePicker } from './forms/FormTimePicker';
import { SectionTitle } from './forms/SectionTitle';
import { WatchedNettoBruttoHint } from './forms/WatchedNettoBruttoHint';

type Props = {
	readonly courseId: string;
};

export const AdminCourseDateNewView = ({ courseId }: Props) => <NewDateInner courseId={courseId} />;

const NewDateInner = ({ courseId }: Props) => {
	const router = useRouter();
	const queryClient = useQueryClient();
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
	const deadlineTouched = useRef(false);

	const methods = useForm<DateEntryValues>({
		resolver: zodResolver(dateEntrySchema) as Resolver<DateEntryValues>,
		defaultValues: {
			date: '',
			timeStart: DEFAULT_COURSE_TIME_START,
			slotsMax: getCourseSlotsMax(null),
			minParticipants: getCourseMinParticipants(null),
			minDecisionBy: defaultMinDecisionBy(
				new Date().toISOString().slice(0, 10),
				getCourseMinDecisionDaysBefore(null)
			),
			subtitle: '',
			_instructorId: '',
			_placeId: '',
			customPrice: undefined,
		},
	});

	useEffect(() => {
		if (!course) return;
		methods.setValue('slotsMax', getCourseSlotsMax(course));
		methods.setValue('minParticipants', getCourseMinParticipants(course));
		const dateVal = methods.getValues('date');
		if (dateVal && /^\d{4}-\d{2}-\d{2}$/.test(dateVal) && !deadlineTouched.current) {
			methods.setValue(
				'minDecisionBy',
				defaultMinDecisionBy(dateVal, getCourseMinDecisionDaysBefore(course))
			);
		}
	}, [course, methods]);

	const sessionDate = useWatch({ control: methods.control, name: 'date' });

	useEffect(() => {
		if (!sessionDate || !/^\d{4}-\d{2}-\d{2}$/.test(sessionDate)) return;
		if (deadlineTouched.current) return;
		methods.setValue(
			'minDecisionBy',
			defaultMinDecisionBy(sessionDate, getCourseMinDecisionDaysBefore(course ?? null))
		);
	}, [sessionDate, course, methods]);

	const placeOptions = useMemo(() => places.map((p) => ({ value: p.id, label: p.name })), [places]);
	const instructorOptions = useMemo(
		() => instructors.map((i) => ({ value: i.id, label: i.name })),
		[instructors]
	);

	return (
		<ContentSwap state={courseLoading ? 'loading' : 'content'}>
			{courseLoading ? (
				<CircularProgress />
			) : (
				<Box sx={{ width: '100%' }}>
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

										const subtitle = data.subtitle?.trim();
										const newDate = {
											id: uuid(),
											date: data.date,
											timeStart: data.timeStart,
											slotsMax: data.slotsMax,
											minParticipants: data.minParticipants,
											minDecisionBy: data.minDecisionBy,
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
											...(subtitle ? { subtitle } : {}),
											...(data.customPrice ? { customPrice: data.customPrice } : {}),
										};
										const existingDates = (course.dates ?? []).map((d) => cleanDateForFirestore(d));
										await updateCourseDates(courseId, [...existingDates, newDate]);
										await invalidateCourseQueries(queryClient);
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
									<FormTextField
										name='minParticipants'
										label='Min. osób'
										type='number'
										helperText='Liczy każdy zapis (także nieopłacony).'
									/>
								</Box>
								<Box
									sx={{
										display: 'grid',
										gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
										gap: 2,
									}}
								>
									<Box
										onFocusCapture={() => {
											deadlineTouched.current = true;
										}}
									>
										<FormDatePicker name='minDecisionBy' label='Termin decyzji (min.)' />
									</Box>
									<Box sx={{ display: 'flex', flexDirection: 'column' }}>
										<FormTextField
											name='customPrice'
											label='Cena indywidualna netto (PLN)'
											type='number'
										/>
										<WatchedNettoBruttoHint control={methods.control} name='customPrice' />
									</Box>
								</Box>
								<Typography variant='caption' color='text.secondary'>
									Po terminie decyzji, przy zapisach poniżej min., status = „do decyzji”.
									Anulowanie terminu tylko ręcznie.
								</Typography>
								<FormTextField
									name='subtitle'
									label='Podtytuł'
									placeholder='np. Orientacja IDPA · dry-fire: reset z kabury'
									helperText='Opcjonalnie — krótko, czym ta edycja się wyróżnia (fokus, format, dyscyplina).'
								/>
								<Box
									sx={{
										display: 'grid',
										gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
										gap: 2,
									}}
								>
									<FormSelect name='_instructorId' label='Instruktor' options={instructorOptions} />
									<FormSelect name='_placeId' label='Miejsce' options={placeOptions} />
								</Box>
								<MotionAlert show={Boolean(error)} severity='error'>
									{error}
								</MotionAlert>
								<AdminStickyActions justifyContent='flex-end'>
									<Button
										type='submit'
										variant='contained'
										disabled={methods.formState.isSubmitting}
									>
										DODAJ TERMIN
									</Button>
								</AdminStickyActions>
							</Box>
						</FormProvider>
					</Paper>
				</Box>
			)}
		</ContentSwap>
	);
};
