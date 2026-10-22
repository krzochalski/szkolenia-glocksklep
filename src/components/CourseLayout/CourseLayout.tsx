'use client';

import { OptimizedImage } from '@components';
import { Paths } from '@constants/paths';
import { Box, Button, Divider, HardShadow, Typography } from '@ui';
import { ArrowBack, Block, CheckCircle } from '@ui/icons';
import NextLink from 'next/link';
import { Suspense, useState } from 'react';
import { CourseFacts, type CourseFactsMeta } from '@/components/CourseFacts';
import { CourseDatesSection } from '@/components/CourseLayout/CourseDatesSection';
import type { CourseSchemaData } from '@/components/CourseLayout/CourseLayout.types';
import { CourseRequirementsStrip } from '@/components/CourseLayout/CourseRequirementsStrip';
import { CourseSessionMedia } from '@/components/CourseLayout/CourseSessionMedia';
import { ListItem } from '@/components/CourseLayout/ListItem';
import { ModuleCard } from '@/components/CourseLayout/ModuleCard';
import { SectionLabel } from '@/components/CourseLayout/SectionLabel';

export type { CourseModule, CourseSchemaData } from './CourseLayout.types';

type CourseLayoutProps = {
	readonly data: CourseSchemaData;
	readonly hero?: string;
	readonly courseMeta?: CourseFactsMeta;
	/** Optional focus line under the headline (e.g. date edition subtitle). */
	readonly subtitle?: string;
	/** Practice: names of required completed courses */
	readonly prerequisiteNames?: string[];
	/** Catalog kind label for eyebrow prefix (e.g. Trening) */
	readonly kindLabel?: string;
};

