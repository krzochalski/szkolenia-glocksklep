'use client';

import { COURSE_LEVEL_ORDER } from '@constants/courses';
import { getCourseDescriptions } from '@services/courseDescriptions';
import { getCourses } from '@services/courses';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography } from '@ui';
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

	const imageBySlug = useMemo(() => {
		const map = new Map<string, string>();
		for (const description of descriptions) {
			if (description.background) map.set(description.slug, description.background);
		}
		return map;
	}, [descriptions]);

	const sortedCourses = useMemo(
		() =>
			[...courses].sort((a, b) => {
				const byLevel =
					(COURSE_LEVEL_ORDER[a.level] ?? Number.POSITIVE_INFINITY) -
					(COURSE_LEVEL_ORDER[b.level] ?? Number.POSITIVE_INFINITY);
				if (byLevel !== 0) return byLevel;
				return a.name.localeCompare(b.name, 'pl');
			}),
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

			{isLoading && (
				<Typography sx={{ fontFamily: '"Space Mono", monospace' }}>Ładowanie oferty…</Typography>
			)}
			{isError && (
				<Typography color='error' sx={{ fontFamily: '"Space Mono", monospace' }}>
					Nie udało się załadować katalogu szkoleń.
				</Typography>
			)}

			{!isLoading && !isError && courses.length === 0 && (
				<Typography sx={{ fontFamily: '"Space Mono", monospace' }}>
					Brak szkoleń w ofercie.
				</Typography>
			)}

			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
				{sortedCourses.map((course) => (
					<CourseCard
						key={course.id}
						course={course}
						imageSrc={imageBySlug.get(course.slug)}
					/>
				))}
			</Box>
		</>
	);
};
