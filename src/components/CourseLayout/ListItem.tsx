import { Box, Typography } from '@ui';
import type { ReactNode } from 'react';

type ListItemProps = {
	readonly icon: ReactNode;
	readonly text: string;
	readonly color: string;
};

export const ListItem = ({ icon, text, color }: ListItemProps) => (
	<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
		<Box sx={{ color, mt: 0.25, flexShrink: 0 }}>{icon}</Box>
		<Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', lineHeight: 1.7 }}>
			{text}
		</Typography>
	</Box>
);
