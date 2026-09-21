import { joinSx } from '../joinSx';
import type { BoxProps } from '../primitives';
import { Box } from '../primitives';

export type PathConnectorProps = {
	/** Extra styles on the outer flex wrapper. */
	readonly sx?: BoxProps['sx'];
};

/**
 * Centered downward progression marker (stem + orange chevron).
 * Place between stacked path steps / levels.
 */
export const PathConnector = ({ sx }: PathConnectorProps) => (
	<Box
		aria-hidden
		sx={joinSx(
			{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				width: '100%',
				py: 1.25,
				gap: 0.75,
			},
			sx
		)}
	>
		<Box
			sx={{
				width: 2,
				height: 14,
				flexShrink: 0,
				bgcolor: 'ink.main',
			}}
		/>
		<Box
			sx={{
				width: 0,
				height: 0,
				borderLeft: '7px solid transparent',
				borderRight: '7px solid transparent',
				borderTop: '10px solid',
				borderTopColor: 'primary.main',
			}}
		/>
	</Box>
);
