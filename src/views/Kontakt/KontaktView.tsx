'use client';

import { Box, Link, Typography } from '@ui';

export const KontaktView = () => (
	<Box sx={{ px: { xs: 2, md: 4 }, py: 4, maxWidth: 640, mx: 'auto' }}>
		<Typography variant='h4' component='h1' gutterBottom>
			Kontakt
		</Typography>
		<Typography color='text.secondary' sx={{ mb: 3 }}>
			Masz pytanie o szkolenie? Napisz do nas.
		</Typography>
		<Typography>
			E-mail:{' '}
			<Link href='mailto:szkolenia@glocksklep.pl'>szkolenia@glocksklep.pl</Link>
		</Typography>
		<Typography sx={{ mt: 1 }}>
			Telefon: <Link href='tel:+48530556523'>+48 530 556 523</Link>
		</Typography>
	</Box>
);
