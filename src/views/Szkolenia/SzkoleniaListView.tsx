'use client';

import { Paths } from '@constants/paths';
import { getCourseDescriptions } from '@services/courseDescriptions';
import { getCourses } from '@services/courses';
import { useQuery } from '@tanstack/react-query';
import { Box, Container, Grid, Link, Typography } from '@ui';
import NextLink from 'next/link';
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

	return (
		<Container maxWidth='xl' sx={{ py: 4, gap: 4, display: 'flex', flexDirection: 'column' }}>
			<Box>
				<Link
					component={NextLink}
					href={Paths.home}
					sx={{
						fontSize: '0.75rem',
						fontWeight: 700,
						fontFamily: '"Space Mono", monospace',
						letterSpacing: '0.15em',
						textTransform: 'uppercase',
						color: 'text.secondary',
						textDecoration: 'none',
						'&:hover': { color: 'primary.main' },
					}}
				>
					← Główna
				</Link>
			</Box>

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

			<Grid container spacing={4}>
				{courses.map((course) => (
					<Grid key={course.id} size={{ xs: 12, sm: 6, lg: 4 }}>
						<CourseCard course={course} imageSrc={imageBySlug.get(course.slug)} />
					</Grid>
				))}
			</Grid>
		</Container>
	);
};
