'use client';

import { SiteFooter, SiteHeader } from '@components';
import { Box } from '@ui';
import { NotFoundView } from '@views/NotFound/NotFoundView';

export default function NotFound() {
	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
			<SiteHeader />
			<Box component='main' sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
				<NotFoundView sx={{ minHeight: '100%', flex: 1 }} />
			</Box>
			<SiteFooter />
		</Box>
	);
}
