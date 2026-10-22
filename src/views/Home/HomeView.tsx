'use client';

import { getHomepage } from '@services/homepage';
import { Box, CircularProgress, ContentSwap, Stack } from '@ui';
import { useQuery } from '@tanstack/react-query';
import type { Course } from '@/types/course';
import type { HomepageDocument } from '@/types/homepage';
import { HomeGrowthPathTeaser } from './HomeGrowthPathTeaser';
import { HomeHero } from './HomeHero';
import { HomeIntroSection } from './HomeIntroSection';
import { HomeMissionAndWays } from './HomeMissionAndWays';
import { HomeNearestDates } from './HomeNearestDates';
import { HomePrivateFormats } from './HomePrivateFormats';

type Props = {
	readonly initialHomepage?: HomepageDocument;
	readonly initialCourses?: Course[];
};

export const HomeView = ({ initialHomepage, initialCourses }: Props) => {
	const { data, isLoading } = useQuery({
		queryKey: ['homepage'],
		queryFn: getHomepage,
		...(initialHomepage !== undefined ? { initialData: initialHomepage } : {}),
	});

	return (
		<ContentSwap state={isLoading || !data ? 'loading' : 'content'}>
			{isLoading || !data ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
					<CircularProgress />
				</Box>
			) : (
				<Stack spacing={6}>
					<HomeHero content={data} />
					<HomeIntroSection content={data} />
					<HomeNearestDates initialCourses={initialCourses} />
					<HomeMissionAndWays content={data} />
					<HomeGrowthPathTeaser content={data} />
					<HomePrivateFormats content={data} />
				</Stack>
			)}
		</ContentSwap>
	);
};
