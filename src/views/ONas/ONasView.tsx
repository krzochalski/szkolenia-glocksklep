'use client';

import { getInstructors } from '@services/instructors';
import {
	Box,
	CircularProgress,
	ContentSwap,
	Paper,
	Stagger,
	StaggerItem,
	Typography,
} from '@ui';
import { useQuery } from '@tanstack/react-query';

export const ONasView = () => {
	const { data: instructors = [], isLoading } = useQuery({
		queryKey: ['instructors'],
		queryFn: getInstructors,
	});

	const listState = isLoading ? 'loading' : instructors.length === 0 ? 'empty' : 'content';

	return (
		<Box sx={{ maxWidth: 800 }}>
			<Typography variant='h4' component='h1' gutterBottom>
				O nas
			</Typography>
			<Typography color='text.secondary' sx={{ mb: 3 }}>
				GLOCKSKLEP Szkolenia — praktyczne szkolenia strzeleckie prowadzone przez doświadczonych
				instruktorów.
			</Typography>

			<Typography variant='h6' gutterBottom>
				Instruktorzy
			</Typography>
			<ContentSwap state={listState}>
				{isLoading ? (
					<CircularProgress size={28} />
				) : instructors.length === 0 ? (
					<Typography color='text.secondary'>Informacje wkrótce.</Typography>
				) : (
					<Stagger sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
						{instructors.map((instructor) => (
							<StaggerItem key={instructor.id}>
								<Paper variant='outlined' sx={{ p: 2 }}>
									<Typography sx={{ fontWeight: 700 }}>{instructor.name}</Typography>
									<Typography
										variant='body2'
										color='text.secondary'
										sx={{ whiteSpace: 'pre-wrap' }}
									>
										{instructor.bio}
									</Typography>
								</Paper>
							</StaggerItem>
						))}
					</Stagger>
				)}
			</ContentSwap>
		</Box>
	);
};
