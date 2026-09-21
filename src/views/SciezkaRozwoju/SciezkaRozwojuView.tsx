'use client';

import { getCourses } from '@services/courses';
import { getDevelopmentPath } from '@services/developmentPath';
import type { Course } from '@/types/course';
import { CircularProgress, Grid, Stack, Typography } from '@ui';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { PathStep } from './PathStep';

export const SciezkaRozwojuView = () => {
	const {
		data: pathDoc,
		isLoading: pathLoading,
		isError: pathError,
	} = useQuery({
		queryKey: ['developmentPath'],
		queryFn: getDevelopmentPath,
	});
	const { data: courses = [], isLoading: coursesLoading } = useQuery({
		queryKey: ['courses'],
		queryFn: getCourses,
	});

	const courseBySlug = useMemo(() => {
		const map = new Map<string, Course>();
		for (const course of courses) {
			map.set(course.slug, course);
		}
		return map;
	}, [courses]);

	const isLoading = pathLoading || coursesLoading;

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
				Ścieżka rozwoju
			</Typography>
			{pathDoc?.intro ? (
				<Typography
					sx={{
						fontFamily: '"Space Mono", monospace',
						fontSize: '0.8125rem',
						color: 'text.secondary',
						mt: -2,
						maxWidth: 640,
					}}
				>
					{pathDoc.intro}
				</Typography>
			) : null}

			{isLoading ? <CircularProgress size={28} /> : null}
			{pathError ? (
				<Typography color='error' sx={{ fontFamily: '"Space Mono", monospace' }}>
					Nie udało się załadować ścieżki rozwoju.
				</Typography>
			) : null}

			{!isLoading && !pathError && pathDoc ? (
				pathDoc.paths.length === 0 ? (
					<Typography sx={{ fontFamily: '"Space Mono", monospace' }}>
						Ścieżka rozwoju zostanie wkrótce uzupełniona.
					</Typography>
				) : (
					<Grid container spacing={4} sx={{ mt: 1 }}>
						{pathDoc.paths.map((track) => (
							<Grid key={track.id} size={{ xs: 12, md: 6 }}>
								<Typography
									variant='h2'
									sx={{
										fontSize: '1.15rem',
										fontWeight: 700,
										textTransform: 'uppercase',
										letterSpacing: '0.04em',
										mb: 2.5,
										pb: 1,
										borderBottom: '1px solid',
										borderColor: 'divider',
									}}
								>
									{track.title}
								</Typography>
								<Stack spacing={0} sx={{ alignItems: 'stretch' }}>
									{track.steps.map((step, idx) => {
										const course = courseBySlug.get(step.courseSlug);
										const label = step.label?.trim() || course?.name || step.courseSlug;
										return (
											<PathStep
												key={step.id}
												label={label}
												courseSlug={step.courseSlug}
												course={course}
												showArrowBelow={idx < track.steps.length - 1}
											/>
										);
									})}
									{track.steps.length === 0 ? (
										<Typography
											sx={{
												fontFamily: '"Space Mono", monospace',
												fontSize: '0.8125rem',
												color: 'text.secondary',
											}}
										>
											Brak kroków w tej ścieżce.
										</Typography>
									) : null}
								</Stack>
							</Grid>
						))}
					</Grid>
				)
			) : null}
		</>
	);
};
