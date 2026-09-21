'use client';

import { Paths } from '@constants/paths';
import { Box, Link, Stack, Typography } from '@ui';
import NextLink from 'next/link';

export const SiteFooter = () => (
	<Box
		component='footer'
		sx={{
			mt: 'auto',
			borderTop: 1,
			borderColor: 'divider',
			px: { xs: 2, md: 4 },
			py: 3,
			bgcolor: 'background.subtle',
		}}
	>
		<Stack
			direction={{ xs: 'column', sm: 'row' }}
			spacing={2}
			sx={{
				alignItems: { xs: 'flex-start', sm: 'center' },
				justifyContent: 'space-between',
			}}
		>
			<Typography variant='body2' color='text.secondary'>
				© {new Date().getFullYear()} Szkolenia Glocksklep
			</Typography>
			<Stack direction='row' spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
				<Link component={NextLink} href={Paths.regulamin} underline='hover' color='text.secondary'>
					Regulamin
				</Link>
				<Link component={NextLink} href={Paths.faq} underline='hover' color='text.secondary'>
					FAQ
				</Link>
				<Link component={NextLink} href={Paths.kontakt} underline='hover' color='text.secondary'>
					Kontakt
				</Link>
			</Stack>
		</Stack>
	</Box>
);
