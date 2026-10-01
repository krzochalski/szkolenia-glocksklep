'use client';

import { Paths } from '@constants/paths';
import { useAuthUser } from '@hooks';
import { getCourses } from '@services/courses';
import { fillPath } from '@/utils/paths';
import {
	Box,
	CircularProgress,
	ContentSwap,
	Link,
	Paper,
	Stagger,
	StaggerItem,
	Typography,
} from '@ui';
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

	const listState = isLoading ? 'loading' : mine.length === 0 ? 'empty' : 'content';

	return (
		<ContentSwap state={isLoading ? 'loading' : 'content'}>
			{isLoading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
					<CircularProgress />
				</Box>
			) : (
				<Box>
					<Typography variant='h5' component='h1' gutterBottom>
						Moje szkolenia
					</Typography>
					<ContentSwap state={listState}>
						{mine.length === 0 ? (
							<Typography color='text.secondary'>
								Nie jesteś zapisany na żadne szkolenie.
							</Typography>
						) : (
							<Stagger sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
								{mine.map(({ course, date }) => (
									<StaggerItem key={`${course.id}-${date.id}`}>
										<Paper variant='outlined' sx={{ p: 2 }}>
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
