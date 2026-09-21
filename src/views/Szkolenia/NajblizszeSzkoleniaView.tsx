'use client';

import { CourseDateActions } from '@/components/CourseDateActions';
import { Paths } from '@constants/paths';
import { getCourses } from '@services/courses';
import { getFutureCourseDates, getSlotsLeft } from '@/utils/courseDates';
import { fillPath } from '@/utils/paths';
import { Box, CircularProgress, Link, Paper, Stack, Typography } from '@ui';
import { useQuery } from '@tanstack/react-query';
import NextLink from 'next/link';
import { useState } from 'react';

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

			{error ? (
				<Typography color='error' sx={{ mb: 2 }}>
					{error}
				</Typography>
			) : null}

			{upcoming.length === 0 ? (
				<Typography color='text.secondary'>Brak nadchodzących terminów.</Typography>
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
											{date.date} · {date.timeStart} · {date.place?.name ?? '—'} · wolne:{' '}
											{slots}
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
