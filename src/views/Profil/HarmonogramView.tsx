'use client';

import { Paths } from '@constants/paths';
import { useAuthUser } from '@hooks';
import { enrollInCourse, getCourses } from '@services/courses';
import { getFutureCourseDates, getSlotsLeft } from '@/utils/courseDates';
import { fillPath } from '@/utils/paths';
import { Box, Button, CircularProgress, Link, Paper, Stack, Typography } from '@ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import NextLink from 'next/link';
import { useState } from 'react';

export const HarmonogramView = () => {
	const user = useAuthUser();
	const queryClient = useQueryClient();
	const [error, setError] = useState<string | null>(null);

	const { data: courses = [], isLoading } = useQuery({
		queryKey: ['courses'],
		queryFn: getCourses,
	});

	const upcoming = getFutureCourseDates(courses);

	const enroll = useMutation({
		mutationFn: async ({ courseId, dateId }: { courseId: string; dateId: string }) => {
			if (!user) throw new Error('Zaloguj się.');
			await enrollInCourse(courseId, dateId, {
				id: user.uid,
				name: user.displayName || user.email || 'Uczestnik',
				email: user.email || '',
				phoneNumber: user.phoneNumber ?? undefined,
			});
		},
		onSuccess: async () => {
			setError(null);
			await queryClient.invalidateQueries({ queryKey: ['courses'] });
		},
		onError: (err: Error) => setError(err.message),
	});

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
				Harmonogram
			</Typography>
			{error ? (
				<Typography color='error' sx={{ mb: 2 }}>
					{error}
				</Typography>
			) : null}
			<Stack spacing={2}>
				{upcoming.map(({ course, date }) => {
					const enrolled = date.participants?.some((p) => p.id === user?.uid);
					const slots = getSlotsLeft(date);
					return (
						<Paper key={`${course.id}-${date.id}`} variant='outlined' sx={{ p: 2 }}>
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
							{enrolled ? (
								<Typography color='success.main' sx={{ mt: 1, fontWeight: 600 }}>
									Zapisano
								</Typography>
							) : (
								<Button
									sx={{ mt: 1 }}
									size='small'
									variant='contained'
									disabled={slots <= 0 || enroll.isPending}
									onClick={() => enroll.mutate({ courseId: course.id, dateId: date.id })}
								>
									Zapisz się
								</Button>
							)}
						</Paper>
					);
				})}
				{upcoming.length === 0 ? (
					<Typography color='text.secondary'>Brak terminów.</Typography>
				) : null}
			</Stack>
		</Box>
	);
};
