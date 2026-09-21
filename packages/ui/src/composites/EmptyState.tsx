import { Container, Typography } from '../primitives';
import type { ReactNode } from 'react';

type EmptyStateProps = {
	readonly title: string;
	readonly action?: ReactNode;
};

export const EmptyState = ({ title, action }: EmptyStateProps) => (
	<Container maxWidth='xl' sx={{ py: 20, textAlign: 'center' }}>
		<Typography variant='h2' sx={{ mb: action ? 4 : 0 }}>
			{title}
		</Typography>
		{action}
	</Container>
);
