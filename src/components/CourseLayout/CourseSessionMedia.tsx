'use client';

import { OptimizedImage } from '@components';
import { Box, Typography } from '@ui';
import { extractYoutubeId, youtubeEmbedUrl } from '@/utils/youtube';
import { SectionLabel } from './SectionLabel';

type CourseSessionMediaProps = {
	readonly gallery?: string[];
	readonly sessionVideoUrl?: string;
};

export const CourseSessionMedia = ({ gallery, sessionVideoUrl }: CourseSessionMediaProps) => {
	const photos = gallery?.filter(Boolean) ?? [];
	const videoId = sessionVideoUrl ? extractYoutubeId(sessionVideoUrl) : null;
	if (photos.length === 0 && !videoId) return null;

	return (
		<Box sx={{ mb: 6 }}>
			<SectionLabel>Z zajęć</SectionLabel>
			<Typography variant='h2' sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, mb: 3 }}>
				Jak to wygląda na żywo
			</Typography>
			{photos.length > 0 ? (
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: {
							xs: '1fr',
							sm: photos.length === 1 ? '1fr' : '1fr 1fr',
							md: photos.length >= 3 ? '1fr 1fr 1fr' : photos.length === 2 ? '1fr 1fr' : '1fr',
						},
						gap: 2,
						mb: videoId ? 3 : 0,
					}}
				>
					{photos.map((src) => (
						<Box
							key={src}
							sx={{
								position: 'relative',
								aspectRatio: '4 / 3',
								border: '3px solid',
								borderColor: 'ink.main',
								overflow: 'hidden',
								bgcolor: 'surface.muted',
							}}
						>
							<OptimizedImage
								src={src}
								alt=''
								loading='lazy'
								sx={{
									position: 'absolute',
									inset: 0,
									width: '100%',
									height: '100%',
									objectFit: 'cover',
								}}
							/>
						</Box>
					))}
				</Box>
			) : null}
			{videoId ? (
				<Box
					sx={{
						position: 'relative',
						width: '100%',
						maxWidth: 720,
						aspectRatio: '16 / 9',
						border: '3px solid',
						borderColor: 'ink.main',
						overflow: 'hidden',
						bgcolor: 'ink.main',
					}}
				>
					<Box
						component='iframe'
						src={youtubeEmbedUrl(videoId)}
						title='Film z zajęć'
						allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
						allowFullScreen
						sx={{
							position: 'absolute',
							inset: 0,
							width: '100%',
							height: '100%',
							border: 0,
						}}
					/>
				</Box>
			) : null}
		</Box>
	);
};
