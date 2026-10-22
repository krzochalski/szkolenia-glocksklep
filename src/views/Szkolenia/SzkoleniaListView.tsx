'use client';

import { PageHeading } from '@components';
import { getCourseDescriptions } from '@services/courseDescriptions';
import { getCourses } from '@services/courses';
import { useQuery } from '@tanstack/react-query';
import { Box, ContentSwap, Stagger, StaggerItem, Typography } from '@ui';
import { useMemo } from 'react';
import type { Course } from '@/types/course';
import type { CourseDescription } from '@/types/courseDescription';
import { isCourseInactive } from '@/utils/courseDates';
import { getCourseKind, resolvePrerequisiteNames } from '@/utils/courseKind';
import { resolveCourseThumbnailFrom } from '@/utils/courseImages';
import { compareCoursesByOrder } from '@/utils/courseOrder';
import { CourseCard } from './CourseCard';

type Props = {
	readonly initialCourses?: Course[];
	readonly initialDescriptions?: CourseDescription[];
};

const CatalogSection = ({
	title,
	description,
	courses,
	descriptionBySlug,
	allCourses,
}: {
	readonly title: string;
	readonly description: string;
	readonly courses: Course[];
	readonly descriptionBySlug: Map<string, CourseDescription>;
	readonly allCourses: Course[];
}) => {
	if (courses.length === 0) return null;

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
			<Box>
				<Typography
					variant='h2'
					sx={{
						fontSize: { xs: '1.5rem', md: '1.75rem' },
						textTransform: 'uppercase',
						mb: 0.5,
					}}
				>
					{title}
				</Typography>
				<Typography color='text.secondary' sx={{ fontFamily: '"Space Mono", monospace', fontSize: '0.8125rem' }}>
					{description}
				</Typography>
			</Box>
			<Stagger sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
				{courses.map((course) => (
					<StaggerItem key={course.id}>
						<CourseCard
							course={course}
							imageSrc={resolveCourseThumbnailFrom(course, descriptionBySlug.get(course.slug))}
							prerequisiteNames={resolvePrerequisiteNames(course, allCourses)}
						/>
					</StaggerItem>
				))}
			</Stagger>
		</Box>
	);
};

export const SzkoleniaListView = ({ initialCourses, initialDescriptions }: Props) => {
	const {
		data: courses = [],
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['courses'],
		queryFn: getCourses,
		...(initialCourses !== undefined ? { initialData: initialCourses } : {}),
	});
	const { data: descriptions = [] } = useQuery({
		queryKey: ['courseDescriptions'],
		queryFn: getCourseDescriptions,
		...(initialDescriptions !== undefined ? { initialData: initialDescriptions } : {}),
	});

	const descriptionBySlug = useMemo(() => {
		const map = new Map(descriptions.map((d) => [d.slug, d]));
		return map;
	}, [descriptions]);

	const { programCourses, practiceCourses } = useMemo(() => {
		const active = [...courses].filter((course) => !isCourseInactive(course)).sort(compareCoursesByOrder);
		return {
			programCourses: active.filter((c) => getCourseKind(c) === 'course'),
			practiceCourses: active.filter((c) => getCourseKind(c) === 'practice'),
		};
	}, [courses]);

	const hasAny = programCourses.length > 0 || practiceCourses.length > 0;

	return (
		<>
			<PageHeading
				title='Szkolenia i treningi'
				description='Programy szkoleniowe oraz treningi utrwalające umiejętności.'
			/>

			<ContentSwap
				state={
					isLoading
						? 'loading'
						: isError
							? 'error'
							: !hasAny
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
				) : !hasAny ? (
					<Typography sx={{ fontFamily: '"Space Mono", monospace' }}>
						Brak szkoleń w ofercie.
					</Typography>
				) : (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
						<CatalogSection
							title='Szkolenia'
							description='Pełne programy z terminami — wybierz poziom i sprawdź dostępne daty.'
							courses={programCourses}
							descriptionBySlug={descriptionBySlug}
							allCourses={courses}
						/>
						<CatalogSection
							title='Treningi'
							description='Sesje utrwalające umiejętności z ukończonych szkoleń (lub otwarte treningi).'
							courses={practiceCourses}
							descriptionBySlug={descriptionBySlug}
							allCourses={courses}
						/>
					</Box>
				)}
			</ContentSwap>
		</>
	);
};
