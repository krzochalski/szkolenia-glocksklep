import { joinSx } from '../joinSx';
import '../theme';
import type { BoxProps } from '../primitives';
import { Box } from '../primitives';

const hardShadowSx = {
	border: '3px solid',
	borderColor: 'ink.main',
	boxShadow: (theme: { palette: { ink: { main: string } } }) =>
		`6px 6px 0 0 ${theme.palette.ink.main}`,
	width: 'calc(100% - 6px)',
	maxWidth: 'calc(100% - 6px)',
	marginBottom: '6px',
	boxSizing: 'border-box',
} as const;

export const HardShadow = ({ sx, ...props }: BoxProps) => (
	<Box {...props} sx={joinSx(hardShadowSx, sx)} />
);

export const TerminalBlock = ({ sx, ...props }: BoxProps) => (
	<Box
		{...props}
		sx={joinSx(
			{
				...hardShadowSx,
				backgroundColor: 'ink.main',
				color: 'ink.contrastText',
				padding: '2rem',
			},
			sx
		)}
	/>
);

export const MonoText = ({ sx, ...props }: BoxProps<'span'>) => (
	<Box
		component='span'
		{...props}
		sx={joinSx(
			{
				fontFamily: '"Space Mono", "Courier New", monospace',
				fontSize: '14px',
				lineHeight: 1.4,
				fontWeight: 500,
				textTransform: 'uppercase',
			},
			sx
		)}
	/>
);
