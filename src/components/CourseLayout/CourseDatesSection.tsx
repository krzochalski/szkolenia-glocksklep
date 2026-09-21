'use client';

import { CourseDateActions } from '@/components/CourseDateActions';
import { CourseWaitingListSection } from '@/components/CourseLayout/CourseWaitingListSection';
import { SectionLabel } from '@/components/CourseLayout/SectionLabel';
import { useAuthUser } from '@hooks';
import { getCourseBySlug } from '@services/courses';
import { getSlotsLeft, isCourseClassCanceled, isFutureDate } from '@/utils/courseDates';
import { Alert, Box, CircularProgress, Typography } from '@ui';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/pl';
import { useState } from 'react';

dayjs.locale('pl');

type CourseDatesSectionProps = {
	readonly slug: string;
};

export const CourseDatesSection = ({ slug }: CourseDatesSectionProps) => {
	const user = useAuthUser();
	const [error, setError] = useState<string | null>(null);

	const { data: course, isLoading } = useQuery({
		queryKey: ['course', slug],
		queryFn: () => getCourseBySlug(slug),
	});

	const threeMonthsAhead = dayjs().add(3, 'month').endOf('month');
	const futureDates = (course?.dates ?? [])
		.filter((d) => {
			if (isCourseClassCanceled(d)) {
				return Boolean(user && d.participants?.some((p) => p.id === user.uid));
			}
			const date = dayjs(d.date);
			return isFutureDate(d.date) && !date.isAfter(threeMonthsAhead, 'day');
		})
		.sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));

	const datesByMonth = futureDates.reduce<Record<string, typeof futureDates>>((acc, d) => {
		const key = dayjs(d.date).format('YYYY-MM');
		if (!acc[key]) acc[key] = [];
		acc[key].push(d);
		return acc;
	}, {});

	return (
		<Box sx={{ mb: 6 }}>
			<SectionLabel>Terminy</SectionLabel>
			<Typography variant='h2' sx={{ fontSize: { xs: '1.75rem', md: '2.5rem' }, mb: 2 }}>
				Dostępne terminy
			</Typography>

			{error ? (
				<Alert severity='error' sx={{ borderRadius: 0, mb: 3 }}>
					{error}
				</Alert>
			) : null}

			{isLoading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
					<CircularProgress color='primary' size={24} />
				</Box>
			) : !course ? (
				<Typography
					sx={{
						color: 'text.secondary',
						fontFamily: '"Space Mono", monospace',
						fontSize: '0.75rem',
						textTransform: 'uppercase',
						letterSpacing: '0.1em',
					}}
				>
					Chwilowo brak ustalonych terminów.
				</Typography>
			) : futureDates.length === 0 ? (
				<Typography
					sx={{
						color: 'text.secondary',
						fontFamily: '"Space Mono", monospace',
						fontSize: '0.75rem',
						textTransform: 'uppercase',
						letterSpacing: '0.1em',
					}}
				>
					Brak nadchodzących terminów.
				</Typography>
			) : (
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
					{Object.entries(datesByMonth).map(([monthKey, dates]) => (
						<Box key={monthKey}>
							<Typography
								sx={{
									fontFamily: '"Space Mono", monospace',
									fontSize: '0.625rem',
									fontWeight: 700,
									letterSpacing: '0.2em',
									textTransform: 'uppercase',
									color: 'primary.main',
									mb: 2,
									pl: 0.5,
								}}
							>
								{dayjs(`${monthKey}-01`).format('MMMM YYYY')}
							</Typography>
							<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
								{dates.map((date) => {
									const slots = getSlotsLeft(date);
									const canceled = isCourseClassCanceled(date);
									return (
										<Box
											key={date.id}
											sx={{
												display: 'flex',
												flexDirection: { xs: 'column', sm: 'row' },
												alignItems: { xs: 'stretch', sm: 'center' },
												justifyContent: 'space-between',
												gap: 2,
												p: 2.5,
												border: '2px solid',
												borderColor: 'ink.main',
												bgcolor: canceled ? 'surface.muted' : 'background.paper',
											}}
										>
											<Box>
												<Typography sx={{ fontWeight: 700 }}>
													{dayjs(date.date).format('D MMMM YYYY')} · {date.timeStart}
												</Typography>
												<Typography variant='body2' color='text.secondary'>
													{date.place?.name ?? '—'}
													{date.instructor?.name
														? ` · instruktor: ${date.instructor.name}`
														: ''}
													{canceled
														? ' · odwołane'
														: ` · wolne: ${slots}`}
												</Typography>
											</Box>
											{canceled ? (
												<Typography
													variant='body2'
													color='error.main'
													sx={{ fontWeight: 600, alignSelf: { sm: 'center' } }}
												>
													Odwołane
												</Typography>
											) : (
												<CourseDateActions
													course={course}
													date={date}
													onError={setError}
												/>
											)}
										</Box>
									);
								})}
							</Box>
						</Box>
					))}
				</Box>
			)}

			{course ? (
				<CourseWaitingListSection course={course} futureDates={futureDates} />
			) : null}
		</Box>
	);
};
