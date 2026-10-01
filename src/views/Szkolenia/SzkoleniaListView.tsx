'use client';

import { getCourseDescriptions } from '@services/courseDescriptions';
import { getCourses } from '@services/courses';
import { resolveCourseThumbnailFrom } from '@/utils/courseImages';
import { isCourseInactive } from '@/utils/courseDates';
import { compareCoursesByOrder } from '@/utils/courseOrder';
import { useQuery } from '@tanstack/react-query';
import { ContentSwap, Stagger, StaggerItem, Typography } from '@ui';
import { useMemo } from 'react';
import { CourseCard } from './CourseCard';

export const SzkoleniaListView = () => {
	const {
		data: courses = [],
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['courses'],
		queryFn: getCourses,
	});
	const { data: descriptions = [] } = useQuery({
		queryKey: ['courseDescriptions'],
		queryFn: getCourseDescriptions,
	});

	const descriptionBySlug = useMemo(() => {
		const map = new Map(descriptions.map((d) => [d.slug, d]));
		return map;
	}, [descriptions]);

	const sortedCourses = useMemo(
		() =>
			[...courses]
				.filter((course) => !isCourseInactive(course))
				.sort(compareCoursesByOrder),
		[courses]
	);

	return (
		<>
			<Typography
				variant='h1'
				sx={{
					fontSize: { xs: '1.75rem', md: '2.5rem' },
					textTransform: 'uppercase',
					borderBottom: '2px solid',
					borderColor: 'ink.main',
					pb: 1,
				}}
			>
				Szkolenia
			</Typography>
			<Typography
				sx={{
					fontFamily: '"Space Mono", monospace',
					fontSize: '0.8125rem',
					color: 'text.secondary',
					mt: -2,
					maxWidth: 560,
				}}
			>
				Wybierz program i sprawdź dostępne terminy.
			</Typography>

			<ContentSwap
				state={
					isLoading
						? 'loading'
						: isError
							? 'error'
							: sortedCourses.length === 0
								? 'empty'
								: 'content'
				}
			>
				{isLoading ? (
					<Typography sx={{ fontFamily: '"Space Mono", monospace' }}>Ładowanie oferty…</Typography>
				) : isError ? (
					<Typography color='error' sx={{ fontFamily: '"Space Mono", monospace' }}>
						Nie udało się załadować katalogu szkoleń.
					</Typography>
				) : sortedCourses.length === 0 ? (
					<Typography sx={{ fontFamily: '"Space Mono", monospace' }}>
						Brak szkoleń w ofercie.
					</Typography>
				) : (
					<Stagger sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
						{sortedCourses.map((course) => (
							<StaggerItem key={course.id}>
								<CourseCard
									course={course}
									imageSrc={resolveCourseThumbnailFrom(
										course,
										descriptionBySlug.get(course.slug)
									)}
								/>
							</StaggerItem>
						))}
					</Stagger>
				)}
			</ContentSwap>
		</>
	);
};
