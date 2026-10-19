'use client';

import { Paths } from '@constants/paths';
import { Box, Link, Typography } from '@ui';
import NextLink from 'next/link';
import type { CoursePathPlacement } from '@/utils/pathProgress';
import { formatCoursePathPlacement } from '@/utils/pathProgress';

type CoursePathGraphProps = {
	readonly placement: CoursePathPlacement;
};

/**
 * Compact horizontal path graph for course facts: nodes + connectors,
 * current step highlighted, track title underneath.
 */
export const CoursePathGraph = ({ placement }: CoursePathGraphProps) => {
	const steps = Array.from({ length: placement.stepTotal }, (_, i) => i + 1);
	const ariaLabel = formatCoursePathPlacement(placement);

	return (
		<Box sx={{ minWidth: 0, maxWidth: { xs: '100%', sm: 280 } }}>
			<Typography
				sx={{
					fontFamily: '"Space Mono", monospace',
					fontSize: '0.625rem',
					fontWeight: 700,
					letterSpacing: '0.12em',
					textTransform: 'uppercase',
					color: 'text.secondary',
				}}
			>
				Ścieżka
			</Typography>
			<Link
				component={NextLink}
				href={Paths.sciezkaRozwoju}
				underline='none'
				color='inherit'
				aria-label={ariaLabel}
				sx={{
					display: 'block',
					mt: 0.75,
					'&:hover .path-track-title': { color: 'primary.main' },
				}}
			>
				<Box
					aria-hidden
					sx={{
						display: 'flex',
						alignItems: 'center',
						width: '100%',
						maxWidth: 200,
					}}
				>
					{steps.map((step, index) => {
						const state =
							step < placement.stepIndex
								? 'past'
								: step === placement.stepIndex
									? 'current'
									: 'future';
						return (
							<Box
								key={step}
								sx={{
									display: 'flex',
									alignItems: 'center',
									flex: index < steps.length - 1 ? 1 : '0 0 auto',
									minWidth: 0,
								}}
							>
								<PathNode state={state} />
								{index < steps.length - 1 ? (
									<Box
										sx={{
											flex: 1,
											height: 2,
											mx: 0.25,
											minWidth: 6,
											bgcolor: step < placement.stepIndex ? 'primary.main' : 'ink.main',
											opacity: step < placement.stepIndex ? 1 : 0.35,
										}}
									/>
								) : null}
							</Box>
						);
					})}
				</Box>
				<Typography
					className='path-track-title'
					sx={{
						mt: 0.75,
						fontWeight: 700,
						fontSize: '0.8125rem',
						lineHeight: 1.25,
						transition: 'color 0.15s ease',
					}}
				>
					{placement.trackTitle}
				</Typography>
			</Link>
		</Box>
	);
};

type PathNodeState = 'past' | 'current' | 'future';

const PathNode = ({ state }: { state: PathNodeState }) => (
	<Box
		sx={{
			width: state === 'current' ? 12 : 8,
			height: state === 'current' ? 12 : 8,
			borderRadius: '50%',
			flexShrink: 0,
			border: '2px solid',
			borderColor: 'ink.main',
			bgcolor:
				state === 'current' ? 'primary.main' : state === 'past' ? 'ink.main' : 'background.paper',
			boxShadow: state === 'current' ? (theme) => `2px 2px 0 ${theme.palette.ink.main}` : undefined,
		}}
	/>
);
