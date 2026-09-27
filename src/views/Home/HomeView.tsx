'use client';

import { getHomepage } from '@services/homepage';
import { Alert, Box, CircularProgress, Stack } from '@ui';
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

	if (isLoading || !data) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Stack spacing={6}>
			<HomeHero content={data} />
			<Alert severity='warning' sx={{ borderRadius: 0 }}>
				Mamy już jesień, więc będzie szybko ciemno, będzie zimno i prawdopodobnie w każdy weekend
				będzie padać&nbsp;:) Aktualnie polecam zapisywać się na listy oczekujących pod konkretne
				zajęcia i poczekać na kontakt w tej sprawie. Można też wpaść na zajęcia indywidualne.
			</Alert>
			<HomeMissionAndWays content={data} />
			<HomeGrowthPathTeaser content={data} />
			<HomeNearestDates />
			<HomePrivateFormats content={data} />
		</Stack>
	);
};
