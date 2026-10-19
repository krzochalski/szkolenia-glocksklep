'use client';

import { OptimizedImage } from '@components';
import { missionArtSrc, wayArtSrc } from '@constants/homepageWayArt';
import type { HomepageDocument } from '@/types/homepage';
import { Box, FeatureTile, Stack, Typography } from '@ui';

type HomeMissionAndWaysProps = {
	readonly content: HomepageDocument;
};

const PixelIcon = ({ src }: { readonly src: string }) => (
	<OptimizedImage
		src={src}
		alt=''
		sx={{
			width: 48,
			height: 48,
			objectFit: 'cover',
			imageRendering: 'pixelated',
			display: 'block',
		}}
	/>
);

export const HomeMissionAndWays = ({ content }: HomeMissionAndWaysProps) => (
	<Box>
		<Typography variant='h4' component='h2' gutterBottom>
			{content.missionTitle}
		</Typography>
		<Stack spacing={3} sx={{ mt: 1, mb: content.waysOfWorking.length > 0 ? 4 : 0 }}>
			{content.missionPoints.map((point, index) => (
				<Box
					key={point.id}
					sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}
				>
					<Box
						sx={{
							width: 48,
							height: 48,
							minWidth: 48,
							bgcolor: 'ink.main',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<PixelIcon src={missionArtSrc(point.id, index)} />
					</Box>
					<Typography color='text.secondary' sx={{ pt: 0.5, lineHeight: 1.6 }}>
						{point.body}
					</Typography>
				</Box>
			))}
		</Stack>
		{content.waysOfWorking.length > 0 ? (
			<Stack spacing={3}>
				{content.waysOfWorking.map((way, index) => (
					<FeatureTile
						key={way.id}
						variant='row'
						iconBg='ink.main'
						icon={<PixelIcon src={wayArtSrc(way.id, index)} />}
						title={way.title}
						description={way.description}
					/>
				))}
			</Stack>
		) : null}
	</Box>
);
