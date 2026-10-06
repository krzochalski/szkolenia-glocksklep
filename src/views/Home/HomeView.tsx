'use client';

import { getHomepage } from '@services/homepage';
import { Alert, Box, CircularProgress, ContentSwap, Stack } from '@ui';
import { useQuery } from '@tanstack/react-query';
import { HomeGrowthPathTeaser } from './HomeGrowthPathTeaser';
import { HomeHero } from './HomeHero';
import { HomeMissionAndWays } from './HomeMissionAndWays';
import { HomeNearestDates } from './HomeNearestDates';
import { HomePrivateFormats } from './HomePrivateFormats';

export const HomeView = () => {
	const { data, isLoading } = useQuery({
		queryKey: ['homepage'],
		queryFn: getHomepage,
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
					<Alert severity='warning' sx={{ borderRadius: 0 }}>
						Mamy już jesień, więc będzie szybko ciemno, będzie zimno i prawdopodobnie w każdy
						weekend będzie padać&nbsp;:) Gdy jest wolne miejsce — zapisz się na termin poniżej.
						Gdy termin jest pełny, zostaw kontakt na liście oczekujących. Można też wpaść na
						zajęcia indywidualne.
					</Alert>
					<HomeMissionAndWays content={data} />
					<HomeGrowthPathTeaser content={data} />
					<HomeNearestDates />
					<HomePrivateFormats content={data} />
				</Stack>
			)}
		</ContentSwap>
	);
};
