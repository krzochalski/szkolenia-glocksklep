'use client';

import { useAdminGuard } from '@hooks';
import { Box, CircularProgress, Typography } from '@ui';
import type { ReactNode } from 'react';

type Props = {
	readonly children: ReactNode;
};

export const AdminGate = ({ children }: Props) => {
	const { isAdmin, loading } = useAdminGuard();

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
				<CircularProgress />
			</Box>
		);
	}

	if (!isAdmin) {
		return (
			<Box sx={{ p: 4 }}>
				<Typography variant='h5'>Nie znaleziono</Typography>
			</Box>
		);
	}

	return <>{children}</>;
};
