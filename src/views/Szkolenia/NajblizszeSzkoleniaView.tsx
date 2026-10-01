'use client';

import { Paths } from '@constants/paths';
import { getCourses } from '@services/courses';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertTitle, Box, CircularProgress, Link, Paper, Stack, Typography } from '@ui';
import NextLink from 'next/link';
import { useState } from 'react';
import { CourseDateActions } from '@/components/CourseDateActions';
import { getFutureCourseDates, getSlotsLeft } from '@/utils/courseDates';
import { fillPath } from '@/utils/paths';

export const NajblizszeSzkoleniaView = () => {
	const [error, setError] = useState<string | null>(null);

	const { data: courses = [], isLoading } = useQuery({
		queryKey: ['courses'],
		queryFn: getCourses,
	});

	const upcoming = getFutureCourseDates(courses);

	if (isLoading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center' }}>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box sx={{ maxWidth: 960 }}>
			<Typography variant='h4' component='h1' gutterBottom>
				Najbliższe szkolenia
			</Typography>
			<Typography color='text.secondary' sx={{ mb: 3 }}>
				Nadchodzące terminy — zapisz się lub dołącz do listy oczekujących, gdy brak miejsc.
			</Typography>

			<Alert severity='warning' sx={{ borderRadius: 0, mb: 3 }}>
				<AlertTitle>Sezon jesienny — kalendarz bywa rzadszy</AlertTitle>
				<Stack spacing={1.5}>
					<Typography variant='body2'>
						Mamy już jesień, więc będzie szybko ciemno, będzie zimno i prawdopodobnie w każdy
						weekend będzie padać&nbsp;:) W takich warunkach otwartych terminów jest zwykle mniej —
						część zajęć pojawia się dopiero, gdy zbierze się grupa, albo gdy pogoda i światło na to
						pozwolą.
					</Typography>
					<Typography variant='body2'>
						Aktualnie polecam zapisywać się na <strong>listy oczekujących</strong> pod konkretne
						zajęcia i poczekać na kontakt w tej sprawie. Gdy zwolni się miejsce albo zbierzemy
						wystarczającą liczbę chętnych, odezwiemy się.
					</Typography>
					<Typography variant='body2'>
						Można też wpaść na zajęcia indywidualne — będzie nam łatwiej ustalić termin niż szukać
						całej grupy.
					</Typography>
				</Stack>
			</Alert>

			{error ? (
				<Typography color='error' sx={{ mb: 2 }}>
					{error}
				</Typography>
			) : null}

			{upcoming.length === 0 ? (
				<Typography color='text.secondary'>
					Brak nadchodzących terminów na liście. Zapisz się na listę oczekujących przy wybranym
					szkoleniu albo sprawdź ofertę zajęć indywidualnych na stronie głównej.
				</Typography>
			) : (
				<Stack spacing={2}>
					{upcoming.map(({ course, date }) => {
						const slots = getSlotsLeft(date);
						return (
							<Paper key={`${course.id}-${date.id}`} sx={{ p: 2.5 }} variant='outlined'>
								<Stack
									direction={{ xs: 'column', sm: 'row' }}
									spacing={2}
									sx={{
										alignItems: { xs: 'flex-start', sm: 'center' },
										justifyContent: 'space-between',
									}}
								>
									<Box>
										<Link
											component={NextLink}
											href={fillPath(Paths.coursePage, { slug: course.slug })}
											underline='hover'
											variant='h6'
										>
											{course.name}
										</Link>
										<Typography variant='body2' color='text.secondary'>
											{date.date} · {date.timeStart} · {date.place?.name ?? '—'} · wolne: {slots}
										</Typography>
										<Typography variant='body2'>
											{(date.customPrice ?? course.price).toFixed(2)} zł
										</Typography>
									</Box>
									<CourseDateActions
										course={course}
										date={date}
										onError={(message) => setError(message)}
										onSuccess={() => setError(null)}
									/>
								</Stack>
							</Paper>
						);
					})}
				</Stack>
			)}
		</Box>
	);
};
