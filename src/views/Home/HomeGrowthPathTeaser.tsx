'use client';

import { Paths } from '@constants/paths';
import type { HomepageDocument } from '@/types/homepage';
import { Button, HardShadow, Typography } from '@ui';
import { ArrowForwardIcon } from '@ui/icons';
import NextLink from 'next/link';

type HomeGrowthPathTeaserProps = {
	readonly content: HomepageDocument;
};

export const HomeGrowthPathTeaser = ({ content }: HomeGrowthPathTeaserProps) => (
	<HardShadow sx={{ p: { xs: 3, md: 4 }, bgcolor: 'background.paper' }}>
		<Typography variant='h4' component='h2' gutterBottom>
			Ścieżka rozwoju
		</Typography>
		<Typography color='text.secondary' sx={{ maxWidth: 640, mb: 3 }}>
			{content.growthPathTeaser}
		</Typography>
		<Button
			component={NextLink}
			href={Paths.sciezkaRozwoju}
			variant='contained'
			endIcon={<ArrowForwardIcon />}
		>
			Zobacz ścieżkę rozwoju
		</Button>
	</HardShadow>
);
