'use client';

import { CourseDateActions } from '@/components/CourseDateActions';
import { Paths } from '@constants/paths';
import { getCourses } from '@services/courses';
import { getFutureCourseDates, getSlotsLeft } from '@/utils/courseDates';
import { fillPath } from '@/utils/paths';
import {
	Box,
	CircularProgress,
	ContentSwap,
	Link,
	MotionAlert,
	Paper,
	Stagger,
	StaggerItem,
	Typography,
} from '@ui';
import { useQuery } from '@tanstack/react-query';
import NextLink from 'next/link';
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
								{upcoming.map(({ course, date }) => {
									const slots = getSlotsLeft(date);
									return (
										<StaggerItem key={`${course.id}-${date.id}`}>
											<Paper variant='outlined' sx={{ p: 2 }}>
												<Link
													component={NextLink}
													href={fillPath(Paths.coursePage, { slug: course.slug })}
													underline='hover'
													variant='subtitle1'
												>
													{course.name}
												</Link>
												<Typography variant='body2' color='text.secondary'>
													{date.date} · {date.timeStart} · wolne: {slots}
												</Typography>
												<Box sx={{ mt: 1 }}>
													<CourseDateActions
														course={course}
														date={date}
														size='small'
														onError={(message) => setError(message)}
														onSuccess={() => setError(null)}
													/>
												</Box>
											</Paper>
										</StaggerItem>
									);
								})}
							</Stagger>
						)}
					</ContentSwap>
				</Box>
			)}
		</ContentSwap>
	);
};
