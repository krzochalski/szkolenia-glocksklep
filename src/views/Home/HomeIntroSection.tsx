'use client';

import { MarkdownContent, OptimizedImage } from '@components';
import { Box, HardShadow, MonoText, Stack, Typography } from '@ui';
import type { HomepageDocument } from '@/types/homepage';

type HomeIntroSectionProps = {
	readonly content: HomepageDocument;
};

/** Orange offset is 8px — keep HardShadow width/margin in sync so the shadow is not clipped. */
const introShadowSx = {
	bgcolor: 'ink.main',
	boxShadow: (theme: { palette: { primary: { main: string } } }) =>
		`8px 8px 0 0 ${theme.palette.primary.main}`,
	width: 'calc(100% - 8px)',
	maxWidth: 'calc(100% - 8px)',
	marginBottom: '8px',
} as const;

export const HomeIntroSection = ({ content }: HomeIntroSectionProps) => {
	const title = content.introTitle?.trim();
	const subline = content.introSubline?.trim();
	const markdown = content.introMarkdown?.trim();
	const banner = content.introBannerImage?.trim();
	if (!title && !subline && !markdown && !banner) return null;

	const text = (
		<Stack
			spacing={2}
			sx={{
				p: { xs: 3, md: 4 },
				minWidth: 0,
				maxWidth: '100%',
				height: '100%',
				justifyContent: 'center',
				bgcolor: 'ink.main',
				color: 'ink.contrastText',
				overflowWrap: 'anywhere',
				borderRight: { xs: 'none', md: banner ? '3px solid' : 'none' },
				borderColor: 'primary.main',
				'& a': {
					color: 'primary.main',
					fontWeight: 700,
					textDecoration: 'underline',
					textUnderlineOffset: 3,
				},
				'& strong': { color: 'common.white', fontWeight: 800 },
				'& p, & li': { color: 'rgba(255,255,255,0.82)' },
			}}
		>
			<MonoText
				sx={{
					display: 'block',
					fontSize: '0.6875rem',
					letterSpacing: '0.16em',
					color: 'primary.main',
				}}
			>
				Aktualności
			</MonoText>
			{title ? (
				<Typography
					variant='h3'
					component='h2'
					sx={{
						fontWeight: 800,
						fontSize: { xs: '1.75rem', md: '2.25rem' },
						lineHeight: 1.15,
						textTransform: 'uppercase',
						letterSpacing: '0.02em',
						color: 'common.white',
					}}
				>
					{title}
				</Typography>
			) : null}
			{subline ? (
				<Typography
					sx={{
						fontFamily: '"Space Mono", monospace',
						fontSize: '0.875rem',
						fontWeight: 700,
						letterSpacing: '0.04em',
						color: 'primary.main',
					}}
				>
					{subline}
				</Typography>
			) : null}
			{markdown ? (
				<Box
					sx={{
						pt: 0.5,
						minWidth: 0,
						borderTop: '2px solid',
						borderColor: 'primary.main',
						'& > *:first-of-type': { mt: 1.5 },
					}}
				>
					<MarkdownContent content={markdown} />
				</Box>
			) : null}
		</Stack>
	);

	if (!banner) {
		return <HardShadow sx={introShadowSx}>{text}</HardShadow>;
	}

	return (
		<HardShadow sx={introShadowSx}>
			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: {
						xs: 'minmax(0, 1fr)',
						md: 'repeat(2, minmax(0, 1fr))',
					},
					alignItems: 'stretch',
					minHeight: { md: 320 },
				}}
			>
				{text}
				<Box
					sx={{
						position: 'relative',
						minHeight: { xs: 240, md: '100%' },
						minWidth: 0,
						aspectRatio: { xs: '16 / 9', md: 'auto' },
						bgcolor: 'surface.muted',
						overflow: 'hidden',
						order: { xs: -1, md: 0 },
					}}
				>
					<OptimizedImage
						src={banner}
						alt=''
						sx={{
							position: { xs: 'relative', md: 'absolute' },
							inset: { md: 0 },
							width: '100%',
							maxWidth: '100%',
							height: '100%',
							objectFit: 'cover',
							objectPosition: 'center',
							display: 'block',
						}}
					/>
				</Box>
			</Box>
		</HardShadow>
	);
};
