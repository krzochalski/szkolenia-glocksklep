'use client';

import { CourseDateActions } from '@/components/CourseDateActions';
import { Paths } from '@constants/paths';
import { getCourses } from '@services/courses';
import { getFutureCourseDates, getSlotsLeft } from '@/utils/courseDates';
import { fillPath } from '@/utils/paths';
import {
	Box,
	Button,
	CircularProgress,
	ContentSwap,
	Link,
	MotionAlert,
	Paper,
	Stack,
	Stagger,
	StaggerItem,
	Typography,
} from '@ui';
import { useQuery } from '@tanstack/react-query';
import NextLink from 'next/link';
import { useState } from 'react';

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
						{upcoming.map(({ course, date }) => {
							const slots = getSlotsLeft(date);
							return (
								<StaggerItem key={`${course.id}-${date.id}`}>
									<Paper sx={{ p: 2.5 }} variant='outlined'>
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
												size='small'
												onError={(message) => setError(message)}
												onSuccess={() => setError(null)}
											/>
										</Stack>
									</Paper>
								</StaggerItem>
							);
						})}
					</Stagger>
				)}
			</ContentSwap>
		</Box>
	);
};
