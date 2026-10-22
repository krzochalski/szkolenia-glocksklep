'use client';

import { OptimizedImage } from '@components';
import { Paths } from '@constants/paths';
import { useAuthUser } from '@hooks';
import { getMyAwardedBadges } from '@services/badges';
import { getMyCourseCompletions } from '@services/courseCompletions';
import { getCourses } from '@services/courses';
import { getDevelopmentPath } from '@services/developmentPath';
import { useQuery } from '@tanstack/react-query';
import {
	Box,
	Button,
	CircularProgress,
	ContentSwap,
	HardShadow,
	MonoText,
	PathConnector,
	Stack,
	Stagger,
	StaggerItem,
	Typography,
} from '@ui';
import { GpsFixedOutlined } from '@ui/icons';
import { PathStep } from '@views/SciezkaRozwoju/PathStep';
import NextLink from 'next/link';
import { useMemo, useState } from 'react';
import type { Course } from '@/types/course';
import { resolveCourseThumbnailFrom } from '@/utils/courseImages';
import { toOptimizedImagePath } from '@/utils/optimizedImagePath';
import { findNextPathStep } from '@/utils/pathProgress';
import { fillPath } from '@/utils/paths';

const BADGE_SIZES = '(max-width: 600px) 72px, 96px';

/** Medal ribbon + rim — not in brand palette; local to completion badges. */
const BADGE_GOLD = {
	light: '#F5D76E',
	mid: '#D4AF37',
	dark: '#A67C00',
	deep: '#7A5C0E',
} as const;

const formatCompletedDate = (value: string) => {
	if (!value) return null;
	const day = value.slice(0, 10);
	if (/^\d{4}-\d{2}-\d{2}$/.test(day)) {
		const [y, m, d] = day.split('-');
		return `${d}.${m}.${y}`;
	}
	return null;
};

