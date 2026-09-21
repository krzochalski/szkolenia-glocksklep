'use client';

import { Paths } from '@constants/paths';
import { Box, Button, Typography } from '@ui';
import NextLink from 'next/link';

export const NotFoundView = () => (
	<Box sx={{ p: 6, textAlign: 'center' }}>
		<Typography variant='h3' component='h1' gutterBottom>
			Nie znaleziono
		</Typography>
		<Typography color='text.secondary' sx={{ mb: 3 }}>
			Strona, której szukasz, nie istnieje.
		</Typography>
		<Button component={NextLink} href={Paths.home} variant='contained'>
			Strona główna
		</Button>
	</Box>
);
