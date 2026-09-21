'use client';

import { SiteFooter, SiteHeader } from '@components';
import { Box } from '@ui';
import type { ReactNode } from 'react';

export default function PublicLayout({ children }: { readonly children: ReactNode }) {
	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
			<SiteHeader />
			<Box component='main' sx={{ flex: 1 }}>
				{children}
			</Box>
			<SiteFooter />
		</Box>
	);
}
