'use client';

import { getInstructors } from '@services/instructors';
import { Box, CircularProgress, Paper, Stack, Typography } from '@ui';
import { useQuery } from '@tanstack/react-query';

export const ONasView = () => {
	const { data: instructors = [], isLoading } = useQuery({
		queryKey: ['instructors'],
		queryFn: getInstructors,
	});

	return (
		<Box sx={{ px: { xs: 2, md: 4 }, py: 4, maxWidth: 800, mx: 'auto' }}>
			<Typography variant='h4' component='h1' gutterBottom>
				O nas
			</Typography>
			<Typography color='text.secondary' sx={{ mb: 3 }}>
				Szkolenia Glocksklep — praktyczne szkolenia strzeleckie prowadzone przez doświadczonych
				instruktorów.
			</Typography>

			<Typography variant='h6' gutterBottom>
				Instruktorzy
			</Typography>
			{isLoading ? (
				<CircularProgress size={28} />
			) : (
				<Stack spacing={2}>
					{instructors.map((instructor) => (
						<Paper key={instructor.id} variant='outlined' sx={{ p: 2 }}>
							<Typography sx={{ fontWeight: 700 }}>{instructor.name}</Typography>
							<Typography variant='body2' color='text.secondary' sx={{ whiteSpace: 'pre-wrap' }}>
								{instructor.bio}
							</Typography>
						</Paper>
					))}
					{instructors.length === 0 ? (
						<Typography color='text.secondary'>Informacje wkrótce.</Typography>
					) : null}
				</Stack>
			)}
		</Box>
	);
};
