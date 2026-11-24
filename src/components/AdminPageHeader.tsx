'use client';

import { Stack, Typography } from '@ui';
import type { ReactNode } from 'react';

type AdminPageHeaderProps = {
	readonly title: ReactNode;
	readonly actions?: ReactNode;
};

export const AdminPageHeader = ({ title, actions }: AdminPageHeaderProps) => (
	<Stack
		direction={{ xs: 'column', sm: 'row' }}
		spacing={1}
		sx={{
			mb: 3,
			alignItems: { xs: 'stretch', sm: 'center' },
			justifyContent: 'space-between',
			gap: 1,
		}}
	>
		<Typography variant='h5' sx={{ minWidth: 0 }}>
			{title}
		</Typography>
		{actions ? (
			<Stack
				direction={{ xs: 'column', sm: 'row' }}
				spacing={1}
				sx={{
					flexShrink: 0,
					flexWrap: 'wrap',
					'& .MuiButton-root': { minHeight: 44 },
				}}
			>
				{actions}
			</Stack>
		) : null}
	</Stack>
);