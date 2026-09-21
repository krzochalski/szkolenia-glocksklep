import { Box, Typography } from '../primitives';

export type PriceMode = 'brutto' | 'netto';

type PriceToggleProps = {
	readonly mode: PriceMode;
	readonly onChange: (mode: PriceMode) => void;
};

const segmentSx = (active: boolean) =>
	({
		px: { xs: 1.5, sm: 2 },
		py: { xs: 1, sm: 1 },
		minHeight: 48,
		border: 'none',
		cursor: 'pointer',
		flexShrink: 0,
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		bgcolor: active ? 'text.primary' : 'transparent',
		color: active ? 'background.paper' : 'text.secondary',
		transition: 'background 0.2s, color 0.2s',
	}) as const;

export const PriceToggle = ({ mode, onChange }: PriceToggleProps) => (
	<Box
		sx={{
			display: 'inline-flex',
			alignItems: 'center',
			flexShrink: 0,
			border: '1px solid',
			borderColor: 'divider',
		}}
	>
		<Box
			component='button'
			type='button'
			onClick={() => onChange('netto')}
			sx={segmentSx(mode === 'netto')}
		>
			<Typography
				sx={{
					fontSize: { xs: '0.6875rem', sm: '0.625rem' },
					fontWeight: 700,
					letterSpacing: { xs: '0.1em', sm: '0.15em' },
				}}
			>
				NETTO
			</Typography>
		</Box>
		<Box
			component='button'
			type='button'
			onClick={() => onChange('brutto')}
			sx={{
				...segmentSx(mode === 'brutto'),
				borderLeft: '1px solid',
				borderColor: 'divider',
			}}
		>
			<Typography
				sx={{
					fontSize: { xs: '0.6875rem', sm: '0.625rem' },
					fontWeight: 700,
					letterSpacing: { xs: '0.1em', sm: '0.15em' },
				}}
			>
				BRUTTO
			</Typography>
		</Box>
	</Box>
);
