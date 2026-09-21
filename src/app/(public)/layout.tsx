'use client';

import { SiteFooter, SiteHeader } from '@components';
import { Box, PageColumn } from '@ui';
import type { ReactNode } from 'react';

export default function PublicLayout({ children }: { readonly children: ReactNode }) {
	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
			<SiteHeader />
			<PageColumn component='main' sx={{ flex: 1 }}>
				{children}
			</PageColumn>
			<SiteFooter />
		</Box>
	);
}
