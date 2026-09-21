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

export const NajblizszeSzkoleniaView = () => {
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
			if (!user) throw new Error('Zaloguj się, aby zapisać się na szkolenie.');
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
			<Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box sx={{ px: { xs: 2, md: 4 }, py: 4, maxWidth: 960, mx: 'auto' }}>
			<Typography variant='h4' component='h1' gutterBottom>
				Najbliższe szkolenia
			</Typography>
			<Typography color='text.secondary' sx={{ mb: 3 }}>
				Terminy z wolnymi miejscami — zapisz się jednym kliknięciem.
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
						const enrolled = date.participants?.some((p) => p.id === user?.uid);
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
									{enrolled ? (
										<Typography color='success.main' sx={{ fontWeight: 600 }}>
											Zapisano
										</Typography>
									) : (
										<Button
											variant='contained'
											disabled={slots <= 0 || enroll.isPending || !user}
											onClick={() =>
												enroll.mutate({ courseId: course.id, dateId: date.id })
											}
										>
											{!user ? 'Zaloguj się' : slots <= 0 ? 'Brak miejsc' : 'Zapisz się'}
										</Button>
									)}
								</Stack>
							</Paper>
						);
					})}
				</Stack>
			)}
		</Box>
	);
};
