'use client';

import { getCourseBySlug } from '@services/courses';
import { getCourseDescriptionBySlug } from '@services/courseDescriptions';
import { getFutureCourseDates, getSlotsLeft } from '@/utils/courseDates';
import { Box, CircularProgress, Paper, Stack, Typography } from '@ui';
import { useQuery } from '@tanstack/react-query';

type Props = {
	readonly slug: string;
};

export const SzkolenieDetailView = ({ slug }: Props) => {
	const { data: course, isLoading } = useQuery({
		queryKey: ['course', slug],
		queryFn: () => getCourseBySlug(slug),
	});

	const { data: description } = useQuery({
		queryKey: ['courseDescription', slug],
		queryFn: () => getCourseDescriptionBySlug(slug),
		enabled: Boolean(slug),
	});

	if (isLoading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center' }}>
				<CircularProgress />
			</Box>
		);
	}

	if (!course) {
		return <Typography>Nie znaleziono szkolenia.</Typography>;
	}

	const upcoming = getFutureCourseDates([course]);

	return (
		<Box sx={{ maxWidth: 800 }}>
			<Typography variant='h4' component='h1' gutterBottom>
				{course.name}
			</Typography>
			<Typography color='text.secondary' sx={{ mb: 2 }}>
				{course.hours} h · {course.price.toFixed(2)} zł · poziom: {course.level}
			</Typography>
			<Typography sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>{course.description}</Typography>

			{description ? (
				<Paper variant='outlined' sx={{ p: 2.5, mb: 3 }}>
					<Typography variant='overline'>{description.eyebrow}</Typography>
					<Typography variant='h5' gutterBottom>
						{description.headline.join(' ')}
					</Typography>
					<Typography>{description.description}</Typography>
				</Paper>
			) : null}

			<Typography variant='h6' gutterBottom>
				Nadchodzące terminy
			</Typography>
			{upcoming.length === 0 ? (
				<Typography color='text.secondary'>Brak terminów.</Typography>
			) : (
				<Stack spacing={1.5}>
					{upcoming.map(({ date }) => (
						<Paper key={date.id} variant='outlined' sx={{ p: 2 }}>
							<Typography sx={{ fontWeight: 600 }}>
								{date.date} · {date.timeStart}
							</Typography>
							<Typography variant='body2' color='text.secondary'>
								{date.place?.name} · instruktor: {date.instructor?.name} · wolne:{' '}
								{getSlotsLeft(date)}
							</Typography>
						</Paper>
					))}
				</Stack>
			)}
		</Box>
	);
};
