'use client';

import type { HomepageDocument } from '@/types/homepage';
import { Box, FeatureTile, Stack, Typography } from '@ui';
import { CheckCircle, GpsFixed, TrackChangesIcon } from '@ui/icons';
import type { ReactNode } from 'react';

const WAY_ICONS: readonly ReactNode[] = [
	<CheckCircle key='check' sx={{ color: 'ink.main' }} />,
	<GpsFixed key='gps' sx={{ color: 'ink.main' }} />,
	<TrackChangesIcon key='track' sx={{ color: 'ink.main' }} />,
];

type HomeMissionAndWaysProps = {
	readonly content: HomepageDocument;
};

export const HomeMissionAndWays = ({ content }: HomeMissionAndWaysProps) => (
	<>
		<Box>
			<Typography variant='h4' component='h2' gutterBottom>
				{content.missionTitle}
			</Typography>
			<Typography color='text.secondary' sx={{ maxWidth: 720, whiteSpace: 'pre-line' }}>
				{content.missionBody}
			</Typography>
		</Box>

		<Box>
			<Typography variant='h4' component='h2' gutterBottom>
				Jak pracujemy
			</Typography>
			<Stack spacing={3} sx={{ mt: 2 }}>
				{content.waysOfWorking.map((way, index) => (
					<FeatureTile
						key={way.id}
						variant='row'
						icon={WAY_ICONS[index % WAY_ICONS.length]}
						title={way.title}
						description={way.description}
					/>
				))}
			</Stack>
		</Box>
	</>
);
