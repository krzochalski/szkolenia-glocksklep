import type { ReactNode } from 'react';
import { joinSx } from '../joinSx';
import type { BoxProps } from '../primitives';
import { Box, Typography } from '../primitives';
import { HardShadow } from './HardShadow';

export type PathStepCardProps = {
	/** Step index badge (e.g. `"01"`). Omit to hide. */
	readonly index?: ReactNode;
	readonly title: ReactNode;
	/** Mono meta under the title (duration, level, …). */
	readonly meta?: ReactNode;
	/** CTA or secondary action at the bottom. */
	readonly action?: ReactNode;
	readonly sx?: BoxProps['sx'];
};

/**
 * Hard-shadow progression step. Title / meta / action stay in the app
 * (links, routing, copy). Optional `index` renders an orange mono badge.
 */
export const PathStepCard = ({ index, title, meta, action, sx }: PathStepCardProps) => (
	<HardShadow
		sx={joinSx(
			{
				width: '100%',
				height: '100%',
				bgcolor: 'background.paper',
				display: 'flex',
				flexDirection: 'column',
				boxSizing: 'border-box',
				transition: 'transform 140ms ease, box-shadow 140ms ease, background-color 140ms ease',
				'@media (hover: hover)': {
					'&:hover': {
						transform: 'translate(-2px, -2px)',
						boxShadow: (theme) => `8px 8px 0 0 ${theme.palette.ink.main}`,
						bgcolor: 'surface.muted',
					},
				},
				'&:active': {
					transform: 'translate(2px, 2px)',
					boxShadow: (theme) => `3px 3px 0 0 ${theme.palette.ink.main}`,
				},
			},
			sx
		)}
	>
		<Box
			sx={{
				display: 'flex',
				gap: 2,
				p: { xs: 2, sm: 2.5 },
				flex: 1,
				minHeight: 0,
				minWidth: 0,
			}}
		>
			{index != null && index !== '' ? (
				<Typography
					component='span'
					aria-hidden
					sx={{
						fontFamily: '"Space Mono", monospace',
						fontSize: '0.75rem',
						fontWeight: 700,
						letterSpacing: '0.1em',
						lineHeight: 1.2,
						color: 'primary.main',
						pt: 0.35,
						minWidth: 28,
						flexShrink: 0,
					}}
				>
					{index}
				</Typography>
			) : null}
			<Box
				sx={{
					flex: 1,
					display: 'flex',
					flexDirection: 'column',
					gap: 0.75,
					minWidth: 0,
				}}
			>
				<Box sx={{ minWidth: 0 }}>{title}</Box>
				{meta != null ? <Box>{meta}</Box> : null}
				{action != null ? <Box sx={{ mt: 'auto', pt: 1 }}>{action}</Box> : null}
			</Box>
		</Box>
	</HardShadow>
);
