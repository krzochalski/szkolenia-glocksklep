'use client';

import { Paths } from '@constants/paths';
import { useAuthUser } from '@hooks';
import { getCourses } from '@services/courses';
import { fillPath } from '@/utils/paths';
import { Box, CircularProgress, Link, Paper, Stack, Typography } from '@ui';
import { useQuery } from '@tanstack/react-query';
import NextLink from 'next/link';

export const MojeSzkoleniaView = () => {
	const user = useAuthUser();
	const { data: courses = [], isLoading } = useQuery({
		queryKey: ['courses'],
		queryFn: getCourses,
		enabled: Boolean(user),
	});

	const mine =
		user == null
			? []
			: courses.flatMap((course) =>
					(course.dates ?? [])
						.filter((d) => d.participants?.some((p) => p.id === user.uid))
						.map((date) => ({ course, date }))
				);

	if (isLoading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box>
			<Typography variant='h5' component='h1' gutterBottom>
				Moje szkolenia
			</Typography>
			<Stack spacing={2}>
				{mine.map(({ course, date }) => (
					<Paper key={`${course.id}-${date.id}`} variant='outlined' sx={{ p: 2 }}>
						<Link
							component={NextLink}
							href={fillPath(Paths.szkolenieSzczegoly, {
								slug: course.slug,
								dateId: date.id,
							})}
							underline='hover'
							variant='h6'
						>
							{course.name}
						</Link>
						<Typography variant='body2' color='text.secondary'>
							{date.date} · {date.timeStart} · {date.place?.name}
						</Typography>
						<Link
							component={NextLink}
							href={fillPath(Paths.proforma, { slug: course.slug, dateId: date.id })}
							sx={{ mt: 1, display: 'inline-block' }}
						>
							Proforma
						</Link>
					</Paper>
				))}
				{mine.length === 0 ? (
					<Typography color='text.secondary'>Nie jesteś zapisany na żadne szkolenie.</Typography>
				) : null}
			</Stack>
		</Box>
	);
};