export const ProfilSciezkaRozwojuView = () => {
	const user = useAuthUser();
	const {
		data: pathDoc,
		isLoading: pathLoading,
		isError: pathError,
	} = useQuery({
		queryKey: ['developmentPath'],
		queryFn: getDevelopmentPath,
		enabled: Boolean(user),
	});
	const { data: courses = [], isLoading: coursesLoading } = useQuery({
		queryKey: ['courses'],
		queryFn: getCourses,
		enabled: Boolean(user),
	});
	const { data: completions = [], isLoading: completionsLoading } = useQuery({
		queryKey: ['myCourseCompletions'],
		queryFn: getMyCourseCompletions,
		enabled: Boolean(user),
	});
	const { data: awardedBadges = [], isLoading: awardsLoading } = useQuery({
		queryKey: ['myAwardedBadges'],
		queryFn: getMyAwardedBadges,
		enabled: Boolean(user),
	});

	const courseBySlug = useMemo(() => {
		const map = new Map<string, Course>();
		for (const course of courses) {
			map.set(course.slug, course);
		}
		return map;
	}, [courses]);

	const courseById = useMemo(() => {
		const map = new Map<string, Course>();
		for (const course of courses) {
			map.set(course.id, course);
		}
		return map;
	}, [courses]);

	const completedSlugs = useMemo(
		() => new Set(completions.map((c) => c.courseSlug).filter(Boolean)),
		[completions]
	);

	const nextStep = useMemo(
		() => findNextPathStep(pathDoc, completedSlugs),
		[pathDoc, completedSlugs]
	);

	const nextCourse = nextStep ? courseBySlug.get(nextStep.courseSlug) : undefined;
	const nextLabel = nextStep?.label?.trim() || nextCourse?.name || nextStep?.courseSlug || null;

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

	const medalItems = useMemo(() => {
		const fromCourses = completions.map((completion) => {
			const course = courseById.get(completion.courseId);
			return {
				key: `course-${completion.courseId}`,
				name: course?.name || completion.courseName,
				imageSrc: resolveCourseThumbnailFrom(course, null),
				dateLabel: formatCompletedDate(completion.completedAt),
			};
		});
		const fromCustom = awardedBadges.map((award) => ({
			key: `badge-${award.badgeId}`,
			name: award.badgeName,
			imageSrc: award.badgeImage ? toOptimizedImagePath(award.badgeImage) : undefined,
			dateLabel: formatCompletedDate(award.awardedAt),
		}));
		return [...fromCourses, ...fromCustom];
	}, [awardedBadges, completions, courseById]);

	const isLoading = pathLoading || coursesLoading || completionsLoading || awardsLoading;
	const hasPath = Boolean(pathDoc && pathDoc.paths.length > 0);
	const pageState = isLoading ? 'loading' : pathError ? 'error' : 'content';

	return (
		<ContentSwap state={pageState}>
			{isLoading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
					<CircularProgress />
				</Box>
			) : pathError ? (
				<Typography color='error'>Nie udało się załadować ścieżki rozwoju.</Typography>
			) : (
				<Box>
					<Typography variant='h5' component='h1' sx={{ mb: 3 }}>
						Ścieżka rozwoju
					</Typography>

					<Box sx={{ mb: 4, textAlign: 'center' }}>
						<Typography variant='h6' component='h2' sx={{ mb: 2 }}>
							Odznaki
						</Typography>
						{medalItems.length === 0 ? (
							<Typography color='text.secondary'>
								Nie masz jeszcze odznak. Po ukończeniu szkolenia lub przyznaniu osiągnięcia
								administrator może je tu dodać.
							</Typography>
						) : (
							<Box
								sx={{
									display: 'flex',
									flexWrap: 'wrap',
									justifyContent: 'center',
									gap: { xs: 2.5, sm: 3 },
								}}
							>
								{medalItems.map((item) => (
									<AchievementMedal
										key={item.key}
										name={item.name}
										imageSrc={item.imageSrc}
										dateLabel={item.dateLabel}
									/>
								))}
							</Box>
						)}
					</Box>

					{hasPath ? (
						<>
							<Typography variant='h6' component='h2' sx={{ mb: 2 }}>
								Twoja ścieżka
							</Typography>
							<Box
								sx={{
									display: 'grid',
									width: '100%',
									mb: 4,
									gridTemplateColumns: {
										xs: '1fr',
										md: 'repeat(2, minmax(0, 1fr))',
									},
									gap: { xs: 3, md: 4 },
									alignItems: 'start',
								}}
							>
								{tracks.map((track) => (
									<Box
										key={track.id}
										sx={{
											minWidth: 0,
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
													<Stagger
														sx={{
															display: 'grid',
															gridTemplateColumns:
																lvl.items.length > 1
																	? {
																			xs: '1fr',
																			xl: `repeat(${Math.min(lvl.items.length, 2)}, minmax(0, 1fr))`,
																		}
																	: '1fr',
															gap: 1.5,
															alignItems: 'stretch',
														}}
													>
														{lvl.items.map((item) => {
															const course = courseBySlug.get(item.courseSlug);
															const label = item.label?.trim() || course?.name || item.courseSlug;
															return (
																<StaggerItem key={item.id}>
																	<PathStep
																		index={item.index}
																		label={label}
																		courseSlug={item.courseSlug}
																		course={course}
																		completed={completedSlugs.has(item.courseSlug)}
																	/>
																</StaggerItem>
															);
														})}
													</Stagger>
													{levelIdx < track.levels.length - 1 ? <PathConnector /> : null}
												</Box>
											))}
										</Stack>
									</Box>
								))}
							</Box>
						</>
					) : null}

					<HardShadow sx={{ p: { xs: 2, sm: 2.5 }, bgcolor: 'background.paper' }}>
						<MonoText
							sx={{
								display: 'block',
								fontSize: '0.6875rem',
								color: 'primary.main',
								letterSpacing: '0.14em',
								mb: 1,
							}}
						>
							Następny krok
						</MonoText>
						{!hasPath ? (
							<Typography color='text.secondary'>
								Ścieżka rozwoju zostanie wkrótce uzupełniona.
							</Typography>
						) : nextStep && nextLabel ? (
							<Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
								<Typography sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
									{nextLabel}
								</Typography>
								<MonoText sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
									{nextStep.trackTitle}
								</MonoText>
								{nextCourse ? (
									<Button
										component={NextLink}
										href={fillPath(Paths.coursePage, { slug: nextCourse.slug })}
										variant='contained'
										size='small'
									>
										Zobacz szkolenie
									</Button>
								) : null}
							</Stack>
						) : (
							<Typography sx={{ fontWeight: 600 }}>
								Gratulacje — ukończyłeś wszystkie kroki na ścieżce.
							</Typography>
						)}
					</HardShadow>
				</Box>
			)}
		</ContentSwap>
	);
};

