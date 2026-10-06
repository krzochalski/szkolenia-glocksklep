'use client';

import { CourseDateActions } from '@/components/CourseDateActions';
import { CourseDateRow } from '@/components/CourseDateRow';
import { getCourses } from '@services/courses';
import { getFutureCourseDates } from '@/utils/courseDates';
import {
	Box,
	CircularProgress,
	ContentSwap,
	MotionAlert,
	Stagger,
	StaggerItem,
	Typography,
} from '@ui';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export const HarmonogramView = () => {
	const [error, setError] = useState<string | null>(null);

	const { data: courses = [], isLoading } = useQuery({
		queryKey: ['courses'],
		queryFn: getCourses,
	});

	const upcoming = getFutureCourseDates(courses);

	const listState = upcoming.length === 0 ? 'empty' : 'content';

	return (
		<ContentSwap state={isLoading ? 'loading' : 'content'}>
			{isLoading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
					<CircularProgress />
				</Box>
			) : (
				<Box>
					<Typography variant='h5' component='h1' gutterBottom>
						Harmonogram
					</Typography>
					<MotionAlert show={Boolean(error)} severity='error' sx={{ mb: 2 }}>
						{error}
					</MotionAlert>
					<ContentSwap state={listState}>
						{upcoming.length === 0 ? (
							<Typography color='text.secondary'>Brak terminów.</Typography>
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
			)}
		</ContentSwap>
	);
};
