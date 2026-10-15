'use client';

import { OptimizedImage } from '@components/OptimizedImage';
import { Box, Link, Stack, Stagger, StaggerItem, Typography } from '@ui';
import { ABOUT_CONTENT, ABOUT_PHOTO_SRC } from '@/data/aboutContent';

export const ONasView = () => {
	const { name, tagline, historia, values, achievements, instagram, youtube, email } =
		ABOUT_CONTENT;

	return (
		<Box sx={{ maxWidth: 880 }}>
			<Stack
				direction={{ xs: 'column', sm: 'row' }}
				spacing={3}
				sx={{ alignItems: { sm: 'flex-start' }, mb: 5 }}
			>
				<OptimizedImage
					src={ABOUT_PHOTO_SRC}
					alt={name}
					sizes='(max-width: 600px) 200px, 220px'
					sx={{
						width: { xs: 200, sm: 220 },
						height: { xs: 200, sm: 220 },
						objectFit: 'cover',
						flexShrink: 0,
						border: (theme) => `2px solid ${theme.palette.divider}`,
					}}
				/>
				<Box>
					<Typography variant='h4' component='h1' gutterBottom>
						O nas
					</Typography>
					<Typography variant='h5' component='p' sx={{ fontWeight: 700, mb: 1 }}>
						{name}
					</Typography>
					<Typography color='text.secondary' sx={{ mb: 2 }}>
						{tagline}
					</Typography>
					<Typography variant='body2' color='text.secondary'>
						<Link href={instagram} target='_blank' rel='noopener noreferrer'>
							Instagram
						</Link>
						{' · '}
						<Link href={youtube} target='_blank' rel='noopener noreferrer'>
							YouTube
						</Link>
						{' · '}
						<Link href={`mailto:${email}`}>{email}</Link>
					</Typography>
				</Box>
			</Stack>

			<Typography variant='h6' component='h2' gutterBottom>
				Historia
			</Typography>
			<Stack spacing={2} sx={{ mb: 5 }}>
				{historia.map((paragraph) => (
					<Typography key={paragraph.slice(0, 32)}>{paragraph}</Typography>
				))}
			</Stack>

			<Typography variant='h6' component='h2' gutterBottom>
				Jak pracuję
			</Typography>
			<Stagger sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 5 }}>
				{values.map((item) => (
					<StaggerItem key={item.title}>
						<Typography sx={{ fontWeight: 700 }}>{item.title}</Typography>
						<Typography color='text.secondary'>{item.body}</Typography>
					</StaggerItem>
				))}
			</Stagger>

			<Typography variant='h6' component='h2' gutterBottom>
				Osiągnięcia
			</Typography>
			<Box component='ul' sx={{ m: 0, pl: 0, listStyle: 'none' }}>
				<Stagger sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
					{achievements.map((item) => (
						<StaggerItem key={`${item.year}-${item.title}`}>
							<Box component='li'>
								<Stack direction='row' spacing={2} sx={{ alignItems: 'baseline' }}>
									<Typography
										component='span'
										sx={{
											fontFamily: '"Space Mono", monospace',
											fontSize: '0.875rem',
											minWidth: 48,
											color: 'text.secondary',
										}}
									>
										{item.year}
									</Typography>
									<Box>
										<Typography component='span' sx={{ fontWeight: 700 }}>
											{item.title}
										</Typography>
										<Typography variant='body2' color='text.secondary'>
											{item.detail}
										</Typography>
									</Box>
								</Stack>
							</Box>
						</StaggerItem>
					))}
				</Stagger>
			</Box>
		</Box>
	);
};
