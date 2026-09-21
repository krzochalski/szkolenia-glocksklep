import { Typography } from '@ui';
import type { ReactNode } from 'react';

type SectionTitleProps = {
	readonly children: ReactNode;
};

export const SectionTitle = ({ children }: SectionTitleProps) => (
	<Typography variant='subtitle2' color='primary' sx={{ fontWeight: 700, letterSpacing: 0.4 }}>
		{children}
	</Typography>
);
