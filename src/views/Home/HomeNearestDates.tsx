'use client';

import { Paths } from '@constants/paths';
import { getCourses } from '@services/courses';
import { useQuery } from '@tanstack/react-query';
import {
	Box,
	Button,
	CircularProgress,
	ContentSwap,
	MotionAlert,
	Stack,
	Stagger,
	StaggerItem,
	Typography,
} from '@ui';
import NextLink from 'next/link';
import { useState } from 'react';
import { CourseDateActions } from '@/components/CourseDateActions';
import { CourseDateRow } from '@/components/CourseDateRow';
import { getFutureCourseDates } from '@/utils/courseDates';

const NEAREST_LIMIT = 4;

export const HomeNearestDates = () => {
	const [error, setError] = useState<string | null>(null);

	const { data: courses = [], isLoading } = useQuery({
		queryKey: ['courses'],
		queryFn: getCourses,
	});

	const upcoming = getFutureCourseDates(courses).slice(0, NEAREST_LIMIT);

	const listState = isLoading ? 'loading' : upcoming.length === 0 ? 'empty' : 'content';

	return (
		<Box>
			<Stack
				direction={{ xs: 'column', sm: 'row' }}
				spacing={1}
				sx={{
					alignItems: { sm: 'baseline' },
					justifyContent: 'space-between',
					mb: 2,
				}}
			>
				<Typography variant='h4' component='h2'>
					Najbliższe szkolenia
				</Typography>
				<Button component={NextLink} href={Paths.najblizszeSzkolenia} variant='text'>
					Wszystkie terminy
				</Button>
			</Stack>

			<MotionAlert show={Boolean(error)} severity='error' sx={{ mb: 2 }}>
				{error}
			</MotionAlert>

			<ContentSwap state={listState}>
				{isLoading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
						<CircularProgress size={32} />
					</Box>
				) : upcoming.length === 0 ? (
					<Typography color='text.secondary'>Brak nadchodzących terminów.</Typography>
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
											size='small'
											onError={(message) => setError(message)}
											onSuccess={() => setError(null)}
										/>
									}
								/>
							</StaggerItem>
						))}
					</Stagger>
				)}
			</ContentSwap>
		</Box>
	);
};
