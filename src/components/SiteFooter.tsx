'use client';

import { Paths } from '@constants/paths';
import { Box, Container, Link, Stack, Typography } from '@ui';
import NextLink from 'next/link';

export const SiteFooter = () => (
	<Box
		component='footer'
		sx={{
			mt: 'auto',
			borderTop: 1,
			borderColor: 'divider',
			py: 3,
			bgcolor: 'background.subtle',
		}}
	>
		<Container maxWidth='xl'>
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
				</Stack>
			</Stack>
		</Container>
	</Box>
);
