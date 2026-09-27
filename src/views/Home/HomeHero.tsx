'use client';

import { OptimizedImage } from '@components';
import { Paths } from '@constants/paths';
import type { HomepageDocument } from '@/types/homepage';
import { Button, HeroCard, Stack, Typography } from '@ui';
import NextLink from 'next/link';

type HomeHeroProps = {
	readonly content: HomepageDocument;
};

export const HomeHero = ({ content }: HomeHeroProps) => (
	<HeroCard
		image={
			<OptimizedImage
				src={content.heroImage}
				alt=''
				fetchPriority='high'
				sx={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					display: 'block',
				}}
			/>
		}
	>
		<Typography
			variant='overline'
			sx={{ letterSpacing: 2, fontWeight: 700, color: 'text.secondary' }}
		>
			GLOCKSKLEP Szkolenia
		</Typography>
		<Typography
			variant='h1'
			component='h1'
			sx={{ fontSize: { xs: '2rem', md: '2.75rem' }, fontWeight: 800, lineHeight: 1.15 }}
		>
			{content.heroHeadline}
		</Typography>
		<Typography color='text.secondary' sx={{ maxWidth: 480 }}>
			{content.heroSubline}
		</Typography>
		<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
			<Button
				component={NextLink}
				href={Paths.najblizszeSzkolenia}
				variant='contained'
				size='large'
			>
				Najbliższe szkolenia
			</Button>
			<Button component={NextLink} href={Paths.courses} variant='outlined' size='large'>
				Wszystkie szkolenia
			</Button>
		</Stack>
	</HeroCard>
);