type AchievementMedalProps = {
	readonly name: string;
	readonly imageSrc?: string;
	readonly dateLabel: string | null;
};

const AchievementMedal = ({ name, imageSrc, dateLabel }: AchievementMedalProps) => {
	const [imageFailed, setImageFailed] = useState(false);
	const showImage = Boolean(imageSrc) && !imageFailed;

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				width: { xs: 96, sm: 120 },
			}}
		>
			<Box
				sx={{
					position: 'relative',
					width: { xs: 72, sm: 96 },
					pt: { xs: 2.25, sm: 2.75 },
					mb: 1.25,
				}}
			>
				<Box
					aria-hidden
					sx={{
						position: 'absolute',
						top: 0,
						left: '50%',
						transform: 'translateX(-50%)',
						width: { xs: 28, sm: 34 },
						height: { xs: 30, sm: 36 },
						zIndex: 0,
						'&::before, &::after': {
							content: '""',
							position: 'absolute',
							top: 0,
							width: { xs: 12, sm: 14 },
							height: '100%',
							background: `linear-gradient(180deg, ${BADGE_GOLD.light} 0%, ${BADGE_GOLD.mid} 40%, ${BADGE_GOLD.dark} 100%)`,
							boxShadow: `inset 0 0 0 1px ${BADGE_GOLD.deep}`,
						},
						'&::before': {
							left: 0,
							transform: 'skewX(-14deg)',
							clipPath: 'polygon(0 0, 100% 0, 100% 78%, 50% 100%, 0 78%)',
						},
						'&::after': {
							right: 0,
							transform: 'skewX(14deg)',
							clipPath: 'polygon(0 0, 100% 0, 100% 78%, 50% 100%, 0 78%)',
						},
					}}
				/>
				<Box
					sx={{
						position: 'relative',
						zIndex: 1,
						width: { xs: 72, sm: 96 },
						height: { xs: 72, sm: 96 },
						borderRadius: '50%',
						border: '3px solid',
						borderColor: BADGE_GOLD.mid,
						boxShadow: `0 0 0 2px ${BADGE_GOLD.deep}, inset 0 0 0 1px ${BADGE_GOLD.light}`,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						overflow: 'hidden',
						bgcolor: 'surface.muted',
					}}
				>
					{showImage && imageSrc ? (
						<OptimizedImage
							src={imageSrc}
							alt={name}
							loading='lazy'
							sizes={BADGE_SIZES}
							onError={() => setImageFailed(true)}
							sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
						/>
					) : (
						<GpsFixedOutlined
							sx={{ fontSize: { xs: '1.75rem', sm: '2.5rem' }, color: 'text.secondary' }}
						/>
					)}
				</Box>
			</Box>
			<Typography
				sx={{
					fontWeight: 700,
					fontSize: '0.8125rem',
					textTransform: 'uppercase',
					lineHeight: 1.25,
					textAlign: 'center',
					maxWidth: { xs: 96, sm: 120 },
				}}
			>
				{name}
			</Typography>
			{dateLabel ? (
				<MonoText
					sx={{
						mt: 0.5,
						fontSize: '0.6875rem',
						color: 'text.secondary',
						letterSpacing: '0.04em',
					}}
				>
					{dateLabel}
				</MonoText>
			) : null}
		</Box>
	);
};
