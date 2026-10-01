'use client';

import { useAdminGuard } from '@hooks';
import { Box, CircularProgress } from '@ui';
import { NotFoundView } from '@views/NotFound/NotFoundView';
import type { ReactNode } from 'react';

type Props = {
	readonly children: ReactNode;
};

export const AdminGate = ({ children }: Props) => {
	const { isAdmin, loading } = useAdminGuard();

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', p: 4, minHeight: '100vh' }}>
				<CircularProgress />
			</Box>
		);
	}

	if (!isAdmin) {
		return <NotFoundView />;
	}

	return <>{children}</>;
};
