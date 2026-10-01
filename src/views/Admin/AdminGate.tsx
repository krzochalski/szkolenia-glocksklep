'use client';

import { useAdminGuard } from '@hooks';
import { Box, CircularProgress, ContentSwap } from '@ui';
import { NotFoundView } from '@views/NotFound/NotFoundView';
import type { ReactNode } from 'react';

type Props = {
	readonly children: ReactNode;
};

export const AdminGate = ({ children }: Props) => {
	const { isAdmin, loading } = useAdminGuard();

	const gateState = loading ? 'loading' : !isAdmin ? 'notfound' : 'admin';

	return (
		<ContentSwap state={gateState}>
			{loading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', p: 4, minHeight: '100vh' }}>
					<CircularProgress />
				</Box>
			) : !isAdmin ? (
				<NotFoundView />
			) : (
				children
			)}
		</ContentSwap>
	);
};
