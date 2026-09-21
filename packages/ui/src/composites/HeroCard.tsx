import type { BoxProps } from '../primitives';
import { Box } from '../primitives';
import type { ReactNode } from 'react';
import { HardShadow } from './HardShadow';

type HeroCardProps = {
	readonly image: ReactNode;
	readonly children: ReactNode;
	readonly sx?: BoxProps['sx'];
};

export const HeroCard = ({ image, children, sx }: HeroCardProps) => (
	<HardShadow
		sx={[
			{
				bgcolor: 'surface.muted',
				p: { xs: 4, md: 5 },
				display: 'flex',
				flexDirection: { xs: 'column', md: 'row' },
				gap: { xs: 4, md: 5 },
				alignItems: 'center',
			},
			...(sx ? (Array.isArray(sx) ? sx : [sx]) : []),
		]}
	>
		<Box sx={{ display: 'flex', justifyContent: 'center' }}>
			<Box
				sx={{
					border: '3px solid',
					borderColor: 'ink.main',
					bgcolor: 'background.paper',
					p: 1,
					width: { xs: 160, md: 192 },
					height: { xs: 160, md: 192 },
					position: 'relative',
					overflow: 'hidden',
				}}
			>
				{image}
			</Box>
		</Box>
		<Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>{children}</Box>
	</HardShadow>
);
