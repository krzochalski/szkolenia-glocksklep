'use client';

import { Paths } from '@constants/paths';
import { Box, Button, Stack, Typography } from '@ui';
import NextLink from 'next/link';

export const HomeView = () => (
	<Box>
		<Typography
			variant='h1'
			component='h1'
			sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' }, fontWeight: 800, mb: 2 }}
		>
			Szkolenia Glocksklep
		</Typography>
		<Typography variant='h6' color='text.secondary' sx={{ maxWidth: 560, mb: 4, fontWeight: 400 }}>
			Profesjonalne szkolenia strzeleckie — sprawdź najbliższe terminy i zapisz się online.
		</Typography>
		<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
			<Button component={NextLink} href={Paths.najblizszeSzkolenia} variant='contained' size='large'>
				Najbliższe szkolenia
			</Button>
			<Button component={NextLink} href={Paths.courses} variant='outlined' size='large'>
				Wszystkie szkolenia
			</Button>
		</Stack>
	</Box>
);
