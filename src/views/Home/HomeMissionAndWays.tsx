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
				<FeatureTile
					key={point.id}
					variant='row'
					iconBg='ink.main'
					icon={<PixelIcon src={missionArtSrc(point.id, index)} />}
					title={point.title}
					description={point.body}
				/>
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
