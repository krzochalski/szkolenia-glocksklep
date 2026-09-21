import { Box, Typography } from '@ui';
import type { ReactNode } from 'react';

type SectionLabelProps = {
	readonly children: ReactNode;
	readonly dotColor?: string;
};

export const SectionLabel = ({ children, dotColor = 'primary.main' }: SectionLabelProps) => (
	<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
		<Box sx={{ width: 8, height: 8, bgcolor: dotColor, flexShrink: 0 }} />
		<Typography
			sx={{
				fontFamily: '"Space Mono", monospace',
				fontSize: '0.75rem',
				fontWeight: 900,
				letterSpacing: '0.3em',
				textTransform: 'uppercase',
			}}
		>
			{children}
		</Typography>
	</Box>
);
