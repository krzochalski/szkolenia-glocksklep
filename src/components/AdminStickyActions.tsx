'use client';

import { Stack } from '@ui';
import type { ReactNode } from 'react';

type AdminStickyActionsProps = {
	readonly children: ReactNode;
	readonly justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between';
};

/**
 * Keeps page-level admin save/actions visible while the AdminShell main pane scrolls.
 */
export const AdminStickyActions = ({
	children,
	justifyContent = 'flex-start',
}: AdminStickyActionsProps) => (
	<Stack
		direction={{ xs: 'column', sm: 'row' }}
		spacing={1}
		sx={{
			position: 'sticky',
			bottom: 0,
			zIndex: 5,
			justifyContent,
			alignItems: { xs: 'stretch', sm: 'center' },
			flexWrap: 'wrap',
			'& .MuiButton-root': { minHeight: 44 },
			bgcolor: 'background.paper',
			borderTop: '3px solid',
			borderColor: 'ink.main',
			py: 1.5,
			mt: 2,
			px: 0,
			pb: 'max(12px, env(safe-area-inset-bottom))',
		}}
	>
		{children}
	</Stack>
);