export const CourseLayout = ({
	data,
	hero,
	courseMeta,
	subtitle,
	prerequisiteNames = [],
	kindLabel,
}: CourseLayoutProps) => {
	const {
		eyebrow,
		headline,
		description,
		slug,
		modules,
		forWhom,
		forWhomHeading,
		notExpect,
		notExpectHeading,
		bring,
		bringHeading,
		dontBring,
		dontBringHeading,
		outcomes,
		outcomesHeading,
		requirements,
		gallery,
		sessionVideoUrl,
	} = data;

	const [imageFailed, setImageFailed] = useState(false);
	const hasForWhomSection = Boolean(forWhom?.length || notExpect?.length);
	const hasBringSection = Boolean(bring?.length || dontBring?.length);
	const hasOutcomes = Boolean(outcomes?.length);
	const hasSessionMedia = Boolean(gallery?.length || sessionVideoUrl);
	const showHero = Boolean(hero) && !imageFailed;

	return (
		<Box>
			<Box sx={{ mb: 2 }}>
				<Button
					component={NextLink}
					href={Paths.courses}
					startIcon={<ArrowBack />}
					variant='text'
					sx={{
						fontFamily: '"Space Mono", monospace',
						fontSize: '0.75rem',
						letterSpacing: '0.08em',
						textTransform: 'uppercase',
						px: 0,
					}}
				>
					Powrót do listy szkoleń
				</Button>
			</Box>

			<HardShadow
				sx={{
					position: 'relative',
					overflow: 'hidden',
					bgcolor: 'surface.muted',
					p: { xs: 3, md: 5 },
					mb: 4,
					minHeight: { xs: 220, md: 280 },
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'flex-end',
				}}
			>
				{showHero && hero ? (
					<OptimizedImage
						src={hero}
						alt=''
						loading='lazy'
						onError={() => setImageFailed(true)}
						sx={{
							position: 'absolute',
							inset: 0,
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							opacity: 0.35,
						}}
					/>
				) : null}
				<Box
					sx={{
						position: 'absolute',
						inset: 0,
						background:
							'linear-gradient(to top, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 45%, transparent 100%)',
					}}
				/>
				<Box sx={{ position: 'relative', zIndex: 1 }}>
					<Typography
						sx={{
							color: 'primary.main',
							fontFamily: '"Space Mono", monospace',
							fontSize: '0.625rem',
							fontWeight: 700,
							letterSpacing: '0.2em',
							textTransform: 'uppercase',
							mb: 2,
						}}
					>
						{kindLabel ? `${kindLabel} · ${eyebrow}` : eyebrow}
					</Typography>
					<Typography
						variant='h1'
						sx={{
							fontSize: { xs: '2rem', md: '3.25rem' },
							lineHeight: 0.95,
							textTransform: 'uppercase',
							mb: subtitle ? 1 : 2,
						}}
					>
						{headline[0]}
						{headline[1] ? (
							<>
								<br />
								<Box component='span' sx={{ color: 'primary.main' }}>
									{headline[1]}
								</Box>
							</>
						) : null}
					</Typography>
					{subtitle ? (
						<Typography
							sx={{
								fontFamily: '"Space Mono", monospace',
								fontSize: { xs: '0.8125rem', md: '0.9375rem' },
								fontWeight: 700,
								letterSpacing: '0.06em',
								textTransform: 'uppercase',
								color: 'primary.main',
								mb: 2,
							}}
						>
							{subtitle}
						</Typography>
					) : null}
					{prerequisiteNames.length > 0 ? (
						<Typography
							sx={{
								fontFamily: '"Space Mono", monospace',
								fontSize: '0.75rem',
								letterSpacing: '0.04em',
								color: 'text.secondary',
								mb: 2,
							}}
						>
							Wymaga ukończenia: {prerequisiteNames.join(', ')}
						</Typography>
					) : null}
					<Typography
						sx={{
							color: 'text.secondary',
							lineHeight: 1.8,
							fontSize: { xs: '1rem', md: '1.125rem' },
						}}
					>
						{description}
					</Typography>
					{courseMeta ? <CourseFacts meta={courseMeta} /> : null}
				</Box>
			</HardShadow>

			{requirements ? <CourseRequirementsStrip requirements={requirements} /> : null}

			{modules?.length ? (
				<Box sx={{ mb: 6 }}>
					<SectionLabel>Program zajęć</SectionLabel>
					<Typography variant='h2' sx={{ fontSize: { xs: '1.75rem', md: '2.5rem' }, mb: 4 }}>
						Zakres merytoryczny
					</Typography>
					<Box
						sx={{
							display: 'grid',
							gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' },
							gap: '2px',
							bgcolor: 'ink.main',
							border: '2px solid',
							borderColor: 'ink.main',
						}}
					>
						{modules.map((m) => (
							<ModuleCard key={m.title} {...m} />
						))}
					</Box>
				</Box>
			) : null}

			{hasForWhomSection ? (
				<>
					<Divider sx={{ mb: 6 }} />
					<Box
						sx={{
							mb: 6,
							display: 'grid',
							gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
							gap: 6,
						}}
					>
						{forWhom?.length ? (
							<Box>
								<SectionLabel>Zajęcia dla</SectionLabel>
								<Typography variant='h2' sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, mb: 3 }}>
									{forWhomHeading || 'Kto powinien przyjść'}
								</Typography>
								<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
									{forWhom.map((item) => (
										<ListItem
											key={item}
											icon={<CheckCircle sx={{ fontSize: 18 }} />}
											text={item}
											color='primary.main'
										/>
									))}
								</Box>
							</Box>
						) : null}
						{notExpect?.length ? (
							<Box>
								<SectionLabel>Czego nie będzie</SectionLabel>
								<Typography variant='h2' sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, mb: 3 }}>
									{notExpectHeading || 'Czego się nie spodziewaj'}
								</Typography>
								<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
									{notExpect.map((item) => (
										<ListItem
											key={item}
											icon={<Block sx={{ fontSize: 18 }} />}
											text={item}
											color='error.main'
										/>
									))}
								</Box>
							</Box>
						) : null}
					</Box>
				</>
			) : null}

			{hasOutcomes ? (
				<>
					<Divider sx={{ mb: 6 }} />
					<Box sx={{ mb: 6 }}>
						<SectionLabel>Efekty</SectionLabel>
						<Typography variant='h2' sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, mb: 3 }}>
							{outcomesHeading || 'Co będziesz umiał'}
						</Typography>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
							{outcomes?.map((item) => (
								<ListItem
									key={item}
									icon={<CheckCircle sx={{ fontSize: 18 }} />}
									text={item}
									color='primary.main'
								/>
							))}
						</Box>
					</Box>
				</>
			) : null}

			{hasBringSection ? (
				<>
					<Divider sx={{ mb: 6 }} />
					<Box
						sx={{
							mb: 4,
							display: 'grid',
							gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
							gap: 6,
						}}
					>
						{bring?.length ? (
							<Box>
								<SectionLabel>Co zabrać</SectionLabel>
								<Typography variant='h2' sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, mb: 3 }}>
									{bringHeading || 'Wyposażenie'}
								</Typography>
								<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
									{bring.map((item) => (
										<ListItem
											key={item}
											icon={<CheckCircle sx={{ fontSize: 16 }} />}
											text={item}
											color='primary.main'
										/>
									))}
								</Box>
							</Box>
						) : null}
						{dontBring?.length ? (
							<Box>
								<SectionLabel>Czego nie zabierać</SectionLabel>
								<Typography variant='h2' sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, mb: 3 }}>
									{dontBringHeading || 'Zostaw w domu'}
								</Typography>
								<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
									{dontBring.map((item) => (
										<ListItem
											key={item}
											icon={<Block sx={{ fontSize: 16 }} />}
											text={item}
											color='error.main'
										/>
									))}
								</Box>
							</Box>
						) : null}
					</Box>
				</>
			) : null}

			{hasSessionMedia ? (
				<>
					<Divider sx={{ mb: 6 }} />
					<CourseSessionMedia gallery={gallery} sessionVideoUrl={sessionVideoUrl} />
				</>
			) : null}

			{slug ? (
				<Suspense fallback={null}>
					<CourseDatesSection slug={slug} />
				</Suspense>
			) : null}
		</Box>
	);
};
