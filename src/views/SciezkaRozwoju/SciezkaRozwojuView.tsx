'use client';

import { getCourses } from '@services/courses';
import { getDevelopmentPath } from '@services/developmentPath';
import type { Course } from '@/types/course';
import { Box, CircularProgress, Grid, MonoText, PathConnector, Stack, Typography } from '@ui';
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

	const tracks = useMemo(() => {
		if (!pathDoc) return [];
		return pathDoc.paths.map((track, trackIdx) => {
			let stepOrdinal = 0;
			return {
				...track,
				trackIdx,
				levels: track.levels.map((lvl) => ({
					...lvl,
					items: lvl.items.map((item) => {
						stepOrdinal += 1;
						return {
							...item,
							index: String(stepOrdinal).padStart(2, '0'),
						};
					}),
				})),
			};
		});
	}, [pathDoc]);

	const isLoading = pathLoading || coursesLoading;

	return (
		<>
			<Box>
				<Typography
					variant='h1'
					sx={{
						fontSize: { xs: '1.75rem', md: '2.5rem' },
						textTransform: 'uppercase',
						letterSpacing: '-0.02em',
						borderBottom: '3px solid',
						borderColor: 'ink.main',
						pb: 1.25,
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
							mt: 1.5,
							maxWidth: 640,
							lineHeight: 1.55,
						}}
					>
						{pathDoc.intro}
					</Typography>
				) : null}
			</Box>

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
					<Grid container spacing={{ xs: 3, md: 4 }} sx={{ alignItems: 'stretch' }}>
						{tracks.map((track) => (
							<Grid key={track.id} size={{ xs: 12, md: 6 }}>
								<Box
									sx={{
										height: '100%',
										borderLeft: '4px solid',
										borderColor: 'primary.main',
										pl: { xs: 2, sm: 2.5 },
									}}
								>
									<MonoText
										sx={{
											display: 'block',
											fontSize: '0.6875rem',
											color: 'primary.main',
											letterSpacing: '0.14em',
											mb: 0.75,
										}}
									>
										{`Ścieżka ${String(track.trackIdx + 1).padStart(2, '0')}`}
									</MonoText>
									<Typography
										variant='h2'
										sx={{
											fontSize: { xs: '1.05rem', sm: '1.15rem' },
											fontWeight: 700,
											textTransform: 'uppercase',
											letterSpacing: '0.04em',
											mb: 2.5,
											pb: 1,
											borderBottom: '2px solid',
											borderColor: 'ink.main',
										}}
									>
										{track.title}
									</Typography>
									<Stack spacing={0} sx={{ alignItems: 'stretch' }}>
										{track.levels.map((lvl, levelIdx) => (
											<Box key={lvl.id}>
												<Box
													sx={{
														display: 'grid',
														gridTemplateColumns:
															lvl.items.length > 1
																? {
																		xs: '1fr',
																		sm: `repeat(${Math.min(lvl.items.length, 2)}, 1fr)`,
																	}
																: '1fr',
														gap: 1.5,
														alignItems: 'stretch',
													}}
												>
													{lvl.items.map((item) => {
														const course = courseBySlug.get(item.courseSlug);
														const label =
															item.label?.trim() || course?.name || item.courseSlug;
														return (
															<PathStep
																key={item.id}
																index={item.index}
																label={label}
																courseSlug={item.courseSlug}
																course={course}
															/>
														);
													})}
												</Box>
												{levelIdx < track.levels.length - 1 ? <PathConnector /> : null}
											</Box>
										))}
										{track.levels.length === 0 ? (
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
								</Box>
							</Grid>
						))}
					</Grid>
				)
			) : null}
		</>
	);
};
