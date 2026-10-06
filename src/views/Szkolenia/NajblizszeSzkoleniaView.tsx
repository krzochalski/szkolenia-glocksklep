'use client';

import { getCourses } from '@services/courses';
import { useQuery } from '@tanstack/react-query';
import {
	Alert,
	AlertTitle,
	Box,
	CircularProgress,
	ContentSwap,
	MotionAlert,
	Stack,
	Stagger,
	StaggerItem,
	Typography,
} from '@ui';
import { useState } from 'react';
import { CourseDateActions } from '@/components/CourseDateActions';
import { CourseDateRow } from '@/components/CourseDateRow';
import { getFutureCourseDates } from '@/utils/courseDates';

export const NajblizszeSzkoleniaView = () => {
	const [error, setError] = useState<string | null>(null);

	const { data: courses = [], isLoading } = useQuery({
		queryKey: ['courses'],
		queryFn: getCourses,
	});

	const upcoming = getFutureCourseDates(courses);

	return (
		<ContentSwap state={isLoading ? 'loading' : 'content'}>
			{isLoading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center' }}>
					<CircularProgress />
				</Box>
			) : (
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
								weekend będzie padać&nbsp;:) W takich warunkach otwartych terminów jest zwykle mniej
								— część zajęć pojawia się dopiero, gdy zbierze się grupa, albo gdy pogoda i światło
								na to pozwolą.
							</Typography>
							<Typography variant='body2'>
								Gdy widać wolne miejsca — <strong>zapisz się</strong> na wybrany termin. Gdy termin
								jest pełny, dołącz do <strong>listy oczekujących</strong>; odezwiemy się, gdy zwolni
								się miejsce albo zbierzemy grupę.
							</Typography>
							<Typography variant='body2'>
								Można też wpaść na zajęcia indywidualne — będzie nam łatwiej ustalić termin niż
								szukać całej grupy.
							</Typography>
						</Stack>
					</Alert>

					<MotionAlert show={Boolean(error)} severity='error' sx={{ mb: 2 }}>
						{error}
					</MotionAlert>

					{upcoming.length === 0 ? (
						<Typography color='text.secondary'>
							Brak nadchodzących terminów na liście. Zapisz się na listę oczekujących przy wybranym
							szkoleniu albo sprawdź ofertę zajęć indywidualnych na stronie głównej.
						</Typography>
					) : (
						<Stagger sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
							{upcoming.map(({ course, date }) => (
								<StaggerItem key={`${course.id}-${date.id}`}>
									<CourseDateRow
										course={course}
										date={date}
										action={
											<CourseDateActions
												course={course}
												date={date}
												onError={(message) => setError(message)}
												onSuccess={() => setError(null)}
											/>
										}
									/>
								</StaggerItem>
							))}
						</Stagger>
					)}
				</Box>
			)}
		</ContentSwap>
	);
};
